-- HUMAN-HUB Salon System — Phase 4: 月次給与計算（実行と明細）
-- payroll_runs: 対象月ごとの計算バッチ（下書き/確定）。
-- payslips:     スタッフ別の明細（実働・基本給・手当・控除・調整・総支給・差引支給）。
-- 確定（confirmed）した月のシフトは読み取り専用にロックする。

-- ========== ENUM ==========
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payroll_status') then
    create type payroll_status as enum ('draft', 'confirmed');
  end if;
end $$;

-- ========== payroll_runs ==========
create table if not exists payroll_runs (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  period       text not null,                -- 'YYYY-MM'
  status       payroll_status not null default 'draft',
  confirmed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, period)
);
create index if not exists payroll_runs_tenant_idx on payroll_runs (tenant_id);

-- ========== payslips ==========
create table if not exists payslips (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  run_id      uuid not null references payroll_runs(id) on delete cascade,
  staff_id    text not null references staff(id) on delete cascade,
  worked_min  integer not null default 0,    -- 実働（分）
  base_pay    numeric(12,2) not null default 0,
  allowance   numeric(12,2) not null default 0,
  deduction   numeric(12,2) not null default 0,
  adjustment  numeric(12,2) not null default 0,  -- 加減調整（残業手当・欠勤控除等）
  gross_pay   numeric(12,2) not null default 0,
  net_pay     numeric(12,2) not null default 0,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (run_id, staff_id)
);
create index if not exists payslips_tenant_idx on payslips (tenant_id);
create index if not exists payslips_staff_idx on payslips (staff_id);

-- ========== tenant_id 自動補完 & updated_at ==========
drop trigger if exists trg_payslips_tenant on payslips;
create trigger trg_payslips_tenant
  before insert on payslips
  for each row execute function public.set_tenant_from_staff();

drop trigger if exists trg_payroll_runs_updated on payroll_runs;
create trigger trg_payroll_runs_updated
  before update on payroll_runs
  for each row execute function set_updated_at();
drop trigger if exists trg_payslips_updated on payslips;
create trigger trg_payslips_updated
  before update on payslips
  for each row execute function set_updated_at();

-- ========== RLS ==========
alter table payroll_runs enable row level security;
drop policy if exists payroll_runs_select on payroll_runs;
drop policy if exists payroll_runs_write  on payroll_runs;
-- run はオーナーのみ（閲覧・作成・確定）。
create policy payroll_runs_select on payroll_runs
  for select to authenticated
  using (tenant_id in (select public.user_tenant_ids()) and public.is_tenant_owner(tenant_id));
create policy payroll_runs_write on payroll_runs
  for all to authenticated
  using (tenant_id in (select public.user_tenant_ids()) and public.is_tenant_owner(tenant_id))
  with check (tenant_id in (select public.user_tenant_ids()) and public.is_tenant_owner(tenant_id));

alter table payslips enable row level security;
drop policy if exists payslips_select on payslips;
drop policy if exists payslips_write  on payslips;
-- 明細はオーナー全員分、スタッフは自分の分のみ閲覧。編集はオーナーのみ。
create policy payslips_select on payslips
  for select to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  );
create policy payslips_write on payslips
  for all to authenticated
  using (tenant_id in (select public.user_tenant_ids()) and public.is_tenant_owner(tenant_id))
  with check (tenant_id in (select public.user_tenant_ids()) and public.is_tenant_owner(tenant_id));

-- ========== シフトロック: 確定済み月は編集不可 ==========
-- 指定テナント・日付の属する月が確定済みか。
create or replace function public.is_period_locked(t uuid, d date)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.payroll_runs
    where tenant_id = t
      and status = 'confirmed'
      and period = to_char(d, 'YYYY-MM')
  );
$$;
grant execute on function public.is_period_locked(uuid, date) to authenticated;

-- shift_entries の書き込みポリシーを、確定月ロックを加味して張り直す。
drop policy if exists shift_entries_insert on shift_entries;
drop policy if exists shift_entries_update on shift_entries;
drop policy if exists shift_entries_delete on shift_entries;

create policy shift_entries_insert on shift_entries
  for insert to authenticated
  with check (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
    and not public.is_period_locked(tenant_id, work_date)
  );

create policy shift_entries_update on shift_entries
  for update to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
    and not public.is_period_locked(tenant_id, work_date)
  )
  with check (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
    and not public.is_period_locked(tenant_id, work_date)
  );

create policy shift_entries_delete on shift_entries
  for delete to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
    and not public.is_period_locked(tenant_id, work_date)
  );

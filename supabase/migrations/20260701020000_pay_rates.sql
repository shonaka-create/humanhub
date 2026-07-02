-- HUMAN-HUB Salon System — Phase 3: 給与テーブル（時給・手当）
-- スタッフごとの時給と手当を、適用開始日付き（履歴）で保持する。
-- 「◯月から時給改定」を正しく計算できるよう effective_from を持つ。
-- 編集はオーナーのみ。スタッフは自分の時給を閲覧できる（RLS）。

create table if not exists pay_rates (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  staff_id          text not null references staff(id) on delete cascade,
  effective_from    date not null,
  hourly_wage       numeric(10,2) not null default 0,   -- 時給
  commute_allowance numeric(10,2) not null default 0,   -- 交通費（月額）
  other_allowance   numeric(10,2) not null default 0,   -- その他手当（月額）
  note              text,
  updated_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (staff_id, effective_from)
);
create index if not exists pay_rates_tenant_idx on pay_rates (tenant_id);
create index if not exists pay_rates_staff_idx on pay_rates (staff_id, effective_from desc);

-- staff_id から tenant_id を自動補完（insert 時）。
create or replace function public.set_tenant_from_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id from public.staff where id = new.staff_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pay_rates_tenant on pay_rates;
create trigger trg_pay_rates_tenant
  before insert on pay_rates
  for each row execute function public.set_tenant_from_staff();

drop trigger if exists trg_pay_rates_updated on pay_rates;
create trigger trg_pay_rates_updated
  before update on pay_rates
  for each row execute function set_updated_at();

-- ========== RLS ==========
-- 閲覧: オーナーは全員分、スタッフは自分（staff.user_id = auth.uid()）の分のみ。
-- 編集: オーナーのみ（スタッフは自分の給与を変更できない）。
alter table pay_rates enable row level security;

drop policy if exists pay_rates_select on pay_rates;
drop policy if exists pay_rates_write  on pay_rates;

create policy pay_rates_select on pay_rates
  for select to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  );

create policy pay_rates_write on pay_rates
  for all to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and public.is_tenant_owner(tenant_id)
  )
  with check (
    tenant_id in (select public.user_tenant_ids())
    and public.is_tenant_owner(tenant_id)
  );

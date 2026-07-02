-- HUMAN-HUB Salon System — Phase 2: 日付ベースのシフト実績（マルチテナント対応）
-- 週テンプレート（shifts）とは別に、実際に働いた日単位の記録を持つ。
-- これが給与計算の「実働時間」の源泉になる。テンプレからの一括生成後、
-- オーナー（全員分）・スタッフ（自分の分）が各日を自由に修正/削除できる。

-- ========== ENUM: shift_status ==========
do $$
begin
  if not exists (select 1 from pg_type where typname = 'shift_status') then
    create type shift_status as enum ('worked', 'off', 'paid_leave');
  end if;
end $$;

-- ========== shift_entries ==========
create table if not exists shift_entries (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  staff_id    text not null references staff(id) on delete cascade,
  work_date   date not null,
  start_time  time not null,
  end_time    time not null,
  break_min   integer not null default 0,
  status      shift_status not null default 'worked',
  note        text,
  tone        tone not null default 'accent',
  updated_by  uuid,                         -- 最終編集者（auth.uid）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (staff_id, work_date)
);
create index if not exists shift_entries_tenant_idx on shift_entries (tenant_id);
create index if not exists shift_entries_date_idx on shift_entries (work_date);
create index if not exists shift_entries_staff_date_idx on shift_entries (staff_id, work_date);

-- ========== tenant_id を staff から自動補完（insert 時）==========
create or replace function public.set_shift_entry_tenant()
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

drop trigger if exists trg_shift_entries_tenant on shift_entries;
create trigger trg_shift_entries_tenant
  before insert on shift_entries
  for each row execute function public.set_shift_entry_tenant();

drop trigger if exists trg_shift_entries_updated on shift_entries;
create trigger trg_shift_entries_updated
  before update on shift_entries
  for each row execute function set_updated_at();

-- ========== RLS ==========
-- 閲覧: 同じテナントのメンバーは全員分を閲覧可（店舗のシフト表として共有）。
-- 編集: テナントのオーナーは全員分、スタッフは自分（staff.user_id = auth.uid()）の行のみ。
alter table shift_entries enable row level security;

drop policy if exists shift_entries_select on shift_entries;
drop policy if exists shift_entries_insert on shift_entries;
drop policy if exists shift_entries_update on shift_entries;
drop policy if exists shift_entries_delete on shift_entries;

create policy shift_entries_select on shift_entries
  for select to authenticated
  using (tenant_id in (select public.user_tenant_ids()));

create policy shift_entries_insert on shift_entries
  for insert to authenticated
  with check (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  );

create policy shift_entries_update on shift_entries
  for update to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  )
  with check (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  );

create policy shift_entries_delete on shift_entries
  for delete to authenticated
  using (
    tenant_id in (select public.user_tenant_ids())
    and (public.is_tenant_owner(tenant_id) or public.staff_is_self(staff_id))
  );

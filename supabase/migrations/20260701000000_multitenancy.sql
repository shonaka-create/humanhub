-- HUMAN-HUB Salon System — マルチテナント化
-- 目的:
--   1. テナント（店舗）境界を導入し、全業務データを tenant_id で分離する。
--   2. ログインユーザー（auth.users）と店舗・ロールを結ぶ memberships を新設する。
--   3. RLS を「ログイン済みなら全件」から「自分の所属テナントのみ」へ書き換える。
--   4. 招待（invites）で 2 人目以降のメンバーを迎え入れられるようにする。
--
-- 設計メモ:
--   - ロール（owner/staff）は memberships が正。staff は施術者などの業務レコードで、
--     20260701000010_staff_user_link.sql で任意に auth ユーザーと 1:1 紐付けする。
--   - services はテナント横断の共有カタログ（i18n キー PK）のためテナント分離しない。
--   - 既存データ／既存ユーザーは「既定のサロン」に移行し、既存ユーザーは owner にする。

-- ========== テナント ==========
create table tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ========== ロール ==========
create type member_role as enum ('owner', 'staff');

-- ========== メンバーシップ（auth.user × tenant × role）==========
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         member_role not null default 'staff',
  display_name text,
  email        text,
  created_at   timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index on memberships (user_id);
create index on memberships (tenant_id);

-- ========== 招待 ==========
create table invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null,
  role        member_role not null default 'staff',
  token       text not null unique,
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create index on invites (tenant_id);

-- ========== RLS ヘルパー（SECURITY DEFINER で memberships の再帰を避ける）==========
-- 現在のユーザーが所属するテナント ID 群。
create or replace function public.user_tenant_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.memberships where user_id = auth.uid()
$$;

-- 現在のユーザーが指定テナントの owner か。
create or replace function public.is_tenant_owner(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.memberships
    where user_id = auth.uid() and tenant_id = t and role = 'owner'
  )
$$;

grant execute on function public.user_tenant_ids() to authenticated;
grant execute on function public.is_tenant_owner(uuid) to authenticated;

-- ========== tenants / memberships / invites の RLS ==========
alter table tenants enable row level security;
-- 所属テナントのみ閲覧。作成はサーバー（service_role）経由で行うため insert ポリシーは置かない。
create policy tenants_select on tenants
  for select to authenticated
  using (id in (select public.user_tenant_ids()));
create policy tenants_update on tenants
  for update to authenticated
  using (public.is_tenant_owner(id))
  with check (public.is_tenant_owner(id));

alter table memberships enable row level security;
-- 同じテナントのメンバーは一覧を閲覧できる（設定画面の権限一覧用）。
create policy memberships_select on memberships
  for select to authenticated
  using (tenant_id in (select public.user_tenant_ids()));
-- 追加・変更・削除は owner のみ。
create policy memberships_insert on memberships
  for insert to authenticated
  with check (public.is_tenant_owner(tenant_id));
create policy memberships_update on memberships
  for update to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));
create policy memberships_delete on memberships
  for delete to authenticated
  using (public.is_tenant_owner(tenant_id));

alter table invites enable row level security;
-- 招待の閲覧・発行・取消は owner のみ。受諾（accepted_at 更新）はサーバー経由。
create policy invites_owner_all on invites
  for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

-- ========== 業務テーブルへ tenant_id 付与＋RLS 書き換え＋既存データ移行 ==========
do $$
declare
  t text;
  default_tenant uuid;
begin
  -- 既存データの引き取り先となる既定テナントを作成。
  insert into public.tenants (name) values ('既定のサロン') returning id into default_tenant;

  foreach t in array array[
    'staff','customers','customer_memos','follow_ups',
    'bookings','shifts','inventory_items','orders','transactions'
  ]
  loop
    execute format('alter table public.%I add column tenant_id uuid references public.tenants(id) on delete cascade;', t);
    execute format('update public.%I set tenant_id = %L;', t, default_tenant);
    execute format('alter table public.%I alter column tenant_id set not null;', t);
    execute format('create index on public.%I (tenant_id);', t);
    -- 旧「ログイン済みは全件」ポリシーを撤去し、テナント分離ポリシーに置換。
    execute format('drop policy if exists "authenticated full access" on public.%I;', t);
    execute format($f$
      create policy tenant_isolation on public.%I
        for all to authenticated
        using (tenant_id in (select public.user_tenant_ids()))
        with check (tenant_id in (select public.user_tenant_ids()));
    $f$, t);
  end loop;

  -- 既存の auth ユーザーを既定テナントの owner として引き継ぐ。
  insert into public.memberships (tenant_id, user_id, role, display_name, email)
  select
    default_tenant,
    u.id,
    'owner'::public.member_role,
    coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), split_part(u.email, '@', 1)),
    u.email
  from auth.users u
  on conflict (tenant_id, user_id) do nothing;
end $$;

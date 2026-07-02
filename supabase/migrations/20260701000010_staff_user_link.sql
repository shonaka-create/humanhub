-- HUMAN-HUB Salon System — Phase 1: staff とログインアカウントの紐付け
-- マルチテナント化（20260701000000_multitenancy.sql）により、ロール（owner/staff）は
-- memberships が正となった。ここでは staff（施術者などの業務レコード）に、任意で
-- ログイン auth ユーザーを 1:1 で結ぶ user_id を追加し、「本人判定」に使えるようにする。
-- これにより「スタッフは自分のシフトだけ編集」をテナント分離と両立して実現できる。
-- ※ staff.tenant_id はマルチテナント移行で付与済み。

alter table staff
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 同一テナント内で 1 auth ユーザー = 1 staff。
create unique index if not exists staff_tenant_user_key
  on staff (tenant_id, user_id)
  where user_id is not null;

-- 指定 staff 行がログイン中ユーザー本人か（RLS ポリシーから使うヘルパ）。
create or replace function public.staff_is_self(sid text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.staff where id = sid and user_id = auth.uid());
$$;

grant execute on function public.staff_is_self(text) to authenticated;

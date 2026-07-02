-- HUMAN-HUB Salon System — memberships.user_id ユニーク制約
-- 初回ログイン時の ensureMembership が同時多重実行されると、テナントを二重作成し
-- 同一ユーザーに複数の membership（＝複数テナントのオーナー）ができてしまう事象があった。
-- このアプリは実質「1ユーザー1テナント」設計（readMembership が最古の1件のみ採用）のため、
-- user_id に一意制約を張って二重作成を DB 側で防ぐ。
-- 既存の unique(tenant_id, user_id) は別テナントへの重複を防げないため、これを追加する。

-- --- 既存の重複を先に解消（そのままでは unique index の作成が失敗するため）---
-- 同一 user_id に複数 membership がある場合、最古の1件だけを残して残りを削除する。
-- 削除により誰も所属しなくなり、かつ業務データも無い「孤児テナント」も掃除する
-- （レース時に作られた空テナントのみが対象。実データを持つテナントは残す）。
with ranked as (
  select id,
         row_number() over (partition by user_id order by created_at asc) as rn
  from public.memberships
)
delete from public.memberships m
using ranked r
where m.id = r.id
  and r.rn > 1;

delete from public.tenants t
where not exists (select 1 from public.memberships m where m.tenant_id = t.id)
  and not exists (select 1 from public.staff       s where s.tenant_id = t.id)
  and not exists (select 1 from public.customers   c where c.tenant_id = t.id)
  and not exists (select 1 from public.bookings    b where b.tenant_id = t.id)
  and not exists (select 1 from public.transactions x where x.tenant_id = t.id);

create unique index if not exists memberships_user_uniq on public.memberships (user_id);

-- HUMAN-HUB Salon System — staff とログインアカウントをメールアドレスで紐付け
-- これまで staff（業務レコード）と memberships（ログインアカウント）は別物で、
-- staff.user_id は誰も設定していなかったため「本人判定」（自分のシフト／給与明細）が
-- 効かなかった。ここでは staff にメールアドレスを持たせ、同一テナント内で
-- memberships.email と一致する staff を自動で結び付ける（staff.user_id を補完）。
--
-- 紐付けは「どちらが先に登録されても」成立するよう、両テーブルにトリガーを置く:
--   - membership 追加時 → 同テナントの未紐付け staff（email 一致）に user_id を付与。
--   - staff 追加/メール変更時 → 既存 membership（email 一致）があれば user_id を付与。
-- いずれも大文字小文字を無視して照合する。既存の unique index
-- staff_tenant_user_key により「1テナント=1auth=1staff」は保証される。

alter table staff
  add column if not exists email text;

-- membership 側の変化で staff を紐付ける。
create or replace function public.link_staff_on_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and new.email <> '' then
    update public.staff s
    set user_id = new.user_id, updated_at = now()
    where s.tenant_id = new.tenant_id
      and s.user_id is null
      and s.email is not null
      and lower(s.email) = lower(new.email);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_membership_link_staff on memberships;
create trigger trg_membership_link_staff
  after insert or update of email, user_id on memberships
  for each row execute function public.link_staff_on_membership();

-- staff 側の変化で既存 membership に紐付ける。
create or replace function public.link_membership_on_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if new.user_id is null and new.email is not null and new.email <> '' then
    select m.user_id into uid
    from public.memberships m
    where m.tenant_id = new.tenant_id
      and m.email is not null
      and lower(m.email) = lower(new.email)
    order by m.created_at asc
    limit 1;
    if uid is not null then
      update public.staff set user_id = uid where id = new.id and user_id is null;
    end if;
  end if;
  return null;
end;
$$;

-- staff の tenant_id は before-insert トリガー（trg_staff_tenant）で補完されるため、
-- 紐付けは after で行い new.tenant_id が確定した状態で照合する。
drop trigger if exists trg_staff_link_membership on staff;
create trigger trg_staff_link_membership
  after insert on staff
  for each row execute function public.link_membership_on_staff();

drop trigger if exists trg_staff_link_membership_upd on staff;
create trigger trg_staff_link_membership_upd
  after update of email on staff
  for each row when (new.user_id is null)
  execute function public.link_membership_on_staff();

-- 既存データのバックフィル（email が既に入っている分を一括で紐付け）。
update public.staff s
set user_id = m.user_id, updated_at = now()
from public.memberships m
where s.user_id is null
  and s.email is not null and s.email <> ''
  and m.tenant_id = s.tenant_id
  and m.email is not null
  and lower(m.email) = lower(s.email);

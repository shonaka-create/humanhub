-- HUMAN-HUB Salon System — tenant_id 自動補完
-- multitenancy 移行で全業務テーブルに tenant_id（not null）＋テナント分離 RLS を付与した。
-- 既存の Server Actions は tenant_id を明示していないため、そのままでは
-- 「tenant_id が null → WITH CHECK 不成立」で INSERT が弾かれる。
-- ここでは BEFORE INSERT トリガーで、ログイン中ユーザーの所属テナントを自動補完する。
-- （明示的に tenant_id が入っている場合はそれを尊重する。）
-- ※ shift_entries は自前のトリガー（staff から補完）を持つため対象外。

create or replace function public.set_tenant_id_from_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id
    from public.memberships
    where user_id = auth.uid()
    order by created_at asc
    limit 1;
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'staff','customers','customer_memos','follow_ups',
    'bookings','shifts','inventory_items','orders','transactions'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_tenant on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_tenant before insert on public.%1$s '
      || 'for each row execute function public.set_tenant_id_from_user();',
      t
    );
  end loop;
end $$;

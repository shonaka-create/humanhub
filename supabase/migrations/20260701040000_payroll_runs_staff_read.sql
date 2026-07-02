-- HUMAN-HUB Salon System — Phase 5: スタッフが自分の給与明細を閲覧できるように
-- payslips は既に「オーナー全員分／スタッフは自分の分」で閲覧可。
-- ただし明細に紐づく対象月・状態は payroll_runs 側にあり、従来は owner のみ閲覧だった。
-- スタッフが自分の明細の「対象月／確定状態」を見られるよう、run の SELECT を
-- テナントメンバー全員に広げる（金額情報は payslips の RLS で本人分に限定されたまま）。

drop policy if exists payroll_runs_select on payroll_runs;
create policy payroll_runs_select on payroll_runs
  for select to authenticated
  using (tenant_id in (select public.user_tenant_ids()));

-- 作成・確定などの書き込みは引き続きオーナーのみ（payroll_runs_write は変更なし）。

-- HUMAN-HUB Salon System — アクセス分析（PRO）の14日間無料トライアル
-- テナントごとにトライアル開始日時を持たせ、開始から14日間は PRO 機能を開放する。
-- 開始はオーナーのみ（tenants_update ポリシー = is_tenant_owner）。1回だけ。

alter table tenants
  add column if not exists pro_trial_started_at timestamptz;

-- HUMAN-HUB — transactions シード（売上）。
-- 20260628010000_transactions.sql 適用後に実行。何度流しても安全。
-- 集計（サマリ/推移/カテゴリ/スタッフ別）はこのデータから算出される。

truncate table transactions restart identity;

-- seed 中は auth.uid() が無いため、tenant_id にデモサロンを一時デフォルトとして与える。
-- （seed.sql が先に「デモサロン」テナントを作成している前提。無ければここで作る。）
insert into tenants (id, name) values
  ('00000000-0000-0000-0000-0000000000aa', 'デモサロン')
  on conflict (id) do nothing;
alter table transactions alter column tenant_id set default '00000000-0000-0000-0000-0000000000aa';

-- ===== 当月（2026-06）: 詳細トランザクション =====
insert into transactions (txn_date, customer_name, staff_id, service_key, category, amount) values
  ('2026-06-02', '山田 花子',    'emma', 'svcCutColor', 'service', 245),
  ('2026-06-03', '佐藤 美咲',    'aoi',  'svcSpa',      'service', 120),
  ('2026-06-04', 'Olivia Chen',  'emma', 'svcCut',      'service', 85),
  ('2026-06-05', '田中 葵',      'mei',  'svcColor',    'service', 165),
  ('2026-06-06', '渡辺 葵',      'yuki', 'svcCutColor', 'service', 245),
  ('2026-06-08', 'Sophie Müller','aoi',  'svcSpa',      'service', 120),
  ('2026-06-09', 'James Lee',    'liam', 'svcCut',      'service', 85),
  ('2026-06-10', '小林 美月',    'mei',  'svcColor',    'service', 165),
  ('2026-06-11', '伊藤 さくら',  'emma', 'svcColor',    'service', 165),
  ('2026-06-12', 'Emily Brown',  'yuki', 'svcCut',      'service', 85),
  ('2026-06-13', '中村 桃子',    'aoi',  'svcCutColor', 'service', 245),
  ('2026-06-15', '山本 結衣',    'emma', 'svcColor',    'service', 165),
  ('2026-06-16', '佐藤 美咲',    'mei',  'svcSpa',      'service', 120),
  ('2026-06-17', '田中 葵',      'yuki', 'svcColor',    'service', 165),
  ('2026-06-18', 'Olivia Chen',  'emma', 'svcCut',      'service', 85),
  ('2026-06-19', '渡辺 葵',      'liam', 'svcCutColor', 'service', 245),
  ('2026-06-20', 'Sophie Müller','aoi',  'svcSpa',      'service', 120),
  ('2026-06-22', '小林 美月',    'yuki', 'svcColor',    'service', 165),
  ('2026-06-24', '山本 結衣',    'emma', 'svcCutColor', 'service', 245),
  ('2026-06-25', 'James Lee',    'liam', 'svcCut',      'service', 85),
  ('2026-06-26', '田中 葵',      'mei',  'svcColor',    'service', 165),
  ('2026-06-27', '山田 花子',    'emma', 'svcCutColor', 'service', 245),
  ('2026-06-27', '佐藤 美咲',    'aoi',  'svcSpa',      'service', 120),
  -- 店販（retail, service_key なし）
  ('2026-06-05', '田中 葵',      'mei',  null, 'retail', 68),
  ('2026-06-11', '伊藤 さくら',  'emma', null, 'retail', 42),
  ('2026-06-18', 'Olivia Chen',  'emma', null, 'retail', 55),
  ('2026-06-24', '山本 結衣',    'aoi',  null, 'retail', 78),
  ('2026-06-26', '渡辺 葵',      'yuki', null, 'retail', 36);

-- ===== 過去5ヶ月（2026-01〜05）: 推移用 =====
insert into transactions (txn_date, customer_name, staff_id, service_key, category, amount) values
  ('2026-01-15', '常連A', 'emma', 'svcColor',    'service', 4200),
  ('2026-01-20', '常連B', 'yuki', 'svcCutColor', 'service', 5100),
  ('2026-01-25', '常連C', 'aoi',  'svcCut',      'service', 4600),
  ('2026-02-14', '常連A', 'emma', 'svcColor',    'service', 4800),
  ('2026-02-19', '常連B', 'mei',  'svcSpa',      'service', 4900),
  ('2026-02-24', '常連C', 'yuki', 'svcCutColor', 'service', 4900),
  ('2026-03-12', '常連A', 'emma', 'svcColor',    'service', 5300),
  ('2026-03-18', '常連B', 'aoi',  'svcCut',      'service', 5200),
  ('2026-03-26', '常連C', 'yuki', 'svcCutColor', 'service', 5300),
  ('2026-04-10', '常連A', 'emma', 'svcSpa',      'service', 5000),
  ('2026-04-17', '常連B', 'mei',  'svcColor',    'service', 5100),
  ('2026-04-23', '常連C', 'liam', 'svcCut',      'service', 5100),
  ('2026-05-09', '常連A', 'emma', 'svcColor',    'service', 5500),
  ('2026-05-16', '常連B', 'yuki', 'svcCutColor', 'service', 5450),
  ('2026-05-22', '常連C', 'aoi',  'svcSpa',      'service', 5500);

alter table transactions alter column tenant_id drop default;

# HUMAN-HUB — Salon System

美容サービス管理システム / Salon management system.

Claude Design のプロトタイプ（`SalonSystem.dc.html`）をベースに、Next.js (App Router) + TypeScript で再構築したものです。現在はモックデータで動作し、後から Supabase に差し替えられる構成になっています。

## 機能 / Screens

| ルート | 画面 | 内容 |
| --- | --- | --- |
| `/` | ダッシュボード | 本日の予約・出勤・要フォロー・在庫アラート |
| `/shifts` | シフト管理 | スタッフ別 週次グリッド |
| `/bookings` | 予約日程 | スタッフ別 当日タイムライン |
| `/customers` | 顧客管理 | 一覧／詳細（対話メモ・再訪フォロー）+ 一括メール作成 |
| `/inventory` | 資材発注 | 在庫一覧 / 発注・入荷タブ |
| `/access` | アクセス分析 | PRO プラン（有料ロック画面） |
| `/settings` | 設定 | プレースホルダー |

- 日本語 / English の2言語切り替え（左下トグル、`localStorage` に保存）

## 開発 / Getting started

```bash
npm install
npm run dev
```

http://localhost:3000 を開いてください。

## 構成 / Architecture

```
src/
  app/                 各画面（App Router）
  components/          AppShell / Sidebar / Header / 共通UI
  i18n/                dict.ts（ja/en 辞書）, LangProvider
  lib/
    types.ts           ドメイン型
    mock.ts            モックデータ（← Supabase に差し替え予定）
    tones.ts           カラートーン解決
    nav.ts             ナビ定義
```

### Supabase への移行方針

`src/lib/mock.ts` のエクスポートを、Supabase クエリを返すデータ層に置き換えるだけで済むよう、
画面コンポーネントは `src/lib/types.ts` の型にのみ依存しています。

## デザイン原典

- Claude Design: `SalonSystem.dc.html`（プロジェクト「美容サービス管理システム構成」）
- カラーパレット・タイポグラフィは `src/app/globals.css` の CSS 変数に集約

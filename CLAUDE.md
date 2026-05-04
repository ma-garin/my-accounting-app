# GirsBar-Len — 会計・時間管理 PWA

## プロジェクト概要

ガールズバー向けの会計・時間管理 PWA。ビルドステップなしの静的サイト。

## ディレクトリ構造

```
my-accounting-app/
├── CLAUDE.md               ← このファイル
├── docs/
│   ├── architecture.md     ← 技術設計・ファイル構成
│   └── features.md         ← 機能仕様
├── index.html              メイン画面（会計・タイマー）
├── simulation.html         金額シミュレーション画面
├── menu.html               ドリンクメニュー表示画面
├── settings.html           店舗別料金設定画面
├── app-core.js             共通データ・料金ロジック
├── manifest.json           PWA マニフェスト
├── service-worker.js       オフライン対応 SW
└── icons/                  アイコン画像
```

## 開発ルール

### 絶対に変更してはいけないこと

- 既存URL（`index.html`, `simulation.html`, `menu.html`, `settings.html`）
- `manifest.json` の `start_url`（`./index.html`）
- `localStorage` のキー名（`accounting_history`, `timer_state`, `store_profiles`, `active_store_profile_id`, `active_visit_session`, `saved_simulations`, `app_preferences`）

### 変更時の注意

- Service Worker のキャッシュバージョン (`CACHE_NAME`) はファイル変更時に必ず上げる
- 4画面間のナビゲーションは静的リンクで直接参照しているため、ファイル名変更禁止

## 開発サーバー起動

```bash
python3 -m http.server 8080
# → http://localhost:8080/index.html
```

Service Worker を正しく動作させるにはローカルサーバー経由が必須。

## 料金ロジック（変更時は tests が必要）

- 料金は `app-core.js` の店舗プロファイルから取得
- 既定値は 1セット目 ¥2,500、2セット目以降 ¥3,000 / 40分、サービス料 10%、消費税 10%
- 合計端数は100円単位で四捨五入
- 履歴保存時は `profileSnapshot` を残し、後日の料金変更から切り離す

## 技術スタック

- 純粋な HTML/CSS/JavaScript（フレームワークなし）
- PWA: Service Worker + Web App Manifest
- データ永続化: localStorage のみ
- フォント: Google Fonts (Noto Sans JP) — CDN依存

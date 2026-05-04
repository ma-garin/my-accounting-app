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
├── manifest.json           PWA マニフェスト
├── service-worker.js       オフライン対応 SW
└── icons/                  アイコン画像
```

## 開発ルール

### 絶対に変更してはいけないこと

- `service-worker.js` 内の `urlsToCache` に含まれるファイルのパス・ファイル名
- `manifest.json` の `start_url`（`./index.html`）
- `localStorage` のキー名（`accounting_history`, `timer_state`, `budget_setting`, `checkout_time`）

### 変更時の注意

- Service Worker のキャッシュバージョン (`CACHE_NAME`) はファイル変更時に必ず上げる
- 3画面間のナビゲーションは `window.location.href` で直接参照しているため、ファイル名変更禁止

## 開発サーバー起動

```bash
python3 -m http.server 8080
# → http://localhost:8080/index.html
```

Service Worker を正しく動作させるにはローカルサーバー経由が必須。

## 料金ロジック（変更時は tests が必要）

| 項目 | 金額 |
|------|------|
| 1セット目 | ¥2,500 |
| 2セット目以降 | ¥3,000 / 40分 |
| サービス料 | 小計の 10% |
| 消費税 | (小計 + サービス料) の 10% |
| 合計端数 | 100円単位で四捨五入 |

## 技術スタック

- 純粋な HTML/CSS/JavaScript（フレームワークなし）
- PWA: Service Worker + Web App Manifest
- データ永続化: localStorage のみ
- フォント: Google Fonts (Cormorant Garamond, Noto Sans JP) — CDN依存

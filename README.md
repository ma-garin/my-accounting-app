# マイ会計・時間管理 (my-accounting-app)

時間管理と会計計算をまとめて行える、シンプルなPWA対応Webアプリです。  
`index.html`（会計・時間管理）、`simulation.html`（金額シミュレーション）、`menu.html`（メニュー確認）で構成されています。

## 主な機能

- 40分セット単位の時間管理（開始・一時停止・終了・リセット）
- ドリンク数量の加減算とリアルタイム合計表示
- サービス料10%・消費税10%を含む会計サマリー計算
- シミュレーション画面での滞在時間・ドリンク・シャンパン試算
- カスタムドリンク追加（最大5件）
- Service Worker + Manifest によるオフライン/PWA対応

## 画面

- `index.html`: 会計・時間管理のメイン画面
- `simulation.html`: 金額シミュレーション画面
- `menu.html`: ドリンク/シャンパンのメニュー表示

## ローカルでの使い方

ビルド不要の静的サイトです。ブラウザで `index.html` を開くだけでも動作します。  
Service Worker を正しく動かす場合は、ローカルサーバー経由で起動してください。

### 例: Pythonで起動

```bash
cd /Users/fujimagariyuki/Desktop/app/002/my-accounting-app
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080/index.html` を開きます。

## ファイル構成

```text
.
├─ index.html
├─ simulation.html
├─ menu.html
├─ manifest.json
├─ service-worker.js
└─ icons/
```

## GitHubにREADMEを反映する手順

このリポジトリには `origin` が設定済みです。

```bash
git add README.md
git commit -m "Add README"
git push origin main
```

`main` 以外のブランチ運用をしている場合は、最後のコマンドのブランチ名を置き換えてください。

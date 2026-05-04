# マイ会計・時間管理

ガールズバー来店中の時間、会計見込み、予算、履歴を端末内だけで管理する静的PWAです。保存はすべて `localStorage` のみで、外部送信やクラウド同期は行いません。

## 主な機能

- ラウンジダークUIとスマホ向け下部固定操作
- タイマー、セット数、次セット残り時間の自動計算
- クイック追加バー（L +1 / メガ +1 / SHOT +1）とUndo
- 店舗別料金プロファイル（セット料金、料率、ドリンク、シャンパン）
- 予算残り、予算80%超過、予算超過、退店制約の状態表示
- 会計履歴、実請求額、キャストメモ、料金スナップショット保存
- シミュレーションテンプレート、保存済みシミュレーション、履歴転用
- メニュー検索、価格帯フィルタ、カテゴリ折りたたみ、シャンパン総額ミニシミュ
- Service Worker + Manifest によるPWA対応

## 画面

- `index.html`: 会計・時間管理のメイン画面
- `simulation.html`: 金額シミュレーション画面
- `menu.html`: メニュー検索・価格確認画面
- `settings.html`: 店舗別料金設定画面

## ローカルでの使い方

ビルド不要の静的サイトです。Service Worker を正しく動かす場合は、ローカルサーバー経由で起動してください。

```bash
python3 -m http.server 8123
```

ブラウザで `http://127.0.0.1:8123/index.html` を開きます。

## ファイル構成

```text
.
├─ app-core.js
├─ index.html
├─ simulation.html
├─ menu.html
├─ settings.html
├─ theme.css
├─ manifest.json
├─ service-worker.js
├─ docs/
└─ icons/
```

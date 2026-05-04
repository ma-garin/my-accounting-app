# アーキテクチャ

## 全体設計

ビルドプロセスを持たない静的 PWA。4つの HTML 画面と、共通ロジック `app-core.js`、共通テーマ `theme.css` で構成する。

外部送信、クラウド同期、サーバー連携は行わず、保存先は端末内 `localStorage` のみ。

## ファイル構成と役割

| ファイル | 役割 |
|---------|------|
| `index.html` | メイン画面。タイマー、会計、予算、履歴、当日セッション管理 |
| `simulation.html` | 滞在時間、ドリンク、シャンパンの事前試算 |
| `menu.html` | メニュー検索、価格帯フィルタ、シャンパン総額ミニシミュ |
| `settings.html` | 店舗別料金プロファイル編集 |
| `app-core.js` | 共通データキー、店舗プロファイル、料金計算、履歴マイグレーション |
| `theme.css` | ラウンジダーク共通テーマ、下部タブ、ボトムシート、共通フォーム |
| `manifest.json` | PWA インストール設定 |
| `service-worker.js` | オフラインキャッシュ戦略 |

## 共通ロジック

`app-core.js` は `window.AppCore` を公開する。

主な責務:

- アプリバージョン `v2.16`
- `localStorage` キーの一元管理
- 既定店舗プロファイルの生成
- アクティブ店舗プロファイルの取得/保存
- 店舗料金スナップショットの作成
- 会計計算 `calculateBill()`
- 旧履歴から新形式へのマイグレーション
- 24時間以内の当日セッション保存/復元

## データ永続化

| キー | 内容 | ライフサイクル |
|-----|------|--------------|
| `accounting_history` | 会計保存履歴（最大50件、新形式へ自動マイグレーション） | 明示的削除まで永続 |
| `timer_state` | タイマー状態（後方互換用。会計画面でも更新） | リセット時に削除 |
| `store_profiles` | 店舗別料金プロファイル、料金変更履歴 | 明示的変更まで永続 |
| `active_store_profile_id` | 現在利用中の店舗ID | 明示的変更まで永続 |
| `active_visit_session` | 当日セッション（タイマー、数量、予算、退店制約、保存メモ） | 24時間を超えると自動復元しない |
| `saved_simulations` | 保存済みシミュレーション | 最大30件 |
| `app_preferences` | テーマ、起動方針、プライバシー表示設定 | 予約キー |
| `simulation_seed` | 履歴からシミュレーションへ転用する一時データ | 読み込み後に削除 |

## 料金計算フロー

```
profile = active store profile
setTotal =
  setCount >= 1
    ? firstSetPrice + (setCount - 1) * extensionSetPrice
    : 0
drinkTotal = profile.drinks + customDefs + profile.champagnes の数量合計
subtotal = setTotal + drinkTotal
service = floor(subtotal * serviceRate)
tax = floor((subtotal + service) * taxRate)
total = round((subtotal + service + tax) / 100) * 100
```

履歴保存時は `profileSnapshot` を残すため、後から店舗料金を変更しても過去会計の前提は失われない。

## Service Worker キャッシュ戦略

| リクエスト種別 | 戦略 |
|-------------|------|
| HTML ドキュメント | Network First（オフライン時はキャッシュフォールバック） |
| 画像、CSS、JS、その他静的ファイル | Cache First |

キャッシュ名は `my-accounting-app-v2.16`。バージョン変更時に古い `my-accounting-app-*` キャッシュを activate で削除する。

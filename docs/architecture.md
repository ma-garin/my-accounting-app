# アーキテクチャ

## 全体設計

ビルドプロセスを持たない静的 PWA。3つの独立した HTML ファイルで構成され、ページ間ナビゲーションは `window.location.href` による直接遷移。

## ファイル構成と役割

| ファイル | 役割 |
|---------|------|
| `index.html` | メイン画面。タイマー・ドリンク管理・会計計算・履歴をすべて含む |
| `simulation.html` | 滞在時間・ドリンク・シャンパンの事前試算画面 |
| `menu.html` | ドリンク/シャンパンのメニュー一覧表示 |
| `manifest.json` | PWA インストール設定 |
| `service-worker.js` | オフラインキャッシュ戦略 |

## index.html の内部構造

すべてのロジックは即時実行関数 (IIFE) にまとめられている。グローバルスコープを汚染しない。

```
IIFE
├── 定数定義 (SET_MIN, SVC, TAX, DRINKS, etc.)
├── 状態変数 (drinkQty, timerId, tsStart, budget, etc.)
├── calcTotal()       — 合計金額の再計算とDOM更新
├── setBudget()       — 予算設定と予算バーの初期化
├── updateBudgetUI()  — 予算バー・残予算・あと何杯の描画
├── updateCompare()   — 訪問比較セクションの更新
├── updateCheckout()  — 退店逆算セクションの更新
├── ドリンクUI
│   ├── mkCard()      — メインドリンクカードの生成
│   ├── mkAcc()       — アコーディオン内ドリンク行の生成
│   ├── mkCustom()    — カスタムドリンク行の生成
│   ├── renderDrinks()— 全ドリンクUIの再描画
│   └── updateQty()   — 数量変更とDOM部分更新
├── タイマー
│   ├── tick()        — 1秒ごとの表示更新
│   ├── startTimer()  — 開始（一時停止からの再開も含む）
│   ├── pauseTimer()  — 一時停止
│   ├── endTimer()    — 終了（状態リセット）
│   └── resetAll()    — 会計全リセット
├── 永続化
│   ├── saveTimer() / clearTimer() / loadTimer()
│   ├── loadHistory() / renderHistory() / saveBill()
│   └── loadBudget() — 現状は毎回リセット（意図的）
└── DOMContentLoaded — イベントリスナーの初期化
```

## データ永続化

localStorage のみ使用。サーバー通信なし。

| キー | 内容 | ライフサイクル |
|-----|------|--------------|
| `accounting_history` | 会計保存履歴（最大50件）| 明示的削除まで永続 |
| `timer_state` | タイマー状態（isRunning, tsStart, tsPaused） | リセット時に削除 |
| `budget_setting` | 現状未使用（毎入店で入力） | — |
| `checkout_time` | 退店予定時刻 | 現状未使用 |

## Service Worker キャッシュ戦略

| リクエスト種別 | 戦略 |
|-------------|------|
| HTML ドキュメント | Network First（オフライン時はキャッシュフォールバック） |
| 画像・その他静的ファイル | Cache First |

キャッシュ名は `my-accounting-app-v{バージョン}`。バージョンが変わると古いキャッシュは activate 時に自動削除される。

## 料金計算フロー

```
setCount から setTotal を計算
  → 1セット目: ¥2,500 / 2セット目以降: ¥3,000 each
drinkTotal = 全ドリンク × 単価 の合計
sub = setTotal + drinkTotal
svc = floor(sub × 0.10)
tax = floor((sub + svc) × 0.10)
total = round((sub + svc + tax) / 100) × 100  ← 100円単位丸め
```

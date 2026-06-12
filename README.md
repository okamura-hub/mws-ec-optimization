# MWS EC Optimization - AIエージェント基盤

> MY WAY SMART CO.,LTD のEC運営最適化・組織開発のためのAIエージェントシステム

## 概要

本プロジェクトは、議事録分析から抽出した課題を解決し、EC運営の最大価値を届けるためのAIエージェント基盤を構築します。

### 背景

- 議事録（2025年12月〜2026年6月、38回分）から課題を抽出
- EC運営（Amazon/楽天/Yahoo/auPay/Qoo10）の効率化・自動化
- 組織開発（マニュアル整備、CS連携、情報共有）の推進
- AIエージェント（Hermes Agent + Codex + Claude Code）の活用

### 目標

1. **EC運営の効率化**: 在庫管理、利益管理、SKU管理の自動化
2. **データ駆動型意思決定**: KPI可視化、ダッシュボード統合、分析自動化
3. **コンテンツ最適化**: 商品名SEO、LP改善、A+コンテンツ自動生成
4. **組織開発**: マニュアル整備、CS連携、情報共有の仕組み化
5. **商品開発支援**: アイデア管理、市場調査、仕入れ条件分析

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Hermes Agent (司令塔)                      │
│         Slack Gateway / Cron管理 / FSM状態管理               │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┐
    │            │            │            │
    ▼            ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│EC運営  │ │データ  │ │コンテンツ│ │組織開発│
│Agent   │ │分析    │ │最適化  │ │Agent   │
│        │ │Agent   │ │Agent   │ │        │
└────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│              実行エージェント層                            │
│    Codex CLI / Claude Code / OpenCode Go                 │
└─────────────────────────────────────────────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│              データ・API層                                │
│  Amazon Ads MCP / SellerSprite / Notion / Slack / CSV   │
└─────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構成

```
mws-ec-optimization/
├── README.md                          # このファイル
├── CHANGELOG.md                       # 変更履歴
├── CONTRIBUTING.md                    # 貢献ガイドライン
├── .gitignore                         # Git無視設定
├── .env.example                       # 環境変数テンプレート
├── package.json                       # パッケージ設定
├── tsconfig.json                      # TypeScript設定
├── jest.config.js                     # Jestテスト設定
├── docs/
│   ├── 01-challenges-analysis.md      # 議事録から抽出した課題分析
│   ├── 02-agent-design.md             # エージェント設計ドキュメント
│   ├── 03-implementation-roadmap.md   # 実装ロードマップ
│   ├── 04-integration-guide.md        # 既存システムとの統合ガイド
│   ├── api/
│   │   └── api-specification.md       # API仕様書
│   └── developer-guide.md             # 開発者ガイド
├── flows/
│   ├── inventory-alert-flow.ts        # 在庫アラートフロー ✅ 動作検証済み
│   ├── profit-management-flow.ts      # 利益管理フロー ✅ 動作検証済み
│   ├── title-validation-flow.ts       # 商品名バリデーションフロー ✅ 動作検証済み
│   └── roas-decline-detection-flow.ts # ROAS低下検出フロー ✅ 動作検証済み
├── shared/
│   └── tools/
│       ├── inventory-tools.ts         # 在庫データツール（モック）
│       ├── profit-tools.ts            # 利益データツール（モック）
│       ├── amazon-catalog-tools.ts    # Amazon商品カタログツール（モック）
│       ├── campaign-performance-tools.ts # キャンペーンパフォーマンスツール（モック）
│       └── slack-tools.ts             # Slack通知ツール（モック）
├── tests/
│   ├── inventory-alert-flow.test.ts   # 在庫アラートテスト（9件）
│   ├── profit-management-flow.test.ts # 利益管理テスト（10件）
│   ├── title-validation-flow.test.ts  # 商品名バリデーションテスト（17件）
│   └── roas-decline-detection-flow.test.ts # ROAS低下検出テスト（24件）
├── data/
│   └── test/
│       ├── inventory-test-data.json   # 在庫テストデータ
│       └── profit-test-data.json      # 利益テストデータ
├── prompts/
│   ├── analyze-meeting-notes.md       # 議事録分析プロンプト
│   └── full-analysis-prompt.md        # 包括分析プロンプト
├── outputs/
│   └── codex-issue-analysis-*.md      # Codex分析結果
└── .env.example                       # 環境変数テンプレート
```

---

## ドキュメント

| ドキュメント | 説明 |
|------------|------|
| [API仕様書](docs/api/api-specification.md) | TypeScriptモジュール API / HTTP API（予定） |
| [開発者ガイド](docs/developer-guide.md) | 開発環境セットアップ、コーディング規約 |
| [貢献ガイドライン](CONTRIBUTING.md) | Issue起票、PR作成、テスト方法 |
| [変更履歴](CHANGELOG.md) | リリースごとの変更点 |
| [課題分析](docs/01-challenges-analysis.md) | 議事録38回分から抽出した課題 |
| [エージェント設計](docs/02-agent-design.md) | 4つのエージェント設計 |
| [実装ロードマップ](docs/03-implementation-roadmap.md) | 6ヶ月実装計画 |
| [統合ガイド](docs/04-integration-guide.md) | 既存システムとの連携 |

---

## クイックスタート

### 前提条件

- Node.js 18+
- Hermes Agent 設定済み
- Slack ワークスペース接続済み
- Amazon Ads MCP 接続済み（読み取り専用）

### セットアップ

```bash
# リポジトリクローン
git clone https://github.com/okamura-hub/mws-ec-optimization.git
cd mws-ec-optimization

# 依存パッケージインストール
npm install

# 環境変数設定
cp .env.example .env
# .env を編集

# 型チェック
npm run typecheck

# テスト実行
npm test

# フロー実行（モックデータ）
npm run test:inventory   # 在庫アラートフロー
npm run test:profit      # 利益管理フロー
npm run test:title       # 商品名バリデーションフロー
npm run test:roas        # ROAS低下検出フロー
npm run test:all         # 全フロー実行
```

---

## 関連プロジェクト

| プロジェクト | 役割 | リポジトリ |
|------------|------|----------|
| **Amazon-stertegy** | Amazon広告運用 | mywaysmart/amazon-stertegy |
| **mws-ai-agents** | タスク管理AI | okamura-hub/mws-ai-agents |
| **Hermes Agent** | 司令塔AI | (ローカル) |
| **本プロジェクト** | EC運営最適化 | okamura-hub/mws-ec-optimization |

---

## 運用ルール

### 承認境界

- **自動実行OK**: データ取得、分析、レポート生成、Issue起票
- **人間承認必要**: 本番環境への変更、広告操作、Slack実投稿
- **永久手動**: データ削除、キャンペーン停止、重要な設定変更

### セキュリティ

- 機密情報（APIキー、トークン）はSlack/Issueに投稿しない
- Amazon Ads MCPは読み取り専用
- 1変更 = 1人間承認

---

## ロードマップ

### Phase 1（〜2026年6月末）: 基盤構築
- [x] リポジトリ作成
- [x] 課題分析ドキュメント作成（議事録38回分分析）
- [x] エージェント設計ドキュメント作成
- [x] 既存システム統合設計
- [x] 在庫アラートフロー プロトタイプ実装 ✅
- [x] 利益管理フロー プロトタイプ実装 ✅
- [x] テストデータ作成
- [x] テストコード作成（60件合格）
- [x] API仕様書・開発者ガイド作成
- [x] GitHub Issue起票（P0-P2 9件）
- [x] Amazon商品名75文字バリデーション（#7）✅
- [x] ROAS低下キャンペーン自動検出（#8）✅

### Phase 2（2026年7月）: MVP実装
- [ ] Amazon Ads MCP連携（在庫データ取得）
- [ ] 各モールCSV連携（売上データ取得）
- [ ] Slack通知の本番化（Bot Token接続）
- [ ] 日次レポート自動生成（Cron連携）

### Phase 3（2026年8月）: 拡張
- [ ] 原価未登録商品自動検出（#10）
- [ ] 各モール横断価格乖離アラート（#9）
- [ ] 滞留在庫90日以上の自動廃棄判定（#11）
- [ ] CSフィードバック週次サマリー（#12）
- [ ] セール前コンテンツ一括最適化（#13）

### Phase 4（2026年9月〜）: 最適化
- [ ] 全モール横断KPIダッシュボード（#14）
- [ ] 業務マニュアル自動生成（#15）
- [ ] 全エージェント連携
- [ ] 学習・改善ループ
- [ ] 他部門への展開

---

## 作成日

2026年6月12日  
okamura (MY WAY SMART CO.,LTD)

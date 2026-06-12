# 既存システムとの統合ガイド

> 作成日: 2026年6月12日  
> 目的: 既存のHermes Agent、Amazon-stertegy、mws-ai-agentsとの統合方法を定義

---

## 1. 既存システム概要

### 1.1 Hermes Agent（司令塔）

**場所:** ローカル（`C:\Users\okamu\AppData\Local\hermes`）

**役割:**
- Slack Gateway（Socket Mode接続）
- Cron管理（定期ジョブ実行）
- FSM状態管理（Todo → In Progress → Human Review → Done）
- エージェント間ルーティング

**現在の設定:**
- Primary Model: `kimi-k2.5` (OpenCode Go)
- Slack Workspace: MY WAY SMART CO.,LTD
- 許可ユーザー: 岡村さん(U0A0NNZ65L2), 村上さん(UM961U6KB)
- Home Channel: `mws_openclaw` (C0AMRPE1971)
- Amazon専用: `C0AAZ7UAMMM`

**既存Cronジョブ:**
| ジョブID | 名称 | スケジュール | 配信先 |
|---------|------|----------|--------|
| fca3abb89cc5 | AI海外ニュース | `0 9 * * 1-5` | slack:mws_openclaw |
| d30b4d5868ac | 中国トレンド | `5 9 * * 1-5` | slack:mws_openclaw |
| c866cf205a74 | Amazon Ads日次レポート | `10 9 * * *` | slack:C0AAZ7UAMMM |
| fafc541675a0 | Health-check | `30 9 * * 1-5` | slack:mws_openclaw |

**統合ポイント:**
- 新規エージェントはHermesのCron管理下で動作
- Slack通知は既存のチャンネルを活用
- FSM状態管理を共通化

---

### 1.2 Amazon-stertegy（広告運用）

**場所:** `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\Amazon-stertegy`  
**GitHub:** `mywaysmart/amazon-stertegy`

**役割:**
- Amazon広告の最適化
- 広告レポート生成
- 入札・予算管理（読み取り専用）

**既存機能:**
- Amazon Ads MCP（読み取り専用）
- 日次レポート自動生成
- 承認フロー（Slack ✅）

**統合ポイント:**
- Amazon Ads MCPを共有
- 承認フローを共通化
- レポート出力先を統一

**注意事項:**
- Amazon-stertegyは**広告運用に特化**
- 本プロジェクトは**EC運営全体**を対象
- 重複する機能はAmazon-stertegyを優先

---

### 1.3 mws-ai-agents（タスク管理）

**場所:** `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ai-agents`  
**GitHub:** `okamura-hub/mws-ai-agents`

**役割:**
- タスク管理AIエージェント
- 朝のDM通知
- Slackボタン・モーダル
- 進捗メモ→Notion追記

**技術スタック:**
- TypeScript
- OpenAI Agents SDK
- Slack Bolt (Socket Mode)
- Notion API

**既存フロー:**
- `morning-dm-flow.ts`: 朝のタスクDM通知
- `progress-memo-flow.ts`: 進捗メモ→Notion
- `responsible-notify-flow.ts`: 責任者通知

**統合ポイント:**
- Slack Botは別Appとして運用（ポート競合回避）
- Notion APIを共有
- タスク管理データを連携

**注意事項:**
- mws-ai-agentsは**タスク管理に特化**
- 本プロジェクトは**EC運営最適化**を対象
- Slack Botは分離して運用

---

## 2. 統合アーキテクチャ

### 2.1 全体像

```
┌─────────────────────────────────────────────────────────────┐
│                    ユーザー層                                │
│              岡村さん / チームメンバー                        │
└────────────────────────┬────────────────────────────────────┘
                         │ Slack
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Hermes Agent (司令塔)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Slack Gateway│  │ Cron Manager │  │ FSM Manager  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│EC運営Agent  │  │データ分析   │  │コンテンツ   │  │組織開発     │
│(本PJ)       │  │Agent(本PJ)  │  │最適化Agent  │  │Agent(本PJ)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    実行エージェント層                          │
│         Codex CLI / Claude Code / OpenCode Go               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Amazon-stertegy│ │mws-ai-agents│  │  Notion     │  │  Slack      │
│(広告運用)    │  │(タスク管理) │  │  (Docs)     │  │  (Comm)     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### 2.2 データフロー

#### パターン1: Amazon Adsデータ取得

```
本PJ EC運営Agent
    ↓ 依頼
Hermes Agent
    ↓ 実行
Amazon-stertegy (Amazon Ads MCP)
    ↓ データ
本PJ EC運営Agent
    ↓ 分析
Hermes Agent
    ↓ 通知
Slack
```

#### パターン2: タスク管理連携

```
本PJ 組織開発Agent
    ↓ タスク生成
Hermes Agent
    ↓ 連携
mws-ai-agents (Notion API)
    ↓ 保存
Notion
    ↓ 通知
Slack DM
```

#### パターン3: コンテンツ改善

```
本PJ コンテンツAgent
    ↓ 分析
Hermes Agent
    ↓ 実行
Claude Code (文書生成)
    ↓ 出力
本PJ コンテンツAgent
    ↓ 通知
Hermes Agent
    ↓ 投稿
Slack
```

---

## 3. 統合手順

### 3.1 Phase 1: 基盤統合（Week 1-2）

#### ステップ1: リポジトリ構成

```
mws-ec-optimization/
├── README.md
├── docs/
│   ├── 01-challenges-analysis.md
│   ├── 02-agent-design.md
│   ├── 03-implementation-roadmap.md
│   └── 04-integration-guide.md (このファイル)
├── agents/
│   ├── ec-operations/
│   ├── data-analytics/
│   ├── content-optimization/
│   └── org-development/
├── flows/
│   ├── inventory-alert-flow.ts
│   ├── profit-management-flow.ts
│   ├── kpi-dashboard-flow.ts
│   └── ...
├── tools/
│   ├── amazon-tools.ts (Amazon-stertegyから共有)
│   ├── notion-tools.ts (mws-ai-agentsから共有)
│   └── slack-tools.ts (共通)
└── shared/
    ├── types/ (型定義)
    ├── utils/ (ユーティリティ)
    └── config/ (設定)
```

#### ステップ2: 共通モジュール

**Amazon Tools (Amazon-stertegyから共有):**

```typescript
// shared/tools/amazon-tools.ts

export interface AmazonAdsData {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  sales: number;
  roas: number;
}

export async function fetchAmazonAdsData(
  profileId: string,
  startDate: string,
  endDate: string
): Promise<AmazonAdsData[]> {
  // Amazon-stertegyのMCP設定を共有
  // Amazon Ads MCP経由でデータ取得
}
```

**Notion Tools (mws-ai-agentsから共有):**

```typescript
// shared/tools/notion-tools.ts

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
}

export async function saveToNotion(
  databaseId: string,
  content: any
): Promise<string> {
  // mws-ai-agentsのNotion設定を共有
  // Notion API経由で保存
}
```

**Slack Tools (共通):**

```typescript
// shared/tools/slack-tools.ts

export async function sendSlackMessage(
  channel: string,
  message: string,
  blocks?: any[]
): Promise<void> {
  // Hermes AgentのSlack設定を共有
  // Slack API経由で送信
}
```

#### ステップ3: Hermes Agent設定

**Cronジョブ追加:**

```bash
# 在庫アラート（毎朝8:00）
hermes cron create "0 8 * * *" \
  --name "在庫アラート" \
  --deliver "slack:C0AAZ7UAMMM" \
  --script "flows/inventory-alert-flow.ts" \
  --workdir "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ec-optimization"

# KPIダッシュボード更新（毎日23:00）
hermes cron create "0 23 * * *" \
  --name "KPIダッシュボード更新" \
  --deliver "slack:C0AAZ7UAMMM" \
  --script "flows/kpi-dashboard-flow.ts" \
  --workdir "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ec-optimization"
```

**Skill追加:**

```bash
# EC運営スキル
hermes skill create ec-operations \
  --description "EC運営エージェントの運用ルール"

# データ分析スキル
hermes skill create data-analytics \
  --description "データ分析エージェントの運用ルール"
```

---

### 3.2 Phase 2: データ統合（Week 3-4）

#### ステップ1: Amazon Ads MCP共有

**Amazon-stertegyの設定を参照:**

```yaml
# mws-ec-optimization/.mcp.json
{
  "mcpServers": {
    "amazon-ads-official": {
      "command": "npx",
      "args": ["-y", "amazonads-mcp"],
      "env": {
        "REGION": "FE",
        "AMAZON_ADS_CLIENT_ID": "${AMAZON_ADS_CLIENT_ID}",
        "AMAZON_ADS_CLIENT_SECRET": "${AMAZON_ADS_CLIENT_SECRET}",
        "AMAZON_ADS_REFRESH_TOKEN": "${AMAZON_ADS_REFRESH_TOKEN}"
      }
    }
  }
}
```

**注意事項:**
- Amazon Ads MCPは**読み取り専用**
- 書き込み操作はAmazon-stertegy側で実施
- 認証情報は`.env`で管理

#### ステップ2: Notion API共有

**mws-ai-agentsの設定を参照:**

```typescript
// mws-ec-optimization/.env
NOTION_API_KEY=${NOTION_API_KEY}
NOTION_DATABASE_ID=${NOTION_DATABASE_ID}
```

**利用シーン:**
- マニュアル保存
- タスク管理
- ドキュメント共有

#### ステップ3: Slack連携

**Hermes Agentの設定を共有:**

```typescript
// mws-ec-optimization/src/webhooks/slack-webhook.ts

import { App } from '@slack/bolt';

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});
```

**注意事項:**
- mws-ai-agentsとは**別Slack App**として運用
- ポート競合を回避
- 必要に応じて連携

---

### 3.3 Phase 3: フロー統合（Week 5-8）

#### ステップ1: 在庫アラートフロー

```typescript
// flows/inventory-alert-flow.ts

import { fetchAmazonAdsData } from '../shared/tools/amazon-tools';
import { sendSlackMessage } from '../shared/tools/slack-tools';

export async function inventoryAlertFlow(): Promise<void> {
  // 1. データ取得
  const inventoryData = await fetchInventoryData();
  
  // 2. 分析
  const alerts = analyzeInventory(inventoryData);
  
  // 3. 通知
  await sendSlackMessage('C0AAZ7UAMMM', formatAlerts(alerts));
}
```

#### ステップ2: KPIダッシュボードフロー

```typescript
// flows/kpi-dashboard-flow.ts

import { fetchAllMallData } from '../shared/tools/data-tools';
import { saveToNotion } from '../shared/tools/notion-tools';

export async function kpiDashboardFlow(): Promise<void> {
  // 1. データ収集
  const data = await collectAllMallData();
  
  // 2. KPI計算
  const kpis = calculateKPIs(data);
  
  // 3. ダッシュボード更新
  await updateDashboard(kpis);
  
  // 4. Notion保存
  await saveToNotion('database-id', kpis);
}
```

#### ステップ3: コンテンツ最適化フロー

```typescript
// flows/content-optimization-flow.ts

import { claudeCodeExec } from '../shared/tools/claude-tools';

export async function contentOptimizationFlow(): Promise<void> {
  // 1. 商品データ収集
  const products = await fetchProductData();
  
  // 2. 改善案生成（Claude Code）
  const improvements = await claudeCodeExec(
    buildImprovementPrompt(products)
  );
  
  // 3. 通知
  await sendImprovementReport(improvements);
}
```

---

## 4. 注意事項

### 4.1 Amazon-stertegyとの重複回避

| 機能 | Amazon-stertegy | 本PJ | 優先 |
|------|----------------|------|------|
| Amazon Ads MCP | ✅ | ✅ | Amazon-stertegy |
| 広告レポート | ✅ | ❌ | Amazon-stertegy |
| 在庫管理 | ❌ | ✅ | 本PJ |
| 利益管理 | ❌ | ✅ | 本PJ |
| SKU管理 | ❌ | ✅ | 本PJ |

**ルール:**
- 広告運用はAmazon-stertegyに統一
- EC運営全体は本PJで対応
- 重複する場合はAmazon-stertegyを優先

### 4.2 mws-ai-agentsとの棲み分け

| 機能 | mws-ai-agents | 本PJ | 優先 |
|------|--------------|------|------|
| タスク管理 | ✅ | ❌ | mws-ai-agents |
| 朝DM通知 | ✅ | ❌ | mws-ai-agents |
| Notion連携 | ✅ | ✅ | 共有 |
| Slack連携 | ✅ | ✅ | 共有 |
| EC運営最適化 | ❌ | ✅ | 本PJ |

**ルール:**
- タスク管理はmws-ai-agentsに統一
- EC運営最適化は本PJで対応
- Notion/Slackは共有

### 4.3 Hermes Agent設定

**既存設定を尊重:**
- Primary Model: `kimi-k2.5`
- Slack Workspace: MY WAY SMART CO.,LTD
- 許可ユーザー: 岡村さん, 村上さん
- 承認フロー: Slack ✅

**追加設定:**
- 新規Cronジョブは既存と分散
- 新規Skillは既存と統合
- 新規チャンネルは必要に応じて追加

---

## 5. テスト計画

### 5.1 統合テスト

#### テスト1: Amazon Ads MCP共有

```bash
# Amazon-stertegyの設定でMCP接続確認
cd "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\Amazon-stertegy"
codex mcp list
# → amazon-ads-official: ✔ Connected

# 本PJでMCP接続確認
cd "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ec-optimization"
codex mcp list
# → amazon-ads-official: ✔ Connected
```

#### テスト2: Notion API共有

```bash
# mws-ai-agentsでNotion接続確認
cd "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ai-agents"
npm run test:notion

# 本PJでNotion接続確認
cd "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ec-optimization"
npm run test:notion
```

#### テスト3: Slack連携

```bash
# Hermes AgentでSlack接続確認
hermes status
# → Slack: ✅ Connected

# 本PJでSlack通知テスト
npm run test:slack
```

### 5.2 受け入れテスト

#### シナリオ1: 在庫アラート

1. 在庫データを準備
2. 在庫アラートフローを実行
3. Slackに通知が届くことを確認
4. 通知内容が正しいことを確認

#### シナリオ2: KPIダッシュボード

1. 全モールのデータを準備
2. KPIダッシュボードフローを実行
3. ダッシュボードが更新されることを確認
4. Notionに保存されることを確認

#### シナリオ3: コンテンツ最適化

1. 商品データを準備
2. コンテンツ最適化フローを実行
3. 改善案が生成されることを確認
4. Slackに投稿されることを確認

---

## 6. 変更管理

### 6.1 変更依頼フロー

```
変更依頼
    ↓
Hermes Agent (影響分析)
    ↓
岡村さん (承認)
    ↓
実装
    ↓
テスト
    ↓
本番反映
```

### 6.2 バージョニング

- **メジャーバージョン**: 互換性のない変更
- **マイナーバージョン**: 後方互換な機能追加
- **パッチバージョン**: バグ修正

### 6.3 リリースノート

各リリースごとに`CHANGELOG.md`を更新。

---

## 7. 参考資料

- Amazon-stertegy: `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\Amazon-stertegy`
- mws-ai-agents: `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ai-agents`
- Hermes Agent: `C:\Users\okamu\AppData\Local\hermes`
- DESIGN.md: `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\Hermes Agent\DESIGN.md`
- WORKFLOW.md: `C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\Hermes Agent\WORKFLOW.md`

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-12 | 初版作成 |

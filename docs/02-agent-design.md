# AIエージェント設計ドキュメント

> 作成日: 2026年6月12日  
> 目的: MY WAY SMART CO.,LTD のEC運営最適化・組織開発のためのAIエージェントシステム設計

---

## 1. システムアーキテクチャ

### 1.1 全体像

```
┌─────────────────────────────────────────────────────────────────┐
│                        ユーザー層                                │
│              岡村さん / チームメンバー / CS部門                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Slack / Web UI
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Hermes Agent (司令塔)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Slack Gateway│  │ Cron Manager │  │ FSM Manager  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Memory       │  │ Skills       │  │ Router       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ EC運営Agent │  │データ分析   │  │コンテンツ   │  │組織開発     │
│             │  │Agent        │  │最適化Agent  │  │Agent        │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    実行エージェント層                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Codex CLI    │  │ Claude Code  │  │ OpenCode Go  │          │
│  │ (推論・設計) │  │ (文書・実装) │  │ (データ処理) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      データ・API層                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │Amazon Ads  │ │SellerSprite│ │  Notion    │ │   Slack    │   │
│  │   MCP      │ │   MCP      │ │   API      │ │   API      │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │Google      │ │  CSV/Excel │ │  RAG       │ │  Web       │   │
│  │  Drive     │ │   Files    │ │  System    │ │  Search    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. エージェント詳細設計

### 2.1 EC運営エージェント

#### 2.1.1 概要

| 項目 | 内容 |
|------|------|
| **名称** | EC Operations Agent |
| **役割** | 在庫管理、利益管理、SKU管理の自動化 |
| **担当業務** | 在庫アラート、原価未登録検出、低利益SKU分析、モール間連携 |
| **実行エージェント** | OpenCode Go (データ処理) + Codex (判断) |
| **入力** | Amazon Ads MCP, CSV, ダッシュボードデータ |
| **出力** | Slack通知, レポート, Issue |

#### 2.1.2 機能一覧

##### A. 在庫管理フロー

```
[毎朝 8:00] Cron起動
    ↓
[8:00-8:15] 在庫データ取得
    - Amazon FBA在庫
    - 自社倉庫在庫
    - 各モール在庫
    ↓
[8:15-8:25] 在庫分析
    - 14日分以下の商品を検出
    - 滞留在庫（90日以上）を検出
    - 過剰在庫（180日分以上）を検出
    ↓
[8:25-8:30] Slack通知
    - 在庫切れ注意リスト
    - 滞留在庫リスト
    - 推奨アクション
    ↓
[Human Review] 岡村さん確認
    ↓
[承認後] 自動アクション
    - 広告抑制提案
    - 廃棄候補リスト
    - 発注提案
```

**実装詳細:**

```typescript
// flows/inventory-alert-flow.ts

interface InventoryAlert {
  sku: string;
  productName: string;
  currentStock: number;
  daysOfStock: number;
  alertLevel: 'critical' | 'warning' | 'info';
  recommendedAction: string;
}

async function inventoryAlertFlow(): Promise<void> {
  // 1. データ取得
  const inventoryData = await fetchInventoryData();
  
  // 2. 分析
  const alerts = analyzeInventory(inventoryData);
  
  // 3. 通知
  await sendSlackNotification(alerts);
  
  // 4. Issue起票（必要に応じて）
  await createIssuesIfNeeded(alerts);
}

function analyzeInventory(data: InventoryData[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  
  for (const item of data) {
    const daysOfStock = calculateDaysOfStock(item);
    
    if (daysOfStock <= 7) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock,
        alertLevel: 'critical',
        recommendedAction: '緊急発注または広告停止'
      });
    } else if (daysOfStock <= 14) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock,
        alertLevel: 'warning',
        recommendedAction: '発注検討'
      });
    }
    
    // 滞留在庫チェック
    if (item.daysSinceLastSale >= 90) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock: Infinity,
        alertLevel: 'info',
        recommendedAction: '廃棄またはセール検討'
      });
    }
  }
  
  return alerts;
}
```

##### B. 利益管理フロー

```
[毎月1日 9:00] Cron起動
    ↓
[9:00-9:30] 前月データ収集
    - 売上データ
    - 原価データ
    - 配送費
    - 広告費
    - 手数料
    ↓
[9:30-9:45] 利益計算・検証
    - 粗利益計算
    - 営業利益計算
    - 異常値検出
    ↓
[9:45-10:00] レポート生成
    - 商品別利益率
    - モール別利益率
    - 前月比較
    ↓
[10:00] Slack投稿
    - 利益率ワースト10
    - 原価未登録商品リスト
    - 異常値アラート
```

##### C. SKU管理フロー

```
[毎週月曜 9:00] Cron起動
    ↓
[9:00-9:30] SKUデータ収集
    - 全SKU一覧
    - 各SKUの利益率
    - 各SKUのROAS
    - 各SKUの在庫回転率
    ↓
[9:30-9:45] SKU分析
    - 低利益SKUランキング
    - 削除候補抽出
    - 統合候補抽出
    ↓
[9:45-10:00] 提案生成
    - 削除候補リスト
    - 統合シナリオ
    - 価格調整提案
    ↓
[10:00] Slack投稿 + Issue起票
```

#### 2.1.3 承認境界

| アクション | 自動/手動 | 条件 |
|-----------|----------|------|
| 在庫アラート通知 | 自動 | - |
| 利益レポート生成 | 自動 | - |
| SKU分析レポート | 自動 | - |
| 発注提案 | 手動 | 岡村さん承認必要 |
| 廃棄提案 | 手動 | 岡村さん承認必要 |
| 価格変更 | 手動 | 岡村さん承認必要 |
| SKU削除 | 手動 | 岡村さん承認必要 |

---

### 2.2 データ分析エージェント

#### 2.2.1 概要

| 項目 | 内容 |
|------|------|
| **名称** | Data Analytics Agent |
| **役割** | KPI可視化、異常値検出、トレンド分析 |
| **担当業務** | 全モール横断分析、KPI追跡、レポート自動生成 |
| **実行エージェント** | OpenCode Go (データ処理) + Claude (分析) |
| **入力** | 各モールのCSV, Amazon Ads MCP, ダッシュボード |
| **出力** | ダッシュボード更新, レポート, Slack通知 |

#### 2.2.2 機能一覧

##### A. KPIダッシュボード統合

```
[毎日 23:00] Cron起動
    ↓
[23:00-23:30] データ収集
    - Amazon売上・PV・CVR
    - 楽天売上・PV・CVR
    - Yahoo売上・PV・CVR
    - auPay売上・PV・CVR
    - Qoo10売上・PV・CVR
    ↓
[23:30-23:45] KPI計算
    - 自然検索PV比率
    - モール別CVR
    - 広告依存度
    - 在庫回転率
    ↓
[23:45-24:00] ダッシュボード更新
    - Google Spreadsheet更新
    - 異常値ハイライト
    - 前日比較
```

##### B. 異常値検出フロー

```
[毎朝 7:00] Cron起動
    ↓
[7:00-7:15] 前日データ取得
    - 全モールの売上
    - 全モールのPV
    - 全モールのCVR
    ↓
[7:15-7:25] 異常値検出
    - 前日比±30%以上
    - 7日間平均比±50%以上
    - 統計的外れ値
    ↓
[7:25-7:30] 原因分析
    - セール影響
    - 在庫切れ
    - 広告停止
    - 競合影響
    ↓
[7:30] Slack通知
    - 異常値リスト
    - 推定原因
    - 推奨アクション
```

##### C. 週次・月次レポート自動生成

```
[毎週月曜 8:00] 週次レポート
[毎月1日 8:00] 月次レポート
    ↓
[レポート生成]
    - 売上サマリー
    - 利益サマリー
    - KPI達成率
    - 前期間比較
    - 改善提案
    ↓
[Slack投稿 + Notion保存]
```

#### 2.2.3 実装詳細

```typescript
// flows/kpi-dashboard-flow.ts

interface KPIData {
  date: string;
  mall: 'amazon' | 'rakuten' | 'yahoo' | 'aupay' | 'qoo10';
  sales: number;
  pv: number;
  cvr: number;
  organicPVRatio: number;
  adSpend: number;
  roas: number;
}

async function kpiDashboardFlow(): Promise<void> {
  // 1. データ収集
  const data = await collectAllMallData();
  
  // 2. KPI計算
  const kpis = calculateKPIs(data);
  
  // 3. ダッシュボード更新
  await updateDashboard(kpis);
  
  // 4. 異常値検出
  const anomalies = detectAnomalies(kpis);
  
  // 5. 通知
  if (anomalies.length > 0) {
    await sendAnomalyAlert(anomalies);
  }
}

function detectAnomalies(data: KPIData[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  for (const item of data) {
    const yesterdayData = getYesterdayData(item.mall);
    const weekAverage = getWeekAverage(item.mall);
    
    // 前日比±30%以上
    if (Math.abs(item.sales - yesterdayData.sales) / yesterdayData.sales > 0.3) {
      anomalies.push({
        mall: item.mall,
        metric: 'sales',
        currentValue: item.sales,
        previousValue: yesterdayData.sales,
        changeRate: (item.sales - yesterdayData.sales) / yesterdayData.sales,
        severity: 'high'
      });
    }
    
    // 7日間平均比±50%以上
    if (Math.abs(item.pv - weekAverage.pv) / weekAverage.pv > 0.5) {
      anomalies.push({
        mall: item.mall,
        metric: 'pv',
        currentValue: item.pv,
        previousValue: weekAverage.pv,
        changeRate: (item.pv - weekAverage.pv) / weekAverage.pv,
        severity: 'medium'
      });
    }
  }
  
  return anomalies;
}
```

---

### 2.3 コンテンツ最適化エージェント

#### 2.3.1 概要

| 項目 | 内容 |
|------|------|
| **名称** | Content Optimization Agent |
| **役割** | 商品名SEO、LP改善、A+コンテンツ自動生成 |
| **担当業務** | 商品名検証、競合分析、改善案生成、A/Bテスト設計 |
| **実行エージェント** | Claude Code (文書生成) + Codex (分析) |
| **入力** | 商品ページURL, 競合データ, SEOキーワード |
| **出力** | 改善案, A+コンテンツ案, LP構成案 |

#### 2.3.2 機能一覧

##### A. 商品名最適化フロー

```
[毎週水曜 10:00] Cron起動
    ↓
[10:00-10:30] 商品データ収集
    - Amazon商品名一覧
    - 文字数チェック
    - SEOキーワード含有チェック
    ↓
[10:30-11:00] 競合分析
    - 同一カテゴリの上位商品
    - 競合の商品名パターン
    - 使用キーワード分析
    ↓
[11:00-11:30] 改善案生成
    - 75文字以内の最適化案
    - SEOキーワード盛り込み
    - クリック率向上案
    ↓
[11:30] Slack投稿 + Issue起票
    - 商品別改善案
    - 期待効果
    - 実装優先度
```

##### B. LP改善フロー

```
[手動トリガー] 岡村さんからの依頼
    ↓
[依頼受領] 対象商品URL
    ↓
[分析]
    - 現行LPの構造分析
    - 競合LPベンチマーク
    - 改善ポイント特定
    ↓
[改善案生成]
    - ページ構成案
    - コピー案
    - 画像配置案
    ↓
[Slack投稿]
    - 改善案
    - 期待効果
    - 実装手順
```

##### C. A+コンテンツ自動生成

```
[手動トリガー] 岡村さんからの依頼
    ↓
[依頼受領] 対象ASIN
    ↓
[商品分析]
    - 商品特徴
    - ターゲット層
    - 競合との差別化ポイント
    ↓
[A+コンテンツ生成]
    - モジュール構成
    - テキスト生成
    - 画像提案
    ↓
[出力]
    - A+コンテンツ案
    - 実装手順
```

#### 2.3.3 実装詳細

```typescript
// flows/content-optimization-flow.ts

interface ProductContent {
  asin: string;
  title: string;
  bulletPoints: string[];
  description: string;
  currentLength: number;
}

interface ContentImprovement {
  asin: string;
  currentTitle: string;
  suggestedTitle: string;
  improvements: string[];
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

async function contentOptimizationFlow(): Promise<void> {
  // 1. 商品データ収集
  const products = await fetchProductData();
  
  // 2. 検証
  const issues = validateProductContent(products);
  
  // 3. 競合分析
  const competitorData = await analyzeCompetitors(products);
  
  // 4. 改善案生成
  const improvements = await generateImprovements(issues, competitorData);
  
  // 5. 通知
  await sendImprovementReport(improvements);
}

function validateProductContent(products: ProductContent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const product of products) {
    // 75文字チェック
    if (product.currentLength > 75) {
      issues.push({
        asin: product.asin,
        issue: 'title_too_long',
        currentValue: product.title,
        recommendation: '75文字以内に短縮'
      });
    }
    
    // SEOキーワードチェック
    const hasMainKeywords = checkMainKeywords(product.title);
    if (!hasMainKeywords) {
      issues.push({
        asin: product.asin,
        issue: 'missing_keywords',
        recommendation: '主要キーワードを盛り込む'
      });
    }
  }
  
  return issues;
}

async function generateImprovements(
  issues: ValidationIssue[],
  competitors: CompetitorData[]
): Promise<ContentImprovement[]> {
  // Claude Code に委譲
  const prompt = buildImprovementPrompt(issues, competitors);
  const result = await claudeCodeExec(prompt);
  return parseImprovements(result);
}
```

---

### 2.4 組織開発エージェント

#### 2.4.1 概要

| 項目 | 内容 |
|------|------|
| **名称** | Organization Development Agent |
| **役割** | マニュアル整備、CS連携、情報共有の仕組み化 |
| **担当業務** | マニュアル自動生成、CSフィードバック集約、ナレッジ共有 |
| **実行エージェント** | Claude Code (文書生成) + Hermes (Slack連携) |
| **入力** | 業務フロー, CSデータ, 議事録, Slack会話 |
| **出力** | マニュアル, レポート, Slack投稿 |

#### 2.4.2 機能一覧

##### A. マニュアル自動生成フロー

```
[手動トリガー] 岡村さんからの依頼
    ↓
[依頼受領] 対象業務名
    ↓
[業務分析]
    - 既存ドキュメント収集
    - Slack会話から手順抽出
    - 担当者へのヒアリング（必要に応じて）
    ↓
[マニュアル生成]
    - 手順書
    - 判断基準
    - トラブルシューティング
    - FAQ
    ↓
[出力]
    - Notionに保存
    - Slackで共有
    - 関連Issue起票
```

##### B. CSフィードバック集約フロー

```
[毎日 18:00] Cron起動
    ↓
[18:00-18:30] CSデータ収集
    - 顧客問い合わせ一覧
    - 不満・要望
    - 製品不具合報告
    ↓
[18:30-19:00] フィードバック分析
    - カテゴリ分類
    - 頻度分析
    - 緊急度判定
    ↓
[19:00-19:30] 製品開発チームへの共有
    - 週次サマリー
    - 緊急事項の即時通知
    - 改善提案
    ↓
[Slack投稿 + Notion保存]
```

##### C. 情報共有自動化フロー

```
[毎日 17:00] Cron起動
    ↓
[17:00-17:30] 本日のデータ収集
    - 売上・利益の進捗
    - 異常値
    - 改善事例
    ↓
[17:30-18:00] 気づき生成
    - 数値の気づき
    - 改善提案
    - ベストプラクティス
    ↓
[18:00] Slack投稿
    - #mws_daily_insights チャンネル
    - チームメンション
```

#### 2.4.3 実装詳細

```typescript
// flows/manual-generation-flow.ts

interface ManualRequest {
  businessProcess: string;
  targetAudience: string;
  existingDocs?: string[];
  stakeholders?: string[];
}

interface GeneratedManual {
  title: string;
  sections: ManualSection[];
  lastUpdated: string;
  version: string;
}

async function manualGenerationFlow(request: ManualRequest): Promise<void> {
  // 1. 既存ドキュメント収集
  const existingDocs = await collectExistingDocs(request.businessProcess);
  
  // 2. Slack会話から手順抽出
  const slackConversations = await searchSlackConversations(request.businessProcess);
  
  // 3. マニュアル生成（Claude Code に委譲）
  const manual = await generateManual(request, existingDocs, slackConversations);
  
  // 4. Notionに保存
  await saveToNotion(manual);
  
  // 5. Slackで共有
  await shareOnSlack(manual);
}

// flows/cs-feedback-flow.ts

interface CSFeedback {
  date: string;
  category: 'product_defect' | 'usability' | 'shipping' | 'other';
  description: string;
  severity: 'high' | 'medium' | 'low';
  productAsin?: string;
}

async function csFeedbackFlow(): Promise<void> {
  // 1. CSデータ収集
  const feedbacks = await collectCSFeedbacks();
  
  // 2. 分析
  const analysis = analyzeFeedbacks(feedbacks);
  
  // 3. 緊急事項チェック
  const urgentIssues = analysis.filter(f => f.severity === 'high');
  
  if (urgentIssues.length > 0) {
    // 即時通知
    await sendUrgentAlert(urgentIssues);
  }
  
  // 4. 週次サマリー生成
  const weeklySummary = generateWeeklySummary(feedbacks);
  
  // 5. 製品開発チームへ共有
  await shareWithProductTeam(weeklySummary);
}
```

---

## 3. エージェント間連携

### 3.1 データフロー

```
EC運営Agent ──────┐
                  │
データ分析Agent ──┼──→ Hermes Agent ──→ 実行Agent ──→ 出力
                  │         │
コンテンツAgent ──┘         │
                           │
組織開発Agent ──────────────┘
```

### 3.2 連携シナリオ

#### シナリオ1: 在庫切れ検出 → コンテンツ改善

```
[EC運営Agent] 在庫切れ検出
    ↓
[Hermes] コンテンツAgentに依頼
    ↓
[コンテンツAgent] 代替商品のLP改善案生成
    ↓
[Hermes] 岡村さんに提案
    ↓
[承認後] 実装
```

#### シナリオ2: 利益率低下 → 価格調整提案

```
[データ分析Agent] 利益率低下検出
    ↓
[Hermes] EC運営Agentに依頼
    ↓
[EC運営Agent] 価格弾力性分析 + 競合価格調査
    ↓
[Hermes] 価格調整提案
    ↓
[承認後] 実装
```

#### シナリオ3: CSフィードバック → 商品改善

```
[組織開発Agent] CSフィードバック集約
    ↓
[Hermes] コンテンツAgentに依頼
    ↓
[コンテンツAgent] 商品ページ改善案生成
    ↓
[Hermes] 岡村さんに提案
    ↓
[承認後] 実装
```

---

## 4. 技術スタック

### 4.1 使用技術

| 層 | 技術 | 用途 |
|---|------|------|
| **司令塔** | Hermes Agent | Slack Gateway, Cron, FSM |
| **実行** | Codex CLI | 推論、設計、判断 |
| **実行** | Claude Code | 文書生成、実装 |
| **実行** | OpenCode Go | データ処理、集計 |
| **API** | Amazon Ads MCP | 広告データ取得 |
| **API** | SellerSprite MCP | 競合分析 |
| **API** | Notion API | ドキュメント管理 |
| **API** | Slack API | 通知、連携 |
| **言語** | TypeScript | フロー実装 |
| **言語** | Python | データ処理 |
| **DB** | SQLite | ローカルデータ |
| **DB** | Google Sheets | ダッシュボード |

### 4.2 インフラ

| 項目 | 内容 |
|------|------|
| **ホスティング** | ローカル（岡村さんPC） |
| **OS** | Windows 10 |
| **ランタイム** | Node.js 18+, Python 3.11+ |
| **CI/CD** | GitHub Actions（予定） |
| **監視** | Hermes Health-check Cron |

---

## 5. セキュリティ設計

### 5.1 認証・認可

| 項目 | 方法 |
|------|------|
| **Slack** | Socket Mode（トークン不要） |
| **Amazon Ads** | OAuth 2.0（MCP経由） |
| **Notion** | Integration Token |
| **GitHub** | PAT（okamura-hub） |

### 5.2 データ保護

| 項目 | 対策 |
|------|------|
| **機密情報** | Slack/Issueに投稿しない |
| **APIキー** | .envファイルで管理 |
| **トークン** | 自動更新（MCP） |
| **ログ** | ローカル保存、定期削除 |

### 5.3 承認境界

| アクション | 自動/手動 |
|-----------|----------|
| データ取得 | 自動 |
| 分析・レポート | 自動 |
| Slack通知 | 自動 |
| 本番変更 | 手動（岡村さん承認） |
| データ削除 | 手動（岡村さん承認） |

---

## 6. 実装ロードマップ

### Phase 1（〜2026年6月末）: 基盤構築

- [x] リポジトリ作成
- [x] 課題分析ドキュメント
- [x] エージェント設計ドキュメント
- [ ] 在庫アラートフロー実装
- [ ] 利益管理フロー実装

### Phase 2（2026年7月）: MVP実装

- [ ] KPIダッシュボード統合
- [ ] 異常値検出フロー
- [ ] 商品名最適化フロー
- [ ] 週次・月次レポート自動生成

### Phase 3（2026年8月）: 拡張

- [ ] LP改善フロー
- [ ] A+コンテンツ自動生成
- [ ] マニュアル自動生成
- [ ] CSフィードバック集約

### Phase 4（2026年9月〜）: 最適化

- [ ] エージェント間連携
- [ ] 学習・改善ループ
- [ ] 他部門への展開
- [ ] RAGシステム統合

---

## 7. 成功指標

### 7.1 短期（3ヶ月）

| 指標 | 目標値 |
|------|--------|
| 在庫アラート自動化率 | 100% |
| 日次レポート生成時間 | 5分以内 |
| 異常値検出精度 | 90%以上 |
| Slack通知数 | 10件/日以下 |

### 7.2 中期（6ヶ月）

| 指標 | 目標値 |
|------|--------|
| 在庫回転率 | 12回/年 |
| 営業利益率 | 10%以上 |
| SKU数 | 1,000件以下 |
| マニュアル整備率 | 80%以上 |

### 7.3 長期（1年）

| 指標 | 目標値 |
|------|--------|
| 業務自動化率 | 50%以上 |
| CSAT | 90%以上 |
| 作業時間短縮率 | 40%以上 |
| 営業利益率 | 15%以上 |

---

## 8. 参考資料

- 課題分析: `docs/01-challenges-analysis.md`
- 実装ロードマップ: `docs/03-implementation-roadmap.md`
- 統合ガイド: `docs/04-integration-guide.md`
- Amazon_AI_活用説明.md: 既存のHermes Agent説明
- DESIGN.md: 既存のHermes Agent設計

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-12 | 初版作成 |

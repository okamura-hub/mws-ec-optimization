# API仕様書

> 作成日: 2026年6月12日  
> 更新日: 2026年6月13日  
> 版本: 1.1.0

---

## 1. 概要

本ドキュメントは、MWS EC OptimizationプロジェクトのAPI仕様を定義します。

### 1.1 現在のステータス

| 区分 | 状態 | 備考 |
|------|------|------|
| フロー実装 | ✅ プロトタイプ完成 | 在庫/利益/商品名バリデーションの3フロー |
| テスト | ✅ 36件合格 | Jest + ts-jest |
| APIエンドポイント | 🔲 未実装 | Phase 2で実装予定 |
| 認証 | 🔲 未実装 | Phase 2で実装予定 |

**注意**: 現在はTypeScriptモジュールとして直接呼び出し可能です。HTTP APIはPhase 2で実装予定です。

### 1.2 利用可能なモジュール（TypeScript直接呼び出し）

| モジュール | 説明 | ファイル |
|-----------|------|---------|
| `inventoryAlertFlow` | 在庫アラートフロー実行 | `flows/inventory-alert-flow.ts` |
| `profitManagementFlow` | 利益管理フロー実行 | `flows/profit-management-flow.ts` |
| `titleValidationFlow` | 商品名バリデーションフロー実行 | `flows/title-validation-flow.ts` |
| `fetchInventoryData` | 在庫データ取得 | `shared/tools/inventory-tools.ts` |
| `fetchProfitData` | 利益データ取得 | `shared/tools/profit-tools.ts` |
| `fetchAmazonProducts` | Amazon商品カタログデータ取得 | `shared/tools/amazon-catalog-tools.ts` |
| `validateProductTitle` | 商品名75文字バリデーション | `shared/tools/amazon-catalog-tools.ts` |
| `sendSlackNotification` | Slack通知送信 | `shared/tools/slack-tools.ts` |

---

## 2. TypeScriptモジュール API（現在利用可能）

### 2.1 在庫データ取得

**関数:** `fetchInventoryData()`

**ファイル:** `shared/tools/inventory-tools.ts`

**戻り値:** `Promise<InventoryData[]>`

**型定義:**

```typescript
interface InventoryData {
  sku: string;                    // SKUコード
  productName: string;            // 商品名
  quantity: number;               // 在庫数
  averageDailySales: number;      // 平均日間売上
  daysSinceLastSale: number;      // 最終販売からの経過日数
  mall: 'amazon' | 'rakuten' | 'yahoo' | 'aupay' | 'qoo10' | 'warehouse';
  lastUpdated: string;            // 最終更新日時（ISO 8601）
}
```

**使用例:**

```typescript
import { fetchInventoryData } from './shared/tools/inventory-tools';

const data = await fetchInventoryData();
console.log(`${data.length}件の在庫データを取得`);
```

### 2.2 利益データ取得

**関数:** `fetchProfitData()`

**ファイル:** `shared/tools/profit-tools.ts`

**戻り値:** `Promise<ProfitData[]>`

**型定義:**

```typescript
interface ProfitData {
  sku: string;                    // SKUコード
  productName: string;            // 商品名
  sales: number;                  // 売上額
  cost: number | null;            // 原価（未登録の場合はnull）
  shippingCost: number;           // 配送費
  adCost: number;                 // 広告費
  fee: number;                    // 手数料
  mall: 'amazon' | 'rakuten' | 'yahoo' | 'aupay' | 'qoo10';
  period: string;                 // 期間（YYYY-MM形式）
}
```

**使用例:**

```typescript
import { fetchProfitData } from './shared/tools/profit-tools';

const data = await fetchProfitData();
const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
```

### 2.3 在庫アラートフロー実行

**関数:** `inventoryAlertFlow()`

**ファイル:** `flows/inventory-alert-flow.ts`

**戻り値:** `Promise<void>`

**説明:** 在庫データを分析し、アラートをSlackに通知します。

**検出アラート:**
- 🔴 `critical`: 在庫切れ注意（7日分以下）
- 🟡 `warning`: 在庫警告（14日分以下）
- 🔵 `info`: 滞留在庫（90日以上未販売）/ 過剰在庫（180日分以上）

**使用例:**

```typescript
import { inventoryAlertFlow } from './flows/inventory-alert-flow';

await inventoryAlertFlow();
```

### 2.4 利益管理フロー実行

**関数:** `profitManagementFlow()`

**ファイル:** `flows/profit-management-flow.ts`

**戻り値:** `Promise<void>`

**説明:** 前月の利益データを分析し、レポートをSlackに通知します。

**分析内容:**
- 商品別・モール別の利益率計算
- 原価未登録商品の検出
- 低利益率商品（10%未満）のアラート
- 推奨アクションの生成

**使用例:**

```typescript
import { profitManagementFlow } from './flows/profit-management-flow';

await profitManagementFlow();
```

### 2.5 商品名バリデーションフロー実行

**関数:** `titleValidationFlow()`

**ファイル:** `flows/title-validation-flow.ts`

**戻り値:** `Promise<TitleValidationReport>`

**説明:** Amazon商品名を取得し、75文字超過を検出します。Issue #7対応。

**検出内容:**
- 🟡 `warning`: 1〜10文字超過
- 🔴 `error`: 11文字以上超過

**型定義:**

```typescript
interface TitleValidationReport {
  totalProducts: number;        // 総商品数
  validCount: number;           // 適切な商品数
  invalidCount: number;         // 超過商品数
  warningCount: number;         // 警告（1〜10文字超過）
  errorCount: number;           // 要修正（11文字以上超過）
  invalidProducts: TitleValidationResult[];  // 超過商品一覧
  summary: string;              // サマリーメッセージ
  timestamp: string;            // 実行日時（ISO 8601）
}

interface TitleValidationResult {
  asin: string;                 // ASIN
  sku: string;                  // SKU
  productName: string;          // 商品名
  titleLength: number;          // 実際の文字数
  maxLength: number;            // 最大文字数（75）
  isValid: boolean;             // 適切かどうか
  overBy: number;               // 超過文字数
  severity: 'ok' | 'warning' | 'error';
  recommendation: string;       // 修正推奨メッセージ
}
```

**使用例:**

```typescript
import { titleValidationFlow } from './flows/title-validation-flow';

const report = await titleValidationFlow();
console.log(`${report.invalidCount}件の商品名が75文字を超過`);
report.invalidProducts.forEach(p => {
  console.log(`${p.productName}: ${p.titleLength}文字 (+${p.overBy})`);
});
```

### 2.6 Amazon商品カタログデータ取得

**関数:** `fetchAmazonProducts()`

**ファイル:** `shared/tools/amazon-catalog-tools.ts`

**戻り値:** `Promise<AmazonProduct[]>`

**型定義:**

```typescript
interface AmazonProduct {
  asin: string;                 // ASIN
  sku: string;                  // SKU
  productName: string;          // 商品名
  titleLength: number;          // タイトル文字数
  category: string;             // カテゴリ
  status: 'active' | 'inactive' | 'suppressed';
  lastUpdated: string;          // 最終更新日時（ISO 8601）
}
```

**使用例:**

```typescript
import { fetchAmazonProducts, validateProductTitle } from './shared/tools/amazon-catalog-tools';

const products = await fetchAmazonProducts();
products.forEach(p => {
  const result = validateProductTitle(p);
  if (!result.isValid) {
    console.log(`${p.productName}: ${result.overBy}文字超過`);
  }
});
```

### 2.7 Slack通知送信

**関数:** `sendSlackNotification(alerts)`

**ファイル:** `shared/tools/slack-tools.ts`

**パラメータ:**

| 名前 | 型 | 説明 |
|------|-----|------|
| `alerts` | `InventoryAlert[]` | アラート情報の配列 |

**型定義:**

```typescript
interface InventoryAlert {
  sku: string;
  productName: string;
  currentStock: number;
  daysOfStock: number;
  alertLevel: 'critical' | 'warning' | 'info';
  recommendedAction: string;
  mall: string;
}
```

---

## 3. HTTP API（Phase 2で実装予定）

> ⚠️ 以下はPhase 2で実装予定のHTTP API仕様です。現在は上記TypeScriptモジュールを直接利用してください。

### 2.1 在庫データ取得

**エンドポイント:** `GET /api/inventory`

**説明:** 全モールの在庫データを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `mall` | string | いいえ | フィルタリングするモール（amazon, rakuten, yahoo, aupay, qoo10, warehouse） |
| `sku` | string | いいえ | フィルタリングするSKU |
| `daysOfStock` | number | いいえ | 在庫日数の閾値（以下を検出） |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "sku": "IPHONE-CASE-001",
      "productName": "iPhone 15 Pro ケース クリア",
      "quantity": 5,
      "averageDailySales": 2.5,
      "daysOfStock": 2,
      "daysSinceLastSale": 1,
      "mall": "amazon",
      "lastUpdated": "2026-06-12T23:00:00Z"
    }
  ],
  "count": 1
}
```

**エラーレスポンス:**

```json
{
  "status": "error",
  "code": "INVALID_PARAMETER",
  "message": "Invalid mall parameter"
}
```

### 2.2 在庫アラート取得

**エンドポイント:** `GET /api/inventory/alerts`

**説明:** 在庫アラートを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `alertLevel` | string | いいえ | アラートレベル（critical, warning, info） |
| `mall` | string | いいえ | フィルタリングするモール |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "sku": "IPHONE-CASE-001",
      "productName": "iPhone 15 Pro ケース クリア",
      "currentStock": 5,
      "daysOfStock": 2,
      "alertLevel": "critical",
      "recommendedAction": "緊急発注または広告停止",
      "mall": "amazon"
    }
  ],
  "count": 1
}
```

---

## 3. Profit API

### 3.1 利益データ取得

**エンドポイント:** `GET /api/profit`

**説明:** 利益データを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `period` | string | いいえ | 期間（YYYY-MM形式） |
| `mall` | string | いいえ | フィルタリングするモール |
| `sku` | string | いいえ | フィルタリングするSKU |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "sku": "IPHONE-CASE-001",
      "productName": "iPhone 15 Pro ケース クリア",
      "sales": 450000,
      "cost": 180000,
      "shippingCost": 45000,
      "adCost": 90000,
      "fee": 67500,
      "profit": 67500,
      "profitMargin": 0.15,
      "mall": "amazon",
      "period": "2026-05"
    }
  ],
  "count": 1
}
```

### 3.2 利益レポート取得

**エンドポイント:** `GET /api/profit/report`

**説明:** 利益レポートを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `period` | string | いいえ | 期間（YYYY-MM形式） |

**レスポンス:**

```json
{
  "status": "success",
  "data": {
    "period": "2026-05",
    "summary": {
      "totalSales": 3800000,
      "totalProfit": 1140000,
      "profitMargin": 0.30,
      "unregisteredCount": 2,
      "anomalyCount": 3
    },
    "topLowMarginProducts": [
      {
        "sku": "CABLE-001",
        "productName": "Lightning ケーブル 1m",
        "profitMargin": 0.05,
        "sales": 180000
      }
    ],
    "byMall": [
      {
        "mall": "amazon",
        "sales": 2000000,
        "profit": 600000,
        "profitMargin": 0.30
      }
    ],
    "anomalies": [
      {
        "type": "low_margin",
        "sku": "CABLE-001",
        "currentValue": 0.05,
        "expectedValue": 0.10,
        "severity": "medium",
        "message": "Lightning ケーブル 1mの利益率が5.00%で低いです"
      }
    ],
    "recommendations": [
      "原価未登録商品2件の原価を登録してください",
      "高売上・低利益率商品1件の価格調整を検討してください"
    ]
  }
}
```

---

## 4. KPI API

### 4.1 KPIデータ取得

**エンドポイント:** `GET /api/kpi`

**説明:** KPIデータを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `period` | string | いいえ | 期間（YYYY-MM-DD形式） |
| `mall` | string | いいえ | フィルタリングするモール |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "date": "2026-06-12",
      "mall": "amazon",
      "sales": 150000,
      "pv": 5000,
      "cvr": 0.03,
      "organicPVRatio": 0.60,
      "adSpend": 30000,
      "roas": 5.0
    }
  ],
  "count": 1
}
```

### 4.2 異常値検出

**エンドポイント:** `GET /api/kpi/anomalies`

**説明:** KPIの異常値を検出します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `period` | string | いいえ | 期間（YYYY-MM-DD形式） |
| `threshold` | number | いいえ | 異常値閾値（デフォルト: 0.3） |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "mall": "amazon",
      "metric": "sales",
      "currentValue": 150000,
      "previousValue": 100000,
      "changeRate": 0.50,
      "severity": "high",
      "message": "Amazonの売上が前日比50%増加"
    }
  ],
  "count": 1
}
```

---

## 5. Content API

### 5.1 商品コンテンツ取得

**エンドポイント:** `GET /api/content/products`

**説明:** 商品コンテンツデータを取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `asin` | string | いいえ | フィルタリングするASIN |
| `mall` | string | いいえ | フィルタリングするモール |

**レスポンス:**

```json
{
  "status": "success",
  "data": [
    {
      "asin": "B0F4XC3QLD",
      "title": "iPhone 15 Pro ケース クリア",
      "titleLength": 25,
      "bulletPoints": [
        "高品質な素材を使用",
        "精密な設計",
        "ワイヤレス充電対応"
      ],
      "description": "...",
      "mainKeywords": ["iPhone 15 Pro", "ケース", "クリア"],
      "mall": "amazon"
    }
  ],
  "count": 1
}
```

### 5.2 コンテンツ改善案取得

**エンドポイント:** `GET /api/content/improvements`

**説明:** コンテンツ改善案を取得します。

**リクエストパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `asin` | string | はい | ASIN |

**レスポンス:**

```json
{
  "status": "success",
  "data": {
    "asin": "B0F4XC3QLD",
    "currentTitle": "iPhone 15 Pro ケース クリア",
    "suggestedTitle": "iPhone 15 Pro ケース クリア 衝撃吸収 耐衝撃 薄型",
    "improvements": [
      "キーワードを3つ追加",
      "文字数を75文字以内に最適化",
      "クリック率向上案"
    ],
    "expectedImpact": "CTR 20%向上",
    "priority": "high"
  }
}
```

---

## 6. エラーコード

| コード | 説明 |
|-------|------|
| `INVALID_PARAMETER` | 無効なパラメータ |
| `NOT_FOUND` | リソースが見つからない |
| `UNAUTHORIZED` | 認証エラー |
| `RATE_LIMIT` | レート制限 |
| `INTERNAL_ERROR` | 内部エラー |

---

## 7. 認証

すべてのAPIリクエストには、Bearerトークンが必要です。

```
Authorization: Bearer <your-token>
```

---

## 8. レート制限

| エンドポイント | リクエスト/分 |
|--------------|---------------|
| `/api/inventory` | 60 |
| `/api/profit` | 30 |
| `/api/kpi` | 60 |
| `/api/content` | 30 |

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-13 | v1.1.0: TypeScriptモジュールAPI仕様追加、HTTP APIをPhase 2予定に変更 |
| 2026-06-12 | 初版作成 |

# API仕様書

> 作成日: 2026年6月12日  
> 版本: 1.0.0

---

## 1. 概要

本ドキュメントは、MWS EC OptimizationプロジェクトのAPI仕様を定義します。

### 1.1 利用可能なAPI

| API名 | 説明 | エンドポイント |
|-------|------|--------------|
| Inventory API | 在庫データ取得 | `/api/inventory` |
| Profit API | 利益データ取得 | `/api/profit` |
| KPI API | KPIデータ取得 | `/api/kpi` |
| Content API | コンテンツ最適化 | `/api/content` |

---

## 2. Inventory API

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
| 2026-06-12 | 初版作成 |

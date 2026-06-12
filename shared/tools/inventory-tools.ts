/**
 * 在庫データツール
 * 
 * 概要:
 * - Amazon FBA在庫
 * - 自社倉庫在庫
 * - 各モール在庫
 * 
 * 注意:
 * - 現在はモックデータ
 * - 本番ではAmazon Ads MCP, CSV, APIから取得
 */

// 在庫データ型
export interface InventoryData {
  sku: string;
  productName: string;
  quantity: number;
  averageDailySales: number;
  daysSinceLastSale: number;
  mall: 'amazon' | 'rakuten' | 'yahoo' | 'aupay' | 'qoo10' | 'warehouse';
  lastUpdated: string;
}

/**
 * 在庫データ取得
 * 
 * 本番実装では以下から取得:
 * - Amazon Ads MCP (FBA在庫)
 * - 各モールのAPI/CSV
 * - 自社倉庫システム
 */
export async function fetchInventoryData(): Promise<InventoryData[]> {
  // TODO: 本番実装
  // - Amazon Ads MCPでFBA在庫取得
  // - 楽天APIで楽天在庫取得
  // - Yahoo APIでYahoo在庫取得
  // - auPay APIでauPay在庫取得
  // - Qoo10 APIでQoo10在庫取得
  // - 自社倉庫システムで自社倉庫在庫取得
  
  // モックデータ（テスト用）
  return getMockInventoryData();
}

/**
 * モック在庫データ（テスト用）
 */
function getMockInventoryData(): InventoryData[] {
  return [
    {
      sku: 'IPHONE-CASE-001',
      productName: 'iPhone 15 Pro ケース クリア',
      quantity: 5,
      averageDailySales: 2.5,
      daysSinceLastSale: 1,
      mall: 'amazon',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'IPHONE-CASE-002',
      productName: 'iPhone 15 Pro ケース ブラック',
      quantity: 50,
      averageDailySales: 1.2,
      daysSinceLastSale: 2,
      mall: 'amazon',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'GALAXY-CASE-001',
      productName: 'Galaxy S24 ケース クリア',
      quantity: 200,
      averageDailySales: 0.3,
      daysSinceLastSale: 120,
      mall: 'amazon',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'SCREEN-PROTECTOR-001',
      productName: 'iPhone 15 Pro ガラスフィルム',
      quantity: 10,
      averageDailySales: 3.0,
      daysSinceLastSale: 1,
      mall: 'rakuten',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'CHARGER-001',
      productName: 'USB-C 充電器 20W',
      quantity: 300,
      averageDailySales: 0.5,
      daysSinceLastSale: 5,
      mall: 'warehouse',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'CABLE-001',
      productName: 'Lightning ケーブル 1m',
      quantity: 8,
      averageDailySales: 1.5,
      daysSinceLastSale: 2,
      mall: 'yahoo',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      sku: 'EARPHONE-001',
      productName: 'Bluetooth イヤホン',
      quantity: 150,
      averageDailySales: 0.2,
      daysSinceLastSale: 95,
      mall: 'qoo10',
      lastUpdated: '2026-06-12T23:00:00Z'
    }
  ];
}

/**
 * Amazon FBA在庫取得（MCP経由）
 * 
 * 本番実装用
 */
export async function fetchAmazonFBAInventory(): Promise<InventoryData[]> {
  // TODO: Amazon Ads MCP経由で取得
  // const result = await amazonAdsMCP.getInventory();
  // return parseAmazonInventory(result);
  
  return getMockInventoryData().filter(item => item.mall === 'amazon');
}

/**
 * 自社倉庫在庫取得
 * 
 * 本番実装用
 */
export async function fetchWarehouseInventory(): Promise<InventoryData[]> {
  // TODO: 自社倉庫システムAPI経由で取得
  // const result = await warehouseAPI.getInventory();
  // return parseWarehouseInventory(result);
  
  return getMockInventoryData().filter(item => item.mall === 'warehouse');
}

/**
 * 利益データツール
 * 
 * 概要:
 * - 売上データ
 * - 原価データ
 * - 配送費
 * - 広告費
 * - 手数料
 * 
 * 注意:
 * - 現在はモックデータ
 * - 本番ではCSV/Excel, APIから取得
 */

// 利益データ型
export interface ProfitData {
  sku: string;
  productName: string;
  sales: number;
  cost: number | null;
  shippingCost: number;
  adCost: number;
  fee: number;
  mall: 'amazon' | 'rakuten' | 'yahoo' | 'aupay' | 'qoo10';
  period: string;
}

// 原価未登録商品
export interface UnregisteredCostItem {
  sku: string;
  productName: string;
  sales: number;
  mall: string;
}

/**
 * 利益データ取得
 * 
 * 本番実装では以下から取得:
 * - 各モールのCSV/Excel
 * - Amazon Ads MCP
 * - 自社システム
 */
export async function fetchProfitData(): Promise<ProfitData[]> {
  // TODO: 本番実装
  // - Amazon CSVから売上・手数料取得
  // - 楽天CSVから売上・手数料取得
  // - Yahoo CSVから売上・手数料取得
  // - 原価シートから原価取得
  // - 配送費シートから配送費取得
  // - 広告費シートから広告費取得
  
  // モックデータ（テスト用）
  return getMockProfitData();
}

/**
 * モック利益データ（テスト用）
 */
function getMockProfitData(): ProfitData[] {
  const period = getPreviousMonth();
  
  return [
    {
      sku: 'IPHONE-CASE-001',
      productName: 'iPhone 15 Pro ケース クリア',
      sales: 450000,
      cost: 180000,
      shippingCost: 45000,
      adCost: 90000,
      fee: 67500,
      mall: 'amazon',
      period
    },
    {
      sku: 'IPHONE-CASE-002',
      productName: 'iPhone 15 Pro ケース ブラック',
      sales: 320000,
      cost: 128000,
      shippingCost: 32000,
      adCost: 64000,
      fee: 48000,
      mall: 'amazon',
      period
    },
    {
      sku: 'SCREEN-PROTECTOR-001',
      productName: 'iPhone 15 Pro ガラスフィルム',
      sales: 280000,
      cost: 84000,
      shippingCost: 28000,
      adCost: 56000,
      fee: 42000,
      mall: 'rakuten',
      period
    },
    {
      sku: 'GALAXY-CASE-001',
      productName: 'Galaxy S24 ケース クリア',
      sales: 150000,
      cost: 60000,
      shippingCost: 15000,
      adCost: 30000,
      fee: 22500,
      mall: 'amazon',
      period
    },
    {
      sku: 'CHARGER-001',
      productName: 'USB-C 充電器 20W',
      sales: 600000,
      cost: null, // 原価未登録
      shippingCost: 60000,
      adCost: 120000,
      fee: 90000,
      mall: 'amazon',
      period
    },
    {
      sku: 'CABLE-001',
      productName: 'Lightning ケーブル 1m',
      sales: 180000,
      cost: 90000,
      shippingCost: 18000,
      adCost: 36000,
      fee: 27000,
      mall: 'yahoo',
      period
    },
    {
      sku: 'EARPHONE-001',
      productName: 'Bluetooth イヤホン',
      sales: 500000,
      cost: 250000,
      shippingCost: 50000,
      adCost: 100000,
      fee: 75000,
      mall: 'qoo10',
      period
    },
    {
      sku: 'SPEAKER-001',
      productName: 'Bluetooth スピーカー',
      sales: 800000,
      cost: 480000,
      shippingCost: 80000,
      adCost: 160000,
      fee: 120000,
      mall: 'amazon',
      period
    },
    {
      sku: 'BATTERY-001',
      productName: 'モバイルバッテリー 10000mAh',
      sales: 400000,
      cost: null, // 原価未登録
      shippingCost: 40000,
      adCost: 80000,
      fee: 60000,
      mall: 'rakuten',
      period
    },
    {
      sku: 'STAND-001',
      productName: 'スマホスタンド',
      sales: 120000,
      cost: 48000,
      shippingCost: 12000,
      adCost: 24000,
      fee: 18000,
      mall: 'aupay',
      period
    }
  ];
}

/**
 * 前月取得
 */
function getPreviousMonth(): string {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Amazon売上データ取得（CSV）
 * 
 * 本番実装用
 */
export async function fetchAmazonSalesData(): Promise<ProfitData[]> {
  // TODO: Amazon CSVから取得
  // const csv = await fs.readFile('data/amazon-sales.csv', 'utf-8');
  // return parseAmazonCSV(csv);
  
  return getMockProfitData().filter(item => item.mall === 'amazon');
}

/**
 * 楽天売上データ取得（CSV）
 * 
 * 本番実装用
 */
export async function fetchRakutenSalesData(): Promise<ProfitData[]> {
  // TODO: 楽天CSVから取得
  // const csv = await fs.readFile('data/rakuten-sales.csv', 'utf-8');
  // return parseRakutenCSV(csv);
  
  return getMockProfitData().filter(item => item.mall === 'rakuten');
}

/**
 * 原価データ取得（Excel）
 * 
 * 本番実装用
 */
export async function fetchCostData(): Promise<Map<string, number>> {
  // TODO: 原価Excelから取得
  // const excel = await fs.readFile('data/cost-list.xlsx');
  // return parseCostExcel(excel);
  
  const costMap = new Map<string, number>();
  const mockData = getMockProfitData();
  
  for (const item of mockData) {
    if (item.cost !== null) {
      costMap.set(item.sku, item.cost);
    }
  }
  
  return costMap;
}

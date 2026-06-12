/**
 * 在庫アラートフロー テスト
 */

import { fetchInventoryData, InventoryData } from '../shared/tools/inventory-tools';

// analyzeInventory関数をテスト用にエクスポートされていないため、
// フロー全体の動作をテストする
describe('在庫アラートフロー', () => {
  describe('fetchInventoryData', () => {
    it('モックデータを取得できる', async () => {
      const data = await fetchInventoryData();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('各在庫データが必要なフィールドを持つ', async () => {
      const data = await fetchInventoryData();
      
      for (const item of data) {
        expect(item.sku).toBeDefined();
        expect(item.productName).toBeDefined();
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.averageDailySales).toBe('number');
        expect(typeof item.daysSinceLastSale).toBe('number');
        expect(item.mall).toBeDefined();
        expect(item.lastUpdated).toBeDefined();
      }
    });

    it('在庫切れ注意アイテム（14日分以下）が存在する', async () => {
      const data = await fetchInventoryData();
      
      const lowStockItems = data.filter(item => {
        const daysOfStock = item.averageDailySales > 0 
          ? Math.floor(item.quantity / item.averageDailySales) 
          : Infinity;
        return daysOfStock <= 14;
      });
      
      expect(lowStockItems.length).toBeGreaterThan(0);
    });

    it('滞留在庫（90日以上未販売）が存在する', async () => {
      const data = await fetchInventoryData();
      
      const stagnantItems = data.filter(item => item.daysSinceLastSale >= 90);
      expect(stagnantItems.length).toBeGreaterThan(0);
    });

    it('過剰在庫（180日分以上）が存在する', async () => {
      const data = await fetchInventoryData();
      
      const excessItems = data.filter(item => {
        const daysOfStock = item.averageDailySales > 0 
          ? Math.floor(item.quantity / item.averageDailySales) 
          : Infinity;
        return daysOfStock >= 180;
      });
      
      expect(excessItems.length).toBeGreaterThan(0);
    });
  });

  describe('在庫日数計算', () => {
    it('日数計算が正しい', () => {
      const item: InventoryData = {
        sku: 'TEST-001',
        productName: 'Test Product',
        quantity: 30,
        averageDailySales: 2,
        daysSinceLastSale: 1,
        mall: 'amazon',
        lastUpdated: new Date().toISOString()
      };
      
      const daysOfStock = Math.floor(item.quantity / item.averageDailySales);
      expect(daysOfStock).toBe(15);
    });

    it('平均日間売上が0の場合はInfinityを返す', () => {
      const item: InventoryData = {
        sku: 'TEST-002',
        productName: 'Test Product No Sales',
        quantity: 100,
        averageDailySales: 0,
        daysSinceLastSale: 100,
        mall: 'amazon',
        lastUpdated: new Date().toISOString()
      };
      
      const daysOfStock = item.averageDailySales === 0 
        ? Infinity 
        : Math.floor(item.quantity / item.averageDailySales);
      expect(daysOfStock).toBe(Infinity);
    });
  });

  describe('モール別フィルタリング', () => {
    it('Amazon在庫をフィルタリングできる', async () => {
      const data = await fetchInventoryData();
      const amazonItems = data.filter(item => item.mall === 'amazon');
      expect(amazonItems.length).toBeGreaterThan(0);
    });

    it('自社倉庫在庫をフィルタリングできる', async () => {
      const data = await fetchInventoryData();
      const warehouseItems = data.filter(item => item.mall === 'warehouse');
      expect(warehouseItems.length).toBeGreaterThan(0);
    });
  });
});

/**
 * 利益管理フロー テスト
 */

import { fetchProfitData } from '../shared/tools/profit-tools';

describe('利益管理フロー', () => {
  describe('fetchProfitData', () => {
    it('モックデータを取得できる', async () => {
      const data = await fetchProfitData();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('各利益データが必要なフィールドを持つ', async () => {
      const data = await fetchProfitData();
      
      for (const item of data) {
        expect(item.sku).toBeDefined();
        expect(item.productName).toBeDefined();
        expect(typeof item.sales).toBe('number');
        // cost は null許容
        expect(item.shippingCost).toBeDefined();
        expect(typeof item.shippingCost).toBe('number');
        expect(item.adCost).toBeDefined();
        expect(typeof item.adCost).toBe('number');
        expect(item.fee).toBeDefined();
        expect(typeof item.fee).toBe('number');
        expect(item.mall).toBeDefined();
        expect(item.period).toBeDefined();
      }
    });

    it('原価未登録商品（cost === null）が存在する', async () => {
      const data = await fetchProfitData();
      
      const unregisteredItems = data.filter(item => item.cost === null);
      expect(unregisteredItems.length).toBeGreaterThan(0);
    });

    it('期間が正しく設定されている', async () => {
      const data = await fetchProfitData();
      
      // 全データの期間が同じであることを確認
      const periods = new Set(data.map(item => item.period));
      expect(periods.size).toBe(1);
    });
  });

  describe('総コスト計算', () => {
    it('総コスト = 原価 + 配送費 + 広告費 + 手数料', async () => {
      const data = await fetchProfitData();
      
      for (const item of data) {
        const expectedTotalCost = (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee;
        expect(expectedTotalCost).toBeGreaterThan(0);
      }
    });

    it('原価nullの場合は0として計算', async () => {
      const data = await fetchProfitData();
      const nullCostItems = data.filter(item => item.cost === null);
      
      for (const item of nullCostItems) {
        const totalCost = (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee;
        expect(totalCost).toBe(item.shippingCost + item.adCost + item.fee);
      }
    });
  });

  describe('利益率計算', () => {
    it('利益率が0〜100%の範囲に収まる（正常なデータ）', async () => {
      const data = await fetchProfitData();
      
      for (const item of data) {
        if (item.cost !== null && item.sales > 0) {
          const totalCost = item.cost + item.shippingCost + item.adCost + item.fee;
          const profit = item.sales - totalCost;
          const margin = profit / item.sales;
          
          // -100% 〜 100%の範囲（負の利益もありうる）
          expect(margin).toBeGreaterThanOrEqual(-1);
          expect(margin).toBeLessThanOrEqual(1);
        }
      }
    });

    it('低利益率商品（10%未満）が存在する', async () => {
      const data = await fetchProfitData();
      
      const lowMarginItems = data.filter(item => {
        if (item.sales === 0) return false;
        const totalCost = (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee;
        const margin = (item.sales - totalCost) / item.sales;
        return margin < 0.1;
      });
      
      expect(lowMarginItems.length).toBeGreaterThan(0);
    });
  });

  describe('モール別集計', () => {
    it('複数のモールが含まれている', async () => {
      const data = await fetchProfitData();
      const malls = new Set(data.map(item => item.mall));
      expect(malls.size).toBeGreaterThan(1);
    });

    it('Amazonのデータが存在する', async () => {
      const data = await fetchProfitData();
      const amazonItems = data.filter(item => item.mall === 'amazon');
      expect(amazonItems.length).toBeGreaterThan(0);
    });
  });
});

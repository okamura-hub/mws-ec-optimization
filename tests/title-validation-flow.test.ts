/**
 * Amazon商品名バリデーションフロー テスト
 * 
 * Issue: #7
 */

import {
  fetchAmazonProducts,
  validateProductTitle,
  validateAllProductTitles,
  AmazonProduct
} from '../shared/tools/amazon-catalog-tools';

import {
  titleValidationFlow,
  formatSlackMessage,
  formatSlackBlocks
} from '../flows/title-validation-flow';

describe('Amazon商品カタログツール', () => {
  describe('fetchAmazonProducts', () => {
    test('モックデータを取得できる', async () => {
      const products = await fetchAmazonProducts();
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    test('各商品データが必要なフィールドを持つ', async () => {
      const products = await fetchAmazonProducts();
      products.forEach(product => {
        expect(product).toHaveProperty('asin');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('productName');
        expect(product).toHaveProperty('titleLength');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('status');
        expect(product).toHaveProperty('lastUpdated');
      });
    });

    test('75文字超過の商品が含まれている', async () => {
      const products = await fetchAmazonProducts();
      const overLimit = products.filter(p => p.productName.length > 75);
      expect(overLimit.length).toBeGreaterThan(0);
    });

    test('75文字以内の商品も含まれている', async () => {
      const products = await fetchAmazonProducts();
      const withinLimit = products.filter(p => p.productName.length <= 75);
      expect(withinLimit.length).toBeGreaterThan(0);
    });
  });

  describe('validateProductTitle', () => {
    test('75文字以内の商品はisValid=true', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST001',
        sku: 'TEST-001',
        productName: '短い商品名',
        titleLength: 7,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('ok');
      expect(result.overBy).toBe(0);
    });

    test('ちょうど75文字の商品はisValid=true', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST002',
        sku: 'TEST-002',
        productName: 'あ'.repeat(75),
        titleLength: 75,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('ok');
      expect(result.overBy).toBe(0);
    });

    test('76文字の商品はisValid=false, severity=warning', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST003',
        sku: 'TEST-003',
        productName: 'あ'.repeat(76),
        titleLength: 76,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.overBy).toBe(1);
    });

    test('85文字の商品はseverity=warning（10文字超過）', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST004',
        sku: 'TEST-004',
        productName: 'あ'.repeat(85),
        titleLength: 85,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.overBy).toBe(10);
    });

    test('86文字の商品はseverity=error（11文字超過）', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST005',
        sku: 'TEST-005',
        productName: 'あ'.repeat(86),
        titleLength: 86,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.overBy).toBe(11);
    });

    test('カスタムmaxLengthを指定できる', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST006',
        sku: 'TEST-006',
        productName: 'あ'.repeat(51),
        titleLength: 51,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product, 50);
      expect(result.isValid).toBe(false);
      expect(result.overBy).toBe(1);
      expect(result.maxLength).toBe(50);
    });

    test('recommendationが設定されている', () => {
      const product: AmazonProduct = {
        asin: 'B0TEST007',
        sku: 'TEST-007',
        productName: 'あ'.repeat(80),
        titleLength: 80,
        category: 'Test',
        status: 'active',
        lastUpdated: '2026-06-13T00:00:00Z'
      };

      const result = validateProductTitle(product);
      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('validateAllProductTitles', () => {
    test('全商品を一括バリデーションできる', async () => {
      const products = await fetchAmazonProducts();
      const results = validateAllProductTitles(products);
      expect(results.length).toBe(products.length);
    });

    test('結果にisValid, severity, overByが含まれる', async () => {
      const products = await fetchAmazonProducts();
      const results = validateAllProductTitles(products);
      results.forEach(result => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('overBy');
        expect(result).toHaveProperty('recommendation');
      });
    });
  });
});

describe('商品名バリデーションフロー', () => {
  test('フローを実行してレポートを取得できる', async () => {
    const report = await titleValidationFlow();
    expect(report).toBeDefined();
    expect(report.totalProducts).toBeGreaterThan(0);
    expect(report.validCount + report.invalidCount).toBe(report.totalProducts);
    expect(report.timestamp).toBeDefined();
    expect(report.summary).toBeDefined();
  });

  test('レポートに超過商品が含まれる', async () => {
    const report = await titleValidationFlow();
    expect(report.invalidCount).toBeGreaterThan(0);
    expect(report.invalidProducts.length).toBe(report.invalidCount);
  });

  test('Slackメッセージを生成できる', async () => {
    const report = await titleValidationFlow();
    const message = formatSlackMessage(report);
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
    expect(message).toContain('Amazon商品名バリデーション');
  });

  test('Slack Block Kitフォーマットを生成できる', async () => {
    const report = await titleValidationFlow();
    const blocks = formatSlackBlocks(report);
    expect(blocks).toBeDefined();
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });
});

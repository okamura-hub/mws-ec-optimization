/**
 * Amazon商品カタログツール
 * 
 * 概要:
 * - Amazon出品商品データの取得
 * - 商品名（タイトル）の取得
 * - ASIN・SKU情報の取得
 * 
 * 注意:
 * - 現在はモックデータ
 * - 本番ではAmazon Ads MCP / SP-APIから取得
 * - 読み取り専用（書き込み操作は禁止）
 */

// Amazon商品データ型
export interface AmazonProduct {
  asin: string;
  sku: string;
  productName: string;
  titleLength: number;
  category: string;
  status: 'active' | 'inactive' | 'suppressed';
  lastUpdated: string;
}

// バリデーション結果型
export interface TitleValidationResult {
  asin: string;
  sku: string;
  productName: string;
  titleLength: number;
  maxLength: number;
  isValid: boolean;
  overBy: number;
  severity: 'ok' | 'warning' | 'error';
  recommendation: string;
}

/**
 * Amazon商品カタログデータ取得
 * 
 * 本番実装では以下から取得:
 * - Amazon Ads MCP (mcp__amazon-ads__search_products など)
 * - Amazon SP-API (Catalog Items API)
 * 
 * @returns {Promise<AmazonProduct[]>} Amazon商品データの配列
 * @throws {Error} データ取得に失敗した場合
 * 
 * @example
 * ```typescript
 * const products = await fetchAmazonProducts();
 * console.log(`${products.length}件の商品データを取得`);
 * ```
 */
export async function fetchAmazonProducts(): Promise<AmazonProduct[]> {
  // TODO: 本番実装
  // - Amazon Ads MCPで商品データ取得
  // - SP-API Catalog Items APIで商品情報取得
  
  return getMockAmazonProducts();
}

/**
 * 商品名のバリデーション
 * 
 * Amazonの商品名は75文字以内（カテゴリにより異なる場合あり）。
 * 75文字を超える商品名を検出し、修正推奨メッセージを生成します。
 * 
 * @param {AmazonProduct} product - バリデーション対象の商品
 * @param {number} maxLength - 最大文字数（デフォルト: 75）
 * @returns {TitleValidationResult} バリデーション結果
 * 
 * @example
 * ```typescript
 * const result = validateProductTitle(product);
 * if (!result.isValid) {
 *   console.log(`${result.overBy}文字超過: ${result.recommendation}`);
 * }
 * ```
 */
export function validateProductTitle(
  product: AmazonProduct,
  maxLength: number = 75
): TitleValidationResult {
  const titleLength = product.productName.length;
  const overBy = Math.max(0, titleLength - maxLength);
  const isValid = titleLength <= maxLength;

  let severity: 'ok' | 'warning' | 'error';
  let recommendation: string;

  if (isValid) {
    severity = 'ok';
    recommendation = '商品名は適切な長さです';
  } else if (overBy <= 10) {
    severity = 'warning';
    recommendation = `商品名が${overBy}文字超過しています。75文字以内に短縮してください`;
  } else {
    severity = 'error';
    recommendation = `商品名が${overBy}文字超過しています。早急な修正が必要です。主な商品名・ブランド名・商品タイプ の順で短縮を検討してください`;
  }

  return {
    asin: product.asin,
    sku: product.sku,
    productName: product.productName,
    titleLength,
    maxLength,
    isValid,
    overBy,
    severity,
    recommendation
  };
}

/**
 * 全商品のバリデーション一括実行
 * 
 * @param {AmazonProduct[]} products - バリデーション対象の商品リスト
 * @param {number} maxLength - 最大文字数（デフォルト: 75）
 * @returns {TitleValidationResult[]} バリデーション結果の配列
 * 
 * @example
 * ```typescript
 * const products = await fetchAmazonProducts();
 * const results = validateAllProductTitles(products);
 * const invalid = results.filter(r => !r.isValid);
 * console.log(`${invalid.length}件の商品名が75文字を超過`);
 * ```
 */
export function validateAllProductTitles(
  products: AmazonProduct[],
  maxLength: number = 75
): TitleValidationResult[] {
  return products.map(product => validateProductTitle(product, maxLength));
}

/**
 * モック Amazon商品データ（テスト用）
 * 
 * 実際の議事録で言及された商品をモデル化:
 * - iPhoneケース、Galaxyケース、ケーブル、充電器など
 * - 75文字超過の商品を含む
 */
function getMockAmazonProducts(): AmazonProduct[] {
  return [
    {
      asin: 'B0EXAMPLE01',
      sku: 'IPHONE-CASE-001',
      productName: 'iPhone 15 Pro ケース クリア 耐衝撃 透明',
      titleLength: 26,
      category: 'Electronics > Phone Cases',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE02',
      sku: 'IPHONE-CASE-002',
      productName: 'iPhone 15 Pro Max ケース MagSafe対応 耐衝撃 軍用規格 ミリタリーグレード プロテクション クリア ソフト TPU バンパー 衝撃吸収 黄変防止 高精細 薄型 軽量',
      titleLength: 78,
      category: 'Electronics > Phone Cases',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE03',
      sku: 'GALAXY-CASE-001',
      productName: 'Galaxy S24 Ultra ケース 耐衝撃 Sペン対応 収納スタンド付き ハンドストラップ付属 軍用規格 衝撃吸収 滑り止め フィンガーホール カメラ保護 IP68防水対応 黒',
      titleLength: 82,
      category: 'Electronics > Phone Cases',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE04',
      sku: 'CABLE-001',
      productName: 'USB-C to Lightning ケーブル 1.2m MFi認証済み iPhone iPad対応 高速充電 データ転送 ナイロン編み 高耐久 折り曲げ試験10000回以上達成 ホワイト',
      titleLength: 80,
      category: 'Electronics > Cables',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE05',
      sku: 'CHARGER-001',
      productName: 'USB-C 充電器 20W PD対応',
      titleLength: 17,
      category: 'Electronics > Chargers',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE06',
      sku: 'EARPHONE-001',
      productName: 'Bluetooth イヤホン ワイヤレス 完全ワイヤレス ノイズキャンセリング対応 IPX7防水 連続再生時間最大30時間 ハンズフリー通話対応 日本語音声ガイド搭載 ブラック',
      titleLength: 81,
      category: 'Electronics > Earphones',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE07',
      sku: 'SCREEN-001',
      productName: 'iPhone 15 Pro ガラスフィルム 9H硬度 0.3mm超薄型 指紋防止 気泡ゼロ 2枚入り',
      titleLength: 47,
      category: 'Electronics > Screen Protectors',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    },
    {
      asin: 'B0EXAMPLE08',
      sku: 'KEYCASE-001',
      productName: 'スマートキーケース 本革製 車キーカバー トヨタ ホンダ 日産 汎用 本皮 牛革 手縫い キーリング付き 高級感 ビジネス 贈り物 プレゼント ギフト 父の日 ブラック',
      titleLength: 80,
      category: 'Automotive > Key Cases',
      status: 'active',
      lastUpdated: '2026-06-12T23:00:00Z'
    }
  ];
}

/**
 * キャンペーンパフォーマンスデータツール
 * 
 * 概要:
 * - 広告キャンペーン別のパフォーマンスデータ取得
 * - ROAS（広告費用対効果）計算
 * - 期間比較データ提供
 * 
 * 注意:
 * - 現在はモックデータ
 * - 本番ではAmazon Ads MCP, 各モール広告APIから取得
 * 
 * Issue #8: ROAS低下キャンペーン自動検出
 */

// 広告モール種別
export type AdMall = 'amazon' | 'rakuten' | 'yahoo' | 'qoo10' | 'aupay';

// キャンペーン種別
export type CampaignType = 'sp' | 'sd' | 'sb' | 'display' | 'affiliate';

// 期間パフォーマンス
export interface PeriodPerformance {
  adSpend: number;        // 広告費（円）
  adRevenue: number;      // 広告売上（円）
  roas: number;           // ROAS（売上÷広告費）
  impressions: number;    // インプレッション数
  clicks: number;         // クリック数
  ctr: number;            // クリックスルー率（クリック÷インプレッション）
  conversions: number;    // コンバージョン数
  conversionRate: number; // CV率（コンバージョン÷クリック）
  cpc: number;            // クリック単価（広告費÷クリック）
  newToExistingRatio: number; // 新規:既存比率（0-1、1=完全新規）
}

// キャンペーンデータ
export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  mall: AdMall;
  campaignType: CampaignType;
  status: 'enabled' | 'paused' | 'archived';
  currentPeriod: PeriodPerformance;
  previousPeriod: PeriodPerformance;
  roasChange: number;        // ROAS絶対変化
  roasChangeRate: number;    // ROAS変化率（-1 to 1）
  budget: number;            // 日予算（円）
  budgetUtilization: number; // 予算消化率（0-1）
}

// モックキャンペーンデータ（計算前）
type RawCampaignData = Omit<CampaignPerformance, 'roasChange' | 'roasChangeRate'>;

// モックキャンペーンデータ生成
export function getMockCampaignData(): CampaignPerformance[] {
  const campaigns: RawCampaignData[] = [
    {
      campaignId: 'AMP-SP-001',
      campaignName: 'iPhoneケース SP 自動',
      mall: 'amazon',
      campaignType: 'sp',
      status: 'enabled',
      budget: 5000,
      budgetUtilization: 0.95,
      currentPeriod: {
        adSpend: 142500,
        adRevenue: 427500,
        roas: 3.0,
        impressions: 285000,
        clicks: 9500,
        ctr: 0.0333,
        conversions: 950,
        conversionRate: 0.10,
        cpc: 15,
        newToExistingRatio: 0.35
      },
      previousPeriod: {
        adSpend: 135000,
        adRevenue: 540000,
        roas: 4.0,
        impressions: 300000,
        clicks: 10000,
        ctr: 0.0333,
        conversions: 1200,
        conversionRate: 0.12,
        cpc: 13.5,
        newToExistingRatio: 0.40
      }
    },
    {
      campaignId: 'AMP-SP-002',
      campaignName: 'Galaxyケース SP 手動',
      mall: 'amazon',
      campaignType: 'sp',
      status: 'enabled',
      budget: 3000,
      budgetUtilization: 0.60,
      currentPeriod: {
        adSpend: 54000,
        adRevenue: 108000,
        roas: 2.0,
        impressions: 108000,
        clicks: 3600,
        ctr: 0.0333,
        conversions: 270,
        conversionRate: 0.075,
        cpc: 15,
        newToExistingRatio: 0.25
      },
      previousPeriod: {
        adSpend: 60000,
        adRevenue: 180000,
        roas: 3.0,
        impressions: 120000,
        clicks: 4000,
        ctr: 0.0333,
        conversions: 400,
        conversionRate: 0.10,
        cpc: 15,
        newToExistingRatio: 0.30
      }
    },
    {
      campaignId: 'AMP-SD-001',
      campaignName: '充電器 SD ターゲット',
      mall: 'amazon',
      campaignType: 'sd',
      status: 'enabled',
      budget: 8000,
      budgetUtilization: 0.88,
      currentPeriod: {
        adSpend: 211200,
        adRevenue: 316800,
        roas: 1.5,
        impressions: 528000,
        clicks: 10560,
        ctr: 0.02,
        conversions: 528,
        conversionRate: 0.05,
        cpc: 20,
        newToExistingRatio: 0.55
      },
      previousPeriod: {
        adSpend: 180000,
        adRevenue: 450000,
        roas: 2.5,
        impressions: 450000,
        clicks: 9000,
        ctr: 0.02,
        conversions: 750,
        conversionRate: 0.083,
        cpc: 20,
        newToExistingRatio: 0.50
      }
    },
    {
      campaignId: 'AMP-SB-001',
      campaignName: 'アクセサリー SB ブランド',
      mall: 'amazon',
      campaignType: 'sb',
      status: 'enabled',
      budget: 10000,
      budgetUtilization: 0.72,
      currentPeriod: {
        adSpend: 216000,
        adRevenue: 864000,
        roas: 4.0,
        impressions: 360000,
        clicks: 7200,
        ctr: 0.02,
        conversions: 432,
        conversionRate: 0.06,
        cpc: 30,
        newToExistingRatio: 0.45
      },
      previousPeriod: {
        adSpend: 200000,
        adRevenue: 800000,
        roas: 4.0,
        impressions: 333000,
        clicks: 6660,
        ctr: 0.02,
        conversions: 400,
        conversionRate: 0.06,
        cpc: 30,
        newToExistingRatio: 0.42
      }
    },
    {
      campaignId: 'AMP-SP-003',
      campaignName: 'イヤホン SP 自動',
      mall: 'amazon',
      campaignType: 'sp',
      status: 'enabled',
      budget: 6000,
      budgetUtilization: 0.92,
      currentPeriod: {
        adSpend: 165600,
        adRevenue: 248400,
        roas: 1.5,
        impressions: 276000,
        clicks: 9200,
        ctr: 0.0333,
        conversions: 460,
        conversionRate: 0.05,
        cpc: 18,
        newToExistingRatio: 0.30
      },
      previousPeriod: {
        adSpend: 150000,
        adRevenue: 375000,
        roas: 2.5,
        impressions: 250000,
        clicks: 8333,
        ctr: 0.0333,
        conversions: 625,
        conversionRate: 0.075,
        cpc: 18,
        newToExistingRatio: 0.35
      }
    },
    {
      campaignId: 'RKP-AFF-001',
      campaignName: '楽天 RPP キーワード',
      mall: 'rakuten',
      campaignType: 'affiliate',
      status: 'enabled',
      budget: 4000,
      budgetUtilization: 0.85,
      currentPeriod: {
        adSpend: 102000,
        adRevenue: 408000,
        roas: 4.0,
        impressions: 204000,
        clicks: 6800,
        ctr: 0.0333,
        conversions: 680,
        conversionRate: 0.10,
        cpc: 15,
        newToExistingRatio: 0.40
      },
      previousPeriod: {
        adSpend: 96000,
        adRevenue: 432000,
        roas: 4.5,
        impressions: 192000,
        clicks: 6400,
        ctr: 0.0333,
        conversions: 720,
        conversionRate: 0.1125,
        cpc: 15,
        newToExistingRatio: 0.38
      }
    },
    {
      campaignId: 'YHP-SP-001',
      campaignName: 'Yahoo プロモーション',
      mall: 'yahoo',
      campaignType: 'sp',
      status: 'enabled',
      budget: 2000,
      budgetUtilization: 0.45,
      currentPeriod: {
        adSpend: 27000,
        adRevenue: 24300,
        roas: 0.9,
        impressions: 54000,
        clicks: 1800,
        ctr: 0.0333,
        conversions: 81,
        conversionRate: 0.045,
        cpc: 15,
        newToExistingRatio: 0.20
      },
      previousPeriod: {
        adSpend: 30000,
        adRevenue: 45000,
        roas: 1.5,
        impressions: 60000,
        clicks: 2000,
        ctr: 0.0333,
        conversions: 120,
        conversionRate: 0.06,
        cpc: 15,
        newToExistingRatio: 0.22
      }
    },
    {
      campaignId: 'AMP-DSP-001',
      campaignName: 'ディスプレイ広告 新商品',
      mall: 'amazon',
      campaignType: 'display',
      status: 'enabled',
      budget: 15000,
      budgetUtilization: 0.67,
      currentPeriod: {
        adSpend: 300000,
        adRevenue: 150000,
        roas: 0.5,
        impressions: 1500000,
        clicks: 15000,
        ctr: 0.01,
        conversions: 75,
        conversionRate: 0.005,
        cpc: 20,
        newToExistingRatio: 0.80
      },
      previousPeriod: {
        adSpend: 250000,
        adRevenue: 200000,
        roas: 0.8,
        impressions: 1250000,
        clicks: 12500,
        ctr: 0.01,
        conversions: 100,
        conversionRate: 0.008,
        cpc: 20,
        newToExistingRatio: 0.75
      }
    },
    {
      campaignId: 'AMP-SP-004',
      campaignName: 'スピーカー SP 固定',
      mall: 'amazon',
      campaignType: 'sp',
      status: 'paused',
      budget: 3000,
      budgetUtilization: 0.0,
      currentPeriod: {
        adSpend: 0,
        adRevenue: 0,
        roas: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        cpc: 0,
        newToExistingRatio: 0
      },
      previousPeriod: {
        adSpend: 45000,
        adRevenue: 67500,
        roas: 1.5,
        impressions: 90000,
        clicks: 3000,
        ctr: 0.0333,
        conversions: 150,
        conversionRate: 0.05,
        cpc: 15,
        newToExistingRatio: 0.28
      }
    },
    {
      campaignId: 'Q10-SP-001',
      campaignName: 'Qoo10 キーワード広告',
      mall: 'qoo10',
      campaignType: 'sp',
      status: 'enabled',
      budget: 2500,
      budgetUtilization: 0.78,
      currentPeriod: {
        adSpend: 58500,
        adRevenue: 292500,
        roas: 5.0,
        impressions: 117000,
        clicks: 3900,
        ctr: 0.0333,
        conversions: 585,
        conversionRate: 0.15,
        cpc: 15,
        newToExistingRatio: 0.50
      },
      previousPeriod: {
        adSpend: 50000,
        adRevenue: 225000,
        roas: 4.5,
        impressions: 100000,
        clicks: 3333,
        ctr: 0.0333,
        conversions: 500,
        conversionRate: 0.15,
        cpc: 15,
        newToExistingRatio: 0.48
      }
    }
  ];

  // ROAS変化量を計算
  return campaigns.map(c => {
    const roasChange = c.currentPeriod.roas - c.previousPeriod.roas;
    const roasChangeRate = c.previousPeriod.roas > 0
      ? roasChange / c.previousPeriod.roas
      : (c.currentPeriod.roas > 0 ? 1 : 0);
    return { ...c, roasChange, roasChangeRate };
  });
}

/**
 * キャンペーンパフォーマンスデータ取得
 * 
 * 本番実装では以下から取得:
 * - Amazon Ads MCP（SP/SD/SB/Display広告）
 * - 楽天RMS広告API（RPP/アフィリエイト）
 * - Yahoo!プロモーション広告API
 * - Qoo10広告API
 * 
 * @returns {Promise<CampaignPerformance[]>} キャンペーンパフォーマンスデータの配列
 * 
 * @example
 * ```typescript
 * const campaigns = await fetchCampaignPerformanceData();
 * const lowRoas = campaigns.filter(c => c.currentPeriod.roas < 2.0);
 * ```
 */
export async function fetchCampaignPerformanceData(): Promise<CampaignPerformance[]> {
  // TODO: 本番実装
  // - Amazon Ads MCP: searchCampaigns, getCampaignMetrics
  // - 楽天RMS: fetchRakutenAdsData
  // - Yahoo: fetchYahooAdsData
  return getMockCampaignData();
}

/**
 * 特定モールのキャンペーンデータ取得
 * 
 * @param {AdMall} mall - 対象モール
 * @returns {Promise<CampaignPerformance[]>} 該当モールのキャンペーンデータ
 * 
 * @example
 * ```typescript
 * const amazonCampaigns = await fetchCampaignsByMall('amazon');
 * ```
 */
export async function fetchCampaignsByMall(mall: AdMall): Promise<CampaignPerformance[]> {
  const all = await fetchCampaignPerformanceData();
  return all.filter(c => c.mall === mall);
}

/**
 * ROAS低下キャンペーン検出
 * 
 * @param {CampaignPerformance[]} campaigns - キャンペーンデータ
 * @param {number} threshold - ROAS低下閾値（デフォルト: -0.2 = 20%低下）
 * @returns {CampaignPerformance[]} ROASが閾値を超えて低下したキャンペーン
 * 
 * @example
 * ```typescript
 * const campaigns = await fetchCampaignPerformanceData();
 * const declined = detectRoisDecline(campaigns, -0.2);
 * ```
 */
export function detectRoasDecline(
  campaigns: CampaignPerformance[],
  threshold: number = -0.2
): CampaignPerformance[] {
  return campaigns.filter(c => {
    // 現在期間に広告費があるもののみ対象
    if (c.currentPeriod.adSpend <= 0) return false;
    // 前期間にROASがあるもののみ対象
    if (c.previousPeriod.roas <= 0) return false;
    // 閾値より低下している
    return c.roasChangeRate <= threshold;
  });
}

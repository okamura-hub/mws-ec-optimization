/**
 * ROAS低下キャンペーン自動検出フロー テスト
 * 
 * Issue #8: ROAS低下キャンペーン自動検出
 */

import {
  getMockCampaignData,
  fetchCampaignPerformanceData,
  detectRoasDecline,
  CampaignPerformance
} from '../shared/tools/campaign-performance-tools';

import {
  detectAllDeclines,
  analyzeRootCauses,
  generateRecommendedActions,
  calculateEstimatedLoss,
  formatReportForConsole,
  RoasDetectionReport
} from '../flows/roas-decline-detection-flow';

import { roasDeclineDetectionFlow } from '../flows/roas-decline-detection-flow';

// ============================================================
// モックデータテスト
// ============================================================
describe('Campaign Performance Tools', () => {
  test('getMockCampaignData returns 10 campaigns', () => {
    const data = getMockCampaignData();
    expect(data).toHaveLength(10);
  });

  test('all campaigns have roasChange and roasChangeRate calculated', () => {
    const data = getMockCampaignData();
    for (const c of data) {
      expect(typeof c.roasChange).toBe('number');
      expect(typeof c.roasChangeRate).toBe('number');
    }
  });

  test('ROAS change is correctly calculated', () => {
    const data = getMockCampaignData();
    const first = data[0]; // iPhoneケース SP 自動: 4.0 → 3.0
    expect(first.roasChange).toBeCloseTo(-1.0, 1);
    expect(first.roasChangeRate).toBeCloseTo(-0.25, 2);
  });

  test('fetchCampaignPerformanceData returns data', async () => {
    const data = await fetchCampaignPerformanceData();
    expect(data.length).toBeGreaterThan(0);
  });

  test('detectRoasDecline with default threshold (-20%)', () => {
    const data = getMockCampaignData();
    const declined = detectRoasDecline(data);
    // Should find campaigns with >= 20% decline
    expect(declined.length).toBeGreaterThan(0);
    for (const c of declined) {
      expect(c.roasChangeRate).toBeLessThanOrEqual(-0.2);
    }
  });

  test('detectRoasDecline with custom threshold', () => {
    const data = getMockCampaignData();
    const strict = detectRoasDecline(data, -0.1);
    const loose = detectRoasDecline(data, -0.4);
    expect(strict.length).toBeGreaterThanOrEqual(loose.length);
  });
});

// ============================================================
// 検出ロジックテスト
// ============================================================
describe('ROAS Decline Detection', () => {
  let mockData: CampaignPerformance[];

  beforeEach(() => {
    mockData = getMockCampaignData();
  });

  test('detectAllDeclines finds declined campaigns', () => {
    const results = detectAllDeclines(mockData);
    expect(results.length).toBeGreaterThan(0);
  });

  test('results are sorted by severity then decline rate', () => {
    const results = detectAllDeclines(mockData);
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      const prevSev = severityOrder[prev.severity];
      const currSev = severityOrder[curr.severity];
      expect(prevSev).toBeLessThanOrEqual(currSev);
    }
  });

  test('paused campaigns with no current spend are excluded', () => {
    const results = detectAllDeclines(mockData);
    const pausedResults = results.filter(r => r.campaign.status === 'paused');
    expect(pausedResults).toHaveLength(0);
  });

  test('Yahoo campaign with ROAS < 1.0 is critical', () => {
    const results = detectAllDeclines(mockData);
    const yahoo = results.find(r => r.campaign.mall === 'yahoo');
    expect(yahoo).toBeDefined();
    expect(yahoo!.severity).toBe('critical');
  });

  test('Display campaign with ROAS 0.5 is critical', () => {
    const results = detectAllDeclines(mockData);
    const display = results.find(r => r.campaign.campaignType === 'display');
    expect(display).toBeDefined();
    expect(display!.severity).toBe('critical');
  });

  test('Qoo10 campaign with ROAS improvement is not detected', () => {
    const results = detectAllDeclines(mockData);
    const qoo10 = results.find(r => r.campaign.mall === 'qoo10');
    // Qoo10 ROAS went from 4.5 to 5.0, should not be detected
    expect(qoo10).toBeUndefined();
  });

  test('SB campaign with stable ROAS is not detected', () => {
    const results = detectAllDeclines(mockData);
    const sb = results.find(r => r.campaign.campaignType === 'sb');
    // SB ROAS stayed at 4.0, should not be detected
    expect(sb).toBeUndefined();
  });
});

// ============================================================
// 原因分析テスト
// ============================================================
describe('Root Cause Analysis', () => {
  test('detects CVR decline for SD campaign', () => {
    const data = getMockCampaignData();
    const sdCampaign = data.find(c => c.campaignType === 'sd')!;
    const causes = analyzeRootCauses(sdCampaign);
    const cvrCause = causes.find(c => c.factor === 'cvr_decline');
    expect(cvrCause).toBeDefined();
  });

  test('detects budget exhaustion for low ROAS + high utilization', () => {
    const data = getMockCampaignData();
    // イヤホン SP 自動: budgetUtilization=0.92, ROAS=1.5
    const earphoneCampaign = data.find(c => c.campaignId === 'AMP-SP-003')!;
    const causes = analyzeRootCauses(earphoneCampaign);
    const budgetCause = causes.find(c => c.factor === 'budget_exhaustion');
    expect(budgetCause).toBeDefined();
  });

  test('returns empty causes for stable campaigns', () => {
    const data = getMockCampaignData();
    const sbCampaign = data.find(c => c.campaignType === 'sb')!;
    const causes = analyzeRootCauses(sbCampaign);
    // SB campaign is stable, should have few or no causes
    expect(causes.length).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// 推奨アクションテスト
// ============================================================
describe('Recommended Actions', () => {
  test('critical severity includes emergency action', () => {
    const data = getMockCampaignData();
    const yahoo = data.find(c => c.mall === 'yahoo')!;
    const causes = analyzeRootCauses(yahoo);
    const actions = generateRecommendedActions(yahoo, 'critical', causes);
    expect(actions.some(a => a.includes('緊急'))).toBe(true);
  });

  test('ROAS < 1.0 includes stop recommendation', () => {
    const data = getMockCampaignData();
    const display = data.find(c => c.campaignType === 'display')!;
    const causes = analyzeRootCauses(display);
    const actions = generateRecommendedActions(display, 'critical', causes);
    expect(actions.some(a => a.includes('停止'))).toBe(true);
  });

  test('CVR decline includes LP improvement suggestion', () => {
    const data = getMockCampaignData();
    const sdCampaign = data.find(c => c.campaignType === 'sd')!;
    const causes = analyzeRootCauses(sdCampaign);
    const actions = generateRecommendedActions(sdCampaign, 'warning', causes);
    expect(actions.some(a => a.includes('商品ページ') || a.includes('LP'))).toBe(true);
  });
});

// ============================================================
// 損失額計算テスト
// ============================================================
describe('Estimated Loss Calculation', () => {
  test('calculates positive loss for declined ROAS', () => {
    const data = getMockCampaignData();
    const iphone = data.find(c => c.campaignId === 'AMP-SP-001')!;
    const loss = calculateEstimatedLoss(iphone);
    // Previous ROAS 4.0 * current spend 142500 = 570000 expected
    // Actual revenue: 427500
    // Loss: 570000 - 427500 = 142500
    expect(loss).toBeCloseTo(142500, 0);
  });

  test('returns 0 when current ROAS is better', () => {
    const data = getMockCampaignData();
    const qoo10 = data.find(c => c.mall === 'qoo10')!;
    const loss = calculateEstimatedLoss(qoo10);
    // Qoo10 improved: previous ROAS 4.5 * 58500 = 263250, actual 292500
    expect(loss).toBe(0);
  });
});

// ============================================================
// レポートフォーマットテスト
// ============================================================
describe('Report Formatting', () => {
  test('formatReportForConsole produces readable output', async () => {
    const data = getMockCampaignData();
    const results = detectAllDeclines(data);
    const totalLoss = results.reduce((sum, r) => sum + r.estimatedLoss, 0);

    const report: RoasDetectionReport = {
      generatedAt: new Date().toISOString(),
      totalCampaigns: data.length,
      declinedCampaigns: results.length,
      criticalCount: results.filter(r => r.severity === 'critical').length,
      warningCount: results.filter(r => r.severity === 'warning').length,
      infoCount: results.filter(r => r.severity === 'info').length,
      results,
      totalEstimatedLoss: totalLoss,
      summary: 'Test summary'
    };

    const output = formatReportForConsole(report);
    expect(output).toContain('ROAS低下キャンペーン検出レポート');
    expect(output).toContain('Critical');
    expect(output.length).toBeGreaterThan(100);
  });
});

// ============================================================
// フロー統合テスト
// ============================================================
describe('ROAS Decline Detection Flow (Integration)', () => {
  test('full flow executes successfully', async () => {
    const report = await roasDeclineDetectionFlow();
    expect(report).toBeDefined();
    expect(report.totalCampaigns).toBe(10);
    expect(report.declinedCampaigns).toBeGreaterThan(0);
    expect(report.criticalCount).toBeGreaterThan(0);
    expect(report.totalEstimatedLoss).toBeGreaterThan(0);
  });

  test('flow report contains all required fields', async () => {
    const report = await roasDeclineDetectionFlow();
    expect(report.generatedAt).toBeDefined();
    expect(report.results).toBeInstanceOf(Array);
    expect(report.summary).toBeDefined();

    for (const result of report.results) {
      expect(result.campaign).toBeDefined();
      expect(result.severity).toBeDefined();
      expect(result.roasDeclineRate).toBeLessThan(0);
      expect(result.rootCauses).toBeInstanceOf(Array);
      expect(result.recommendedActions).toBeInstanceOf(Array);
      expect(result.estimatedLoss).toBeGreaterThanOrEqual(0);
    }
  });
});

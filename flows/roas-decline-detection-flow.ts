/**
 * ROAS低下キャンペーン自動検出フロー
 * 
 * 概要:
 * - 全広告キャンペーンのROASを前期間と比較
 * - 低下率に基づいて深刻度を判定
 * - 原因分析（CTR低下/CV率低下/CPC上昇/予算超過）
 * - 推奨アクションを生成
 * - Slack通知
 * 
 * Issue #8: ROAS低下キャンペーン自動検出
 * 担当: Ryoji Murakami（広告最適化）
 * KPI: ROAS維持率、広告費効率、低ROASキャンペーン検出数
 * 
 * 検出ルール:
 * - 🔴 CRITICAL: ROAS 40%以上低下 OR ROAS < 1.0（赤字）
 * - 🟡 WARNING: ROAS 20%以上低下
 * - 🔵 INFO: ROAS 10%以上低下（監視レベル）
 */

import {
  fetchCampaignPerformanceData,
  CampaignPerformance
} from '../shared/tools/campaign-performance-tools';
import { sendAnomalyAlert } from '../shared/tools/slack-tools';

// 深刻度
type Severity = 'critical' | 'warning' | 'info';

// ROAS低下検出結果
export interface RoasDeclineResult {
  campaign: CampaignPerformance;
  severity: Severity;
  roasDeclineRate: number;       // ROAS低下率（負の値）
  roasDeclineAbsolute: number;   // ROAS絶対変化
  rootCauses: RootCause[];       // 原因分析
  recommendedActions: string[];  // 推奨アクション
  estimatedLoss: number;         // 推定損失額（円）
}

// 原因分析
export interface RootCause {
  factor: 'ctr_decline' | 'cvr_decline' | 'cpc_increase' | 'budget_exhaustion' | 'impression_decline' | 'new_too_high';
  label: string;
  currentValue: number;
  previousValue: number;
  changeRate: number;
  impact: 'high' | 'medium' | 'low';
}

// ROAS検出レポート
export interface RoasDetectionReport {
  generatedAt: string;
  totalCampaigns: number;
  declinedCampaigns: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  results: RoasDeclineResult[];
  totalEstimatedLoss: number;
  summary: string;
}

// 検出閾値
const THRESHOLDS = {
  critical: -0.4,  // 40%以上低下
  warning: -0.2,   // 20%以上低下
  info: -0.1,      // 10%以上低下
  roasBelowOne: 1.0 // ROAS < 1.0 で赤字
};

// 原因分析の閾値
const CAUSE_THRESHOLDS = {
  ctrDecline: -0.15,      // CTR 15%以上低下
  cvrDecline: -0.15,      // CV率 15%以上低下
  cpcIncrease: 0.20,      // CPC 20%以上上昇
  impressionDecline: -0.20, // インプレッション 20%以上低下
  newToExistingHigh: 0.7   // 新規比率 70%以上
};

/**
 * メインフロー
 */
export async function roasDeclineDetectionFlow(): Promise<RoasDetectionReport> {
  console.log('[roas-detection] ROAS低下検出フロー開始');

  try {
    // 1. キャンペーンデータ取得
    console.log('[roas-detection] キャンペーンデータ取得中...');
    const campaigns = await fetchCampaignPerformanceData();
    console.log(`[roas-detection] ${campaigns.length}件のキャンペーンを取得`);

    // 2. ROAS低下キャンペーン検出
    console.log('[roas-detection] ROAS低下検出中...');
    const results = detectAllDeclines(campaigns);
    console.log(`[roas-detection] ${results.length}件のROAS低下を検出`);

    // 3. レポート生成
    const report = generateReport(campaigns, results);

    // 4. Slack通知（重要度高のみ）
    const criticalResults = results.filter(r => r.severity === 'critical');
    if (criticalResults.length > 0) {
      console.log('[roas-detection] 重要アラート送信...');
      await sendRoasAlert(report);
    }

    console.log('[roas-detection] ROAS低下検出フロー完了');
    return report;

  } catch (error) {
    console.error('[roas-detection] エラー発生:', error);
    throw error;
  }
}

/**
 * 全キャンペーンのROAS低下を検出
 */
export function detectAllDeclines(campaigns: CampaignPerformance[]): RoasDeclineResult[] {
  const results: RoasDeclineResult[] = [];

  for (const campaign of campaigns) {
    // 現在期間に広告費がない場合はスキップ
    if (campaign.currentPeriod.adSpend <= 0) continue;
    // 前期間のROASがない場合はスキップ
    if (campaign.previousPeriod.roas <= 0) continue;

    const roasDeclineRate = campaign.roasChangeRate;

    // ROAS < 1.0（赤字）は常にcritical
    const isBelowOne = campaign.currentPeriod.roas < THRESHOLDS.roasBelowOne;

    // 閾値判定
    let severity: Severity | null = null;
    if (isBelowOne || roasDeclineRate <= THRESHOLDS.critical) {
      severity = 'critical';
    } else if (roasDeclineRate <= THRESHOLDS.warning) {
      severity = 'warning';
    } else if (roasDeclineRate <= THRESHOLDS.info) {
      severity = 'info';
    }

    if (severity === null) continue;

    // 原因分析
    const rootCauses = analyzeRootCauses(campaign);

    // 推奨アクション生成
    const recommendedActions = generateRecommendedActions(campaign, severity, rootCauses);

    // 推定損失額計算
    const estimatedLoss = calculateEstimatedLoss(campaign);

    results.push({
      campaign,
      severity,
      roasDeclineRate,
      roasDeclineAbsolute: campaign.roasChange,
      rootCauses,
      recommendedActions,
      estimatedLoss
    });
  }

  // 深刻度 → 低下率の順でソート
  const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  results.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.roasDeclineRate - b.roasDeclineRate;
  });

  return results;
}

/**
 * 原因分析
 */
export function analyzeRootCauses(campaign: CampaignPerformance): RootCause[] {
  const causes: RootCause[] = [];
  const curr = campaign.currentPeriod;
  const prev = campaign.previousPeriod;

  // CTR低下
  if (prev.ctr > 0) {
    const ctrChange = (curr.ctr - prev.ctr) / prev.ctr;
    if (ctrChange <= CAUSE_THRESHOLDS.ctrDecline) {
      causes.push({
        factor: 'ctr_decline',
        label: 'CTR（クリックスルー率）低下',
        currentValue: curr.ctr,
        previousValue: prev.ctr,
        changeRate: ctrChange,
        impact: Math.abs(ctrChange) > 0.3 ? 'high' : Math.abs(ctrChange) > 0.2 ? 'medium' : 'low'
      });
    }
  }

  // CV率低下
  if (prev.conversionRate > 0) {
    const cvrChange = (curr.conversionRate - prev.conversionRate) / prev.conversionRate;
    if (cvrChange <= CAUSE_THRESHOLDS.cvrDecline) {
      causes.push({
        factor: 'cvr_decline',
        label: 'CV率（コンバージョン率）低下',
        currentValue: curr.conversionRate,
        previousValue: prev.conversionRate,
        changeRate: cvrChange,
        impact: Math.abs(cvrChange) > 0.3 ? 'high' : Math.abs(cvrChange) > 0.2 ? 'medium' : 'low'
      });
    }
  }

  // CPC上昇
  if (prev.cpc > 0) {
    const cpcChange = (curr.cpc - prev.cpc) / prev.cpc;
    if (cpcChange >= CAUSE_THRESHOLDS.cpcIncrease) {
      causes.push({
        factor: 'cpc_increase',
        label: 'CPC（クリック単価）上昇',
        currentValue: curr.cpc,
        previousValue: prev.cpc,
        changeRate: cpcChange,
        impact: cpcChange > 0.5 ? 'high' : cpcChange > 0.3 ? 'medium' : 'low'
      });
    }
  }

  // インプレッション低下
  if (prev.impressions > 0) {
    const impChange = (curr.impressions - prev.impressions) / prev.impressions;
    if (impChange <= CAUSE_THRESHOLDS.impressionDecline) {
      causes.push({
        factor: 'impression_decline',
        label: 'インプレッション減少',
        currentValue: curr.impressions,
        previousValue: prev.impressions,
        changeRate: impChange,
        impact: Math.abs(impChange) > 0.4 ? 'high' : 'medium'
      });
    }
  }

  // 新規比率が高すぎる（既存顧客へのリーチ不足）
  if (curr.newToExistingRatio >= CAUSE_THRESHOLDS.newToExistingHigh) {
    causes.push({
      factor: 'new_too_high',
      label: '新規顧客比率が高すぎ',
      currentValue: curr.newToExistingRatio,
      previousValue: prev.newToExistingRatio,
      changeRate: prev.newToExistingRatio > 0
        ? (curr.newToExistingRatio - prev.newToExistingRatio) / prev.newToExistingRatio
        : 0,
      impact: 'medium'
    });
  }

  // 予算超過（予算消化率が高いのにROASが低い）
  if (campaign.budgetUtilization > 0.9 && campaign.currentPeriod.roas < 2.0) {
    causes.push({
      factor: 'budget_exhaustion',
      label: '予算消化率が高い割にROASが低い',
      currentValue: campaign.budgetUtilization,
      previousValue: campaign.previousPeriod.roas > 0 ? campaign.budgetUtilization : 0,
      changeRate: 0,
      impact: 'high'
    });
  }

  // 影響度でソート
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  causes.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return causes;
}

/**
 * 推奨アクション生成
 */
export function generateRecommendedActions(
  campaign: CampaignPerformance,
  severity: Severity,
  rootCauses: RootCause[]
): string[] {
  const actions: string[] = [];

  // 深刻度別の基本アクション
  if (severity === 'critical') {
    actions.push('🔴 緊急: キャンペーンの一時停止または大幅な入札調整を検討');
  }

  // 原因別のアクション
  for (const cause of rootCauses) {
    switch (cause.factor) {
      case 'ctr_decline':
        actions.push('広告クリエイティブの見直し（メイン画像・タイトル変更）');
        actions.push('ターゲットキーワードの関連性確認');
        break;
      case 'cvr_decline':
        actions.push('商品ページ（LP）の改善確認（価格・レビュー・画像）');
        actions.push('在庫切れ・配送遅延の有無を確認');
        break;
      case 'cpc_increase':
        actions.push('入札価格の引き下げ（目標ROASに基づく上限設定）');
        actions.push('競合状況の確認と長尾キーワードへの移行');
        break;
      case 'impression_decline':
        actions.push('キーワード追加・マッチタイプの拡張');
        actions.push('予算増額の検討（ROAS改善後に実施）');
        break;
      case 'new_too_high':
        actions.push('スポンサーブランドディスプレイで既存顧客へのリーチ強化');
        actions.push('SDオーディエンスでリピーターターゲットを設定');
        break;
      case 'budget_exhaustion':
        actions.push('予算増額前にROAS改善を優先（低パフォーマンスキーワードの停止）');
        break;
    }
  }

  // ROAS < 1.0 の場合
  if (campaign.currentPeriod.roas < 1.0) {
    actions.push('⚠️ 広告費が売上を上回っています。即座に停止または大幅縮小を推奨');
  }

  return actions;
}

/**
 * 推定損失額計算
 * (前期間ROAS × 当期広告費) - 当期広告売上 = 損失額
 */
export function calculateEstimatedLoss(campaign: CampaignPerformance): number {
  const expectedRevenue = campaign.previousPeriod.roas * campaign.currentPeriod.adSpend;
  const actualRevenue = campaign.currentPeriod.adRevenue;
  return Math.max(0, expectedRevenue - actualRevenue);
}

/**
 * レポート生成
 */
function generateReport(
  campaigns: CampaignPerformance[],
  results: RoasDeclineResult[]
): RoasDetectionReport {
  const criticalCount = results.filter(r => r.severity === 'critical').length;
  const warningCount = results.filter(r => r.severity === 'warning').length;
  const infoCount = results.filter(r => r.severity === 'info').length;
  const totalEstimatedLoss = results.reduce((sum, r) => sum + r.estimatedLoss, 0);

  const summary = generateSummary(results, totalEstimatedLoss);

  return {
    generatedAt: new Date().toISOString(),
    totalCampaigns: campaigns.length,
    declinedCampaigns: results.length,
    criticalCount,
    warningCount,
    infoCount,
    results,
    totalEstimatedLoss,
    summary
  };
}

/**
 * サマリー生成
 */
function generateSummary(results: RoasDeclineResult[], totalLoss: number): string {
  if (results.length === 0) {
    return '✅ ROAS低下キャンペーンは検出されませんでした。';
  }

  const critical = results.filter(r => r.severity === 'critical');
  const parts: string[] = [];

  parts.push(`📊 ROAS低下キャンペーン検出レポート`);
  parts.push(`${results.length}件のキャンペーンでROAS低下を検出`);

  if (critical.length > 0) {
    parts.push(`🔴 緊急対応必要: ${critical.length}件`);
    critical.slice(0, 3).forEach(r => {
      parts.push(`  - ${r.campaign.campaignName}: ROAS ${r.campaign.previousPeriod.roas.toFixed(1)} → ${r.campaign.currentPeriod.roas.toFixed(1)} (${(r.roasDeclineRate * 100).toFixed(0)}%)`);
    });
  }

  parts.push(`💰 推定損失額: ¥${totalLoss.toLocaleString()}`);

  return parts.join('\n');
}

/**
 * Slack通知送信
 */
async function sendRoasAlert(report: RoasDetectionReport): Promise<void> {
  const alertData = report.results
    .filter(r => r.severity === 'critical' || r.severity === 'warning')
    .map(r => ({
      type: `roas_decline_${r.severity}` as string,
      campaign: r.campaign.campaignName,
      mall: r.campaign.mall,
      currentRoas: r.campaign.currentPeriod.roas,
      previousRoas: r.campaign.previousPeriod.roas,
      declineRate: `${(r.roasDeclineRate * 100).toFixed(1)}%`,
      estimatedLoss: r.estimatedLoss,
      rootCauses: r.rootCauses.map(c => c.label),
      actions: r.recommendedActions,
      severity: r.severity,
      message: `${r.campaign.campaignName}: ROAS ${r.campaign.previousPeriod.roas.toFixed(1)} → ${r.campaign.currentPeriod.roas.toFixed(1)} (${(r.roasDeclineRate * 100).toFixed(0)}%低下)`,
      currentValue: r.campaign.currentPeriod.roas,
      expectedValue: r.campaign.previousPeriod.roas
    }));

  await sendAnomalyAlert(alertData);
}

/**
 * レポートフォーマット（コンソール出力用）
 */
export function formatReportForConsole(report: RoasDetectionReport): string {
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('📊 ROAS低下キャンペーン検出レポート');
  lines.push(`生成日時: ${report.generatedAt}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`総キャンペーン数: ${report.totalCampaigns}`);
  lines.push(`ROAS低下検出: ${report.declinedCampaigns}件`);
  lines.push(`  🔴 Critical: ${report.criticalCount}件`);
  lines.push(`  🟡 Warning: ${report.warningCount}件`);
  lines.push(`  🔵 Info: ${report.infoCount}件`);
  lines.push(`💰 推定損失額: ¥${report.totalEstimatedLoss.toLocaleString()}`);
  lines.push('');

  for (const result of report.results) {
    const icon = result.severity === 'critical' ? '🔴' : result.severity === 'warning' ? '🟡' : '🔵';
    lines.push(`${icon} ${result.campaign.campaignName} (${result.campaign.mall}/${result.campaign.campaignType})`);
    lines.push(`   ROAS: ${result.campaign.previousPeriod.roas.toFixed(2)} → ${result.campaign.currentPeriod.roas.toFixed(2)} (${(result.roasDeclineRate * 100).toFixed(1)}%)`);
    lines.push(`   広告費: ¥${result.campaign.currentPeriod.adSpend.toLocaleString()} / 売上: ¥${result.campaign.currentPeriod.adRevenue.toLocaleString()}`);
    lines.push(`   推定損失: ¥${result.estimatedLoss.toLocaleString()}`);

    if (result.rootCauses.length > 0) {
      lines.push('   原因:');
      result.rootCauses.forEach(cause => {
        lines.push(`     - ${cause.label} (${(cause.changeRate * 100).toFixed(1)}%)`);
      });
    }

    if (result.recommendedActions.length > 0) {
      lines.push('   推奨アクション:');
      result.recommendedActions.forEach(action => {
        lines.push(`     → ${action}`);
      });
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * CLI実行
 */
if (require.main === module) {
  roasDeclineDetectionFlow()
    .then(report => {
      console.log(formatReportForConsole(report));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

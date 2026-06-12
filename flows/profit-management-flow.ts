/**
 * 利益管理フロー
 * 
 * 概要:
 * - 毎月1日9:00に前月データを分析
 * - 商品別・モール別の利益率を計算
 * - 原価未登録商品を検出
 * - 異常値をアラート
 * 
 * 担当: Ryoji Murakami（利益責任）
 * KPI: 営業利益率、原価登録率、入力精度
 */

import { fetchProfitData, ProfitData, UnregisteredCostItem } from '../shared/tools/profit-tools';
import { sendProfitReport, ProfitReport } from '../shared/tools/slack-tools';

// 利益レポート
interface ProfitAnalysis {
  period: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  byProduct: ProductProfit[];
  byMall: MallProfit[];
  unregisteredItems: UnregisteredCostItem[];
  anomalies: ProfitAnomaly[];
}

// 商品別利益
interface ProductProfit {
  sku: string;
  productName: string;
  sales: number;
  cost: number;
  profit: number;
  profitMargin: number;
  mall: string;
}

// モール別利益
interface MallProfit {
  mall: string;
  sales: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

// 異常値
interface ProfitAnomaly {
  type: 'low_margin' | 'negative_profit' | 'cost_mismatch';
  sku?: string;
  mall?: string;
  currentValue: number;
  expectedValue: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

/**
 * メインフロー
 */
export async function profitManagementFlow(): Promise<void> {
  console.log('[profit-management] 利益管理フロー開始');
  
  try {
    // 1. 前月データ取得
    console.log('[profit-management] 前月データ取得中...');
    const profitData = await fetchProfitData();
    console.log(`[profit-management] ${profitData.length}件のデータを取得`);
    
    // 2. 利益計算・分析
    console.log('[profit-management] 利益分析中...');
    const analysis = analyzeProfit(profitData);
    console.log(`[profit-management] 利益率: ${(analysis.profitMargin * 100).toFixed(2)}%`);
    
    // 3. 異常値検出
    console.log('[profit-management] 異常値検出中...');
    const anomalies = detectAnomalies(analysis);
    console.log(`[profit-management] ${anomalies.length}件の異常値を検出`);
    
    // 4. レポート生成
    console.log('[profit-management] レポート生成中...');
    const report = generateReport(analysis, anomalies);
    
    // 5. Slack通知
    console.log('[profit-management] Slack通知送信中...');
    await sendProfitReport(report);
    console.log('[profit-management] Slack通知送信完了');
    
    console.log('[profit-management] 利益管理フロー完了');
    
  } catch (error) {
    console.error('[profit-management] エラー発生:', error);
    throw error;
  }
}

/**
 * 利益分析
 */
function analyzeProfit(data: ProfitData[]): ProfitAnalysis {
  const period = getPreviousMonth();
  
  // 合計計算（総コスト = 原価 + 配送費 + 広告費 + 手数料）
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const totalCost = data.reduce((sum, item) => sum + (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee, 0);
  const totalProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? totalProfit / totalSales : 0;
  
  // 商品別集計
  const byProduct = aggregateByProduct(data);
  
  // モール別集計
  const byMall = aggregateByMall(data);
  
  // 原価未登録商品
  const unregisteredItems = data
    .filter(item => item.cost === 0 || item.cost === null)
    .map(item => ({
      sku: item.sku,
      productName: item.productName,
      sales: item.sales,
      mall: item.mall
    }));
  
  // 異常値（仮）
  const anomalies: ProfitAnomaly[] = [];  
  return {
    period,
    totalSales,
    totalCost,
    totalProfit,
    profitMargin,
    byProduct,
    byMall,
    unregisteredItems,
    anomalies
  };
}

/**
 * 商品別集計
 */
function aggregateByProduct(data: ProfitData[]): ProductProfit[] {
  const map = new Map<string, ProductProfit>();
  
  for (const item of data) {
    const key = item.sku;
    const existing = map.get(key);
    const itemTotalCost = (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee;
    
    if (existing) {
      existing.sales += item.sales;
      existing.cost += itemTotalCost;
      existing.profit = existing.sales - existing.cost;
      existing.profitMargin = existing.sales > 0 ? existing.profit / existing.sales : 0;
    } else {
      map.set(key, {
        sku: item.sku,
        productName: item.productName,
        sales: item.sales,
        cost: itemTotalCost,
        profit: item.sales - itemTotalCost,
        profitMargin: item.sales > 0 ? (item.sales - itemTotalCost) / item.sales : 0,
        mall: item.mall
      });
    }
  }
  
  // 利益率の低い順にソート
  return Array.from(map.values()).sort((a, b) => a.profitMargin - b.profitMargin);
}

/**
 * モール別集計
 */
function aggregateByMall(data: ProfitData[]): MallProfit[] {
  const map = new Map<string, MallProfit>();
  
  for (const item of data) {
    const key = item.mall;
    const existing = map.get(key);
    const itemTotalCost = (item.cost ?? 0) + item.shippingCost + item.adCost + item.fee;
    
    if (existing) {
      existing.sales += item.sales;
      existing.cost += itemTotalCost;
      existing.profit = existing.sales - existing.cost;
      existing.profitMargin = existing.sales > 0 ? existing.profit / existing.sales : 0;
    } else {
      map.set(key, {
        mall: item.mall,
        sales: item.sales,
        cost: itemTotalCost,
        profit: item.sales - itemTotalCost,
        profitMargin: item.sales > 0 ? (item.sales - itemTotalCost) / item.sales : 0
      });
    }
  }
  
  return Array.from(map.values());
}

/**
 * 異常値検出
 */
function detectAnomalies(analysis: ProfitAnalysis): ProfitAnomaly[] {
  const anomalies: ProfitAnomaly[] = [];
  
  // 利益率10%未満の商品
  for (const product of analysis.byProduct) {
    if (product.profitMargin < 0.1 && product.sales > 0) {
      anomalies.push({
        type: 'low_margin',
        sku: product.sku,
        currentValue: product.profitMargin,
        expectedValue: 0.1,
        severity: product.profitMargin < 0 ? 'high' : 'medium',
        message: `${product.productName}の利益率が${(product.profitMargin * 100).toFixed(2)}%で低いです`
      });
    }
  }
  
  // 原価未登録商品
  if (analysis.unregisteredItems.length > 0) {
    anomalies.push({
      type: 'cost_mismatch',
      currentValue: analysis.unregisteredItems.length,
      expectedValue: 0,
      severity: 'high',
      message: `${analysis.unregisteredItems.length}件の原価未登録商品があります`
    });
  }
  
  return anomalies;
}

/**
 * レポート生成
 */
function generateReport(analysis: ProfitAnalysis, anomalies: ProfitAnomaly[]): ProfitReport {
  return {
    period: analysis.period,
    summary: {
      totalSales: analysis.totalSales,
      totalProfit: analysis.totalProfit,
      profitMargin: analysis.profitMargin,
      unregisteredCount: analysis.unregisteredItems.length,
      anomalyCount: anomalies.length
    },
    topLowMarginProducts: analysis.byProduct.slice(0, 10),
    byMall: analysis.byMall,
    anomalies,
    recommendations: generateRecommendations(analysis, anomalies)
  };
}

/**
 * 推奨アクション生成
 */
function generateRecommendations(analysis: ProfitAnalysis, anomalies: ProfitAnomaly[]): string[] {
  const recommendations: string[] = [];
  
  // 原価未登録商品
  if (analysis.unregisteredItems.length > 0) {
    recommendations.push(`原価未登録商品${analysis.unregisteredItems.length}件の原価を登録してください`);
  }
  
  // 低利益率商品
  const lowMarginProducts = analysis.byProduct.filter(p => p.profitMargin < 0.1 && p.sales > 100000);
  if (lowMarginProducts.length > 0) {
    recommendations.push(`高売上・低利益率商品${lowMarginProducts.length}件の価格調整を検討してください`);
  }
  
  // 異常値
  const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
  if (highSeverityAnomalies.length > 0) {
    recommendations.push(`重要度の高い異常値${highSeverityAnomalies.length}件を確認してください`);
  }
  
  return recommendations;
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
 * CLI実行
 */
if (require.main === module) {
  profitManagementFlow()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

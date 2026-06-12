/**
 * 在庫アラートフロー
 * 
 * 概要:
 * - 毎朝8:00に在庫データを分析
 * - 在庫切れ注意（14日分以下）を検出
 * - 滞留在庫（90日以上）を検出
 * - Slackに通知
 * 
 * 担当: 森山涼子（物流責任）
 * KPI: 在庫回転率、滞留在庫金額、廃棄ロス
 */

import { fetchInventoryData, InventoryData } from '../shared/tools/inventory-tools';
import { sendSlackNotification, InventoryAlert } from '../shared/tools/slack-tools';

// アラートレベル
type AlertLevel = 'critical' | 'warning' | 'info';

// アラート情報
interface InventoryAlertInfo {
  sku: string;
  productName: string;
  currentStock: number;
  daysOfStock: number;
  alertLevel: AlertLevel;
  recommendedAction: string;
  mall: string;
}

/**
 * メインフロー
 */
export async function inventoryAlertFlow(): Promise<void> {
  console.log('[inventory-alert] 在庫アラートフロー開始');
  
  try {
    // 1. 在庫データ取得
    console.log('[inventory-alert] 在庫データ取得中...');
    const inventoryData = await fetchInventoryData();
    console.log(`[inventory-alert] ${inventoryData.length}件の在庫データを取得`);
    
    // 2. 在庫分析
    console.log('[inventory-alert] 在庫分析中...');
    const alerts = analyzeInventory(inventoryData);
    console.log(`[inventory-alert] ${alerts.length}件のアラートを検出`);
    
    // 3. Slack通知
    if (alerts.length > 0) {
      console.log('[inventory-alert] Slack通知送信中...');
      await sendSlackNotification(alerts);
      console.log('[inventory-alert] Slack通知送信完了');
    } else {
      console.log('[inventory-alert] アラートなし');
    }
    
    console.log('[inventory-alert] 在庫アラートフロー完了');
    
  } catch (error) {
    console.error('[inventory-alert] エラー発生:', error);
    throw error;
  }
}

/**
 * 在庫分析
 */
function analyzeInventory(data: InventoryData[]): InventoryAlertInfo[] {
  const alerts: InventoryAlertInfo[] = [];
  
  for (const item of data) {
    const daysOfStock = calculateDaysOfStock(item);
    
    // 在庫切れ注意（14日分以下）
    if (daysOfStock <= 7) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock,
        alertLevel: 'critical',
        recommendedAction: '緊急発注または広告停止',
        mall: item.mall
      });
    } else if (daysOfStock <= 14) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock,
        alertLevel: 'warning',
        recommendedAction: '発注検討',
        mall: item.mall
      });
    }
    
    // 滞留在庫（90日以上）
    if (item.daysSinceLastSale >= 90) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock: Infinity,
        alertLevel: 'info',
        recommendedAction: '廃棄またはセール検討',
        mall: item.mall
      });
    }
    
    // 過剰在庫（180日分以上）
    if (daysOfStock >= 180) {
      alerts.push({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.quantity,
        daysOfStock,
        alertLevel: 'info',
        recommendedAction: '広告強化またはセール検討',
        mall: item.mall
      });
    }
  }
  
  // アラートレベルでソート（critical > warning > info）
  alerts.sort((a, b) => {
    const levelOrder: Record<AlertLevel, number> = {
      critical: 0,
      warning: 1,
      info: 2
    };
    return levelOrder[a.alertLevel] - levelOrder[b.alertLevel];
  });
  
  return alerts;
}

/**
 * 在庫日数計算
 */
function calculateDaysOfStock(item: InventoryData): number {
  if (item.averageDailySales === 0) {
    return Infinity;
  }
  return Math.floor(item.quantity / item.averageDailySales);
}

/**
 * CLI実行
 */
if (require.main === module) {
  inventoryAlertFlow()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

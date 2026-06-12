/**
 * Slack通知ツール
 * 
 * 概要:
 * - 在庫アラート通知
 * - 利益レポート通知
 * - 異常値アラート通知
 * 
 * 注意:
 * - Hermes AgentのSlack設定を共有
 * - 機密情報は投稿しない
 */

// アラートレベル
type AlertLevel = 'critical' | 'warning' | 'info';

// アラート情報
export interface InventoryAlert {
  sku: string;
  productName: string;
  currentStock: number;
  daysOfStock: number;
  alertLevel: AlertLevel;
  recommendedAction: string;
  mall: string;
}

// 利益レポート
export interface ProfitReport {
  period: string;
  summary: {
    totalSales: number;
    totalProfit: number;
    profitMargin: number;
    unregisteredCount: number;
    anomalyCount: number;
  };
  topLowMarginProducts: any[];
  byMall: any[];
  anomalies: any[];
  recommendations: string[];
}

/**
 * Slack通知送信
 * 
 * Hermes AgentのSlack設定を使用
 */
export async function sendSlackNotification(alerts: InventoryAlert[]): Promise<void> {
  // TODO: 本番実装
  // - Hermes AgentのSlack API経由で送信
  // - Slack Bot Tokenを使用
  // - Socket Mode接続
  
  // モック実装（コンソール出力）
  console.log('[slack-notification] Slack通知送信（モック）');
  
  const message = formatAlertMessage(alerts);
  console.log(message);
  
  // 本番実装例:
  // const { WebClient } = require('@slack/web-api');
  // const web = new WebClient(process.env.SLACK_BOT_TOKEN);
  // await web.chat.postMessage({
  //   channel: 'C0AAZ7UAMMM',
  //   text: message,
  //   blocks: formatAlertBlocks(alerts)
  // });
}

/**
 * アラートメッセージ整形
 */
function formatAlertMessage(alerts: InventoryAlert[]): string {
  const critical = alerts.filter(a => a.alertLevel === 'critical');
  const warning = alerts.filter(a => a.alertLevel === 'warning');
  const info = alerts.filter(a => a.alertLevel === 'info');
  
  let message = '📦 在庫アラートレポート\n\n';
  
  if (critical.length > 0) {
    message += '🔴 在庫切れ注意（緊急）\n';
    critical.forEach(alert => {
      message += `• ${alert.productName} (${alert.sku})\n`;
      message += `  在庫: ${alert.currentStock}個 / 残り${alert.daysOfStock}日分\n`;
      message += `  モール: ${alert.mall}\n`;
      message += `  推奨: ${alert.recommendedAction}\n\n`;
    });
  }
  
  if (warning.length > 0) {
    message += '🟡 在庫注意\n';
    warning.forEach(alert => {
      message += `• ${alert.productName} (${alert.sku})\n`;
      message += `  在庫: ${alert.currentStock}個 / 残り${alert.daysOfStock}日分\n`;
      message += `  モール: ${alert.mall}\n`;
      message += `  推奨: ${alert.recommendedAction}\n\n`;
    });
  }
  
  if (info.length > 0) {
    message += '🔵 滞留在庫・過剰在庫\n';
    info.forEach(alert => {
      message += `• ${alert.productName} (${alert.sku})\n`;
      if (alert.daysOfStock === Infinity) {
        message += `  在庫: ${alert.currentStock}個 / ${alert.daysOfStock}日分以上未販売\n`;
      } else {
        message += `  在庫: ${alert.currentStock}個 / 残り${alert.daysOfStock}日分\n`;
      }
      message += `  モール: ${alert.mall}\n`;
      message += `  推奨: ${alert.recommendedAction}\n\n`;
    });
  }
  
  message += '\n詳細はダッシュボードを確認してください。\n';
  message += '✅ 承認: 推奨アクションを実行\n';
  message += '❌ 却下: 何もしない\n';
  
  return message;
}

/**
 * Slack Block Kitフォーマット
 */
function formatAlertBlocks(alerts: InventoryAlert[]): any[] {
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📦 在庫アラートレポート'
      }
    },
    {
      type: 'divider'
    }
  ];
  
  const critical = alerts.filter(a => a.alertLevel === 'critical');
  const warning = alerts.filter(a => a.alertLevel === 'warning');
  const info = alerts.filter(a => a.alertLevel === 'info');
  
  if (critical.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔴 在庫切れ注意（緊急）: ${critical.length}件*`
      }
    });
    
    critical.slice(0, 5).forEach(alert => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.productName}*\n在庫: ${alert.currentStock}個 / 残り${alert.daysOfStock}日分\nモール: ${alert.mall}\n推奨: ${alert.recommendedAction}`
        }
      });
    });
    
    if (critical.length > 5) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `他 ${critical.length - 5}件...`
          }
        ]
      });
    }
  }
  
  if (warning.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🟡 在庫注意: ${warning.length}件*`
      }
    });
    
    warning.slice(0, 3).forEach(alert => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${alert.productName} (${alert.daysOfStock}日分)`
        }
      });
    });
  }
  
  if (info.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔵 滞留在庫・過剰在庫: ${info.length}件*`
      }
    });
  }
  
  blocks.push({
    type: 'divider'
  });
  
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✅ 承認して実行'
        },
        style: 'primary',
        action_id: 'approve_inventory_action'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '❌ 却下'
        },
        style: 'danger',
        action_id: 'reject_inventory_action'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '📊 ダッシュボード'
        },
        action_id: 'view_dashboard'
      }
    ]
  });
  
  return blocks;
}

/**
 * 日次レポート通知
 */
export async function sendDailyReport(report: any): Promise<void> {
  // TODO: 本番実装
  console.log('[slack-notification] 日次レポート通知（モック）');
  console.log(report);
}

/**
 * 利益レポート通知
 */
export async function sendProfitReport(report: ProfitReport): Promise<void> {
  // TODO: 本番実装
  console.log('[slack-notification] 利益レポート通知（モック）');
  
  const message = formatProfitReportMessage(report);
  console.log(message);
}

/**
 * 利益レポートメッセージ整形
 */
function formatProfitReportMessage(report: ProfitReport): string {
  let message = `💰 利益レポート ${report.period}\n\n`;
  
  message += `【サマリー】\n`;
  message += `売上: ¥${report.summary.totalSales.toLocaleString()}\n`;
  message += `利益: ¥${report.summary.totalProfit.toLocaleString()}\n`;
  message += `利益率: ${(report.summary.profitMargin * 100).toFixed(2)}%\n`;
  message += `原価未登録: ${report.summary.unregisteredCount}件\n`;
  message += `異常値: ${report.summary.anomalyCount}件\n\n`;
  
  if (report.topLowMarginProducts.length > 0) {
    message += `【低利益率商品 TOP5】\n`;
    report.topLowMarginProducts.slice(0, 5).forEach((product, index) => {
      message += `${index + 1}. ${product.productName}\n`;
      message += `   利益率: ${(product.profitMargin * 100).toFixed(2)}%\n`;
      message += `   売上: ¥${product.sales.toLocaleString()}\n\n`;
    });
  }
  
  if (report.anomalies.length > 0) {
    message += `【異常値】\n`;
    report.anomalies.forEach((anomaly, index) => {
      message += `${index + 1}. ${anomaly.message}\n`;
    });
    message += `\n`;
  }
  
  if (report.recommendations.length > 0) {
    message += `【推奨アクション】\n`;
    report.recommendations.forEach((rec, index) => {
      message += `${index + 1}. ${rec}\n`;
    });
  }
  
  return message;
}

/**
 * 異常値アラート通知
 */
export async function sendAnomalyAlert(anomalies: any[]): Promise<void> {
  // TODO: 本番実装
  console.log('[slack-notification] 異常値アラート通知（モック）');
  console.log(anomalies);
}

/**
 * Amazon商品名バリデーションフロー
 * 
 * 概要:
 * - 毎日10:00にAmazon商品名をチェック
 * - 75文字超過の商品名を検出
 * - 修正推奨メッセージをSlack通知
 * 
 * Issue: #7
 * 担当: 岡村研嗣（EC運営責任者）
 * KPI: 75文字超過商品数 0件
 * 
 * 背景（議事録 2026-06-12）:
 * - 岡村さんが毎週30分手動チェックしている
 * - Amazonの商品名を75文字以内に変更する方針
 * - AIエージェントで自動化し月2時間→5分に短縮
 */

import {
  fetchAmazonProducts,
  validateAllProductTitles,
  TitleValidationResult
} from '../shared/tools/amazon-catalog-tools';

// Amazon商品名の最大文字数
const AMAZON_TITLE_MAX_LENGTH = 75;

/**
 * メインフロー
 */
export async function titleValidationFlow(): Promise<TitleValidationReport> {
  console.log('[title-validation] 商品名バリデーションフロー開始');

  try {
    // 1. Amazon商品データ取得
    console.log('[title-validation] Amazon商品データ取得中...');
    const products = await fetchAmazonProducts();
    console.log(`[title-validation] ${products.length}件の商品データを取得`);

    // 2. バリデーション実行
    console.log('[title-validation] 商品名バリデーション実行中...');
    const results = validateAllProductTitles(products, AMAZON_TITLE_MAX_LENGTH);

    // 3. レポート生成
    const report = generateReport(results);
    console.log(`[title-validation] ${report.invalidCount}件の商品名が75文字を超過`);

    // 4. 結果出力
    printReport(report);

    console.log('[title-validation] 商品名バリデーションフロー完了');
    return report;

  } catch (error) {
    console.error('[title-validation] エラー発生:', error);
    throw error;
  }
}

// バリデーションレポート型
export interface TitleValidationReport {
  totalProducts: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  errorCount: number;
  invalidProducts: TitleValidationResult[];
  summary: string;
  timestamp: string;
}

/**
 * レポート生成
 */
function generateReport(results: TitleValidationResult[]): TitleValidationReport {
  const invalidProducts = results.filter(r => !r.isValid);
  const warningProducts = invalidProducts.filter(r => r.severity === 'warning');
  const errorProducts = invalidProducts.filter(r => r.severity === 'error');

  const validCount = results.length - invalidProducts.length;

  let summary: string;
  if (invalidProducts.length === 0) {
    summary = '✅ すべての商品名が75文字以内に収まっています';
  } else {
    summary = `⚠️ ${invalidProducts.length}件の商品名が75文字を超過しています。修正が必要です。`;
  }

  return {
    totalProducts: results.length,
    validCount,
    invalidCount: invalidProducts.length,
    warningCount: warningProducts.length,
    errorCount: errorProducts.length,
    invalidProducts,
    summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * レポート出力（コンソール）
 */
function printReport(report: TitleValidationReport): void {
  console.log('\n========================================');
  console.log('📝 Amazon商品名バリデーションレポート');
  console.log('========================================\n');

  console.log(`📊 サマリー:`);
  console.log(`  総商品数: ${report.totalProducts}件`);
  console.log(`  ✅ 適切: ${report.validCount}件`);
  console.log(`  ⚠️  超過: ${report.invalidCount}件`);
  console.log(`     - 警告（10文字以下超過）: ${report.warningCount}件`);
  console.log(`     - 要修正（11文字以上超過）: ${report.errorCount}件`);
  console.log('');

  if (report.invalidProducts.length > 0) {
    console.log('🔴 75文字超過商品:');
    console.log('---');

    // 超過文字数の降順でソート
    const sorted = [...report.invalidProducts].sort((a, b) => b.overBy - a.overBy);

    sorted.slice(0, 5).forEach((result) => {
      const icon = result.severity === 'error' ? '🔴' : '🟡';
      console.log(`${icon} [${result.productName.substring(0, 40)}...]`);
      console.log(`   ASIN: ${result.asin} / SKU: ${result.sku}`);
      console.log(`   文字数: ${result.titleLength}文字 (${result.overBy}文字超過)`);
      console.log(`   推奨: ${result.recommendation}`);
      console.log('');
    });
  }

  console.log('========================================');
  console.log(report.summary);
  console.log('========================================\n');
}

/**
 * Slack通知用メッセージ生成
 */
export function formatSlackMessage(report: TitleValidationReport): string {
  let message = '📝 Amazon商品名バリデーションレポート\n\n';

  message += `【結果】\n`;
  message += `総商品数: ${report.totalProducts}件\n`;
  message += `✅ 適切: ${report.validCount}件\n`;
  message += `⚠️  75文字超過: ${report.invalidCount}件\n\n`;

  if (report.invalidProducts.length > 0) {
    message += `【75文字超過商品】\n`;

    const sorted = [...report.invalidProducts].sort((a, b) => b.overBy - a.overBy);

    sorted.slice(0, 5).forEach((result) => {
      const icon = result.severity === 'error' ? '🔴' : '🟡';
      message += `${icon} ${result.productName.substring(0, 40)}...\n`;
      message += `   ${result.titleLength}文字 (+${result.overBy})\n`;
    });

    if (sorted.length > 5) {
      message += `\n他 ${sorted.length - 5}件...\n`;
    }
  }

  message += `\n${report.summary}\n`;

  return message;
}

/**
 * Slack Block Kitフォーマット
 */
export function formatSlackBlocks(report: TitleValidationReport): any[] {
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📝 Amazon商品名バリデーションレポート'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*総商品数:* ${report.totalProducts}件 | *✅ 適切:* ${report.validCount}件 | *⚠️ 超過:* ${report.invalidCount}件`
      }
    },
    { type: 'divider' }
  ];

  if (report.invalidProducts.length > 0) {
    const sorted = [...report.invalidProducts].sort((a, b) => b.overBy - a.overBy);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔴 75文字超過商品: ${report.invalidProducts.length}件*`
      }
    });

    sorted.slice(0, 5).forEach(result => {
      const icon = result.severity === 'error' ? '🔴' : '🟡';
      const displayName = result.productName.length > 50
        ? result.productName.substring(0, 50) + '...'
        : result.productName;
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${icon} *${displayName}*\n${result.titleLength}文字 (+${result.overBy}) | ASIN: ${result.asin}`
        }
      });
    });

    if (sorted.length > 5) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `他 ${sorted.length - 5}件...` }]
      });
    }
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ すべての商品名が75文字以内に収まっています！'
      }
    });
  }

  blocks.push({ type: 'divider' });

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '📊 詳細を確認' },
        action_id: 'view_title_validation_detail'
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '✏️ 修正を開始' },
        style: 'primary',
        action_id: 'start_title_fix'
      }
    ]
  });

  return blocks;
}

/**
 * CLI実行
 */
if (require.main === module) {
  titleValidationFlow()
    .then((report) => {
      // Slack通知（モック）
      console.log('\n--- Slack通知（モック）---');
      console.log(formatSlackMessage(report));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

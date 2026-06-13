/**
 * Amazon商品名75文字バリデーション - Cron実行スクリプト
 * 
 * 毎週月曜9:00に実行され、75文字超過の商品名を検出してレポート出力
 * stdoutがSlack通知として配信される
 */

import { titleValidationFlow, formatSlackMessage } from '../flows/title-validation-flow';

async function main(): Promise<void> {
  // フロー内のログを抑制（stdoutはSlack通知用に使用）
  const originalLog = console.log;
  console.log = () => {};

  try {
    const report = await titleValidationFlow();
    console.log = originalLog;
    const message = formatSlackMessage(report);
    console.log(message);

    // 終了コード: 超過商品がある場合は1（アラート）、ない場合は0
    process.exit(report.invalidCount > 0 ? 1 : 0);
  } catch (error) {
    console.log = originalLog;
    console.error('❌ 商品名バリデーション実行中にエラーが発生しました');
    console.error(error);
    process.exit(1);
  }
}

main();

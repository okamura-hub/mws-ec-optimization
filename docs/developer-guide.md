# 開発者ガイド

> 作成日: 2026年6月12日  
> 版本: 1.0.0

---

## 1. 概要

本ドキュメントは、MWS EC Optimizationプロジェクトの開発者向けガイドです。

---

## 2. 開発環境セットアップ

### 2.1 前提条件

- Node.js 18+
- npm or yarn
- Git
- TypeScript 5.4+

### 2.2 リポジトリクローン

```bash
git clone https://github.com/okamura-hub/mws-ec-optimization.git
cd mws-ec-optimization
```

### 2.3 依存パッケージインストール

```bash
npm install
```

### 2.4 環境変数設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して、以下の環境変数を設定します：

```env
# Slack設定
SLACK_BOT_TOKEN=xoxb-y...n

# Amazon Ads MCP
AMAZON_ADS_CLIENT_ID=your-client-id
AMAZON_ADS_CLIENT_SECRET=your-c...n

# Notion API
NOTION_API_KEY=your-n...n

# Google Sheets API
GOOGLE_SHEETS_API_KEY=your-a...n

# 開発環境
NODE_ENV=development
LOG_LEVEL=info
```

---

## 3. プロジェクト構造

```
mws-ec-optimization/
├── README.md                          # プロジェクト概要
├── package.json                       # 依存パッケージ
├── tsconfig.json                      # TypeScript設定
├── .env.example                       # 環境変数テンプレート
├── .gitignore                         # Git無視ファイル
│
├── docs/                              # ドキュメント
│   ├── 01-challenges-analysis.md      # 課題分析
│   ├── 02-agent-design.md             # エージェント設計
│   ├── 03-implementation-roadmap.md   # 実装ロードマップ
│   ├── 04-integration-guide.md        # 統合ガイド
│   └── api/
│       └── api-specification.md       # API仕様書
│
├── flows/                             # ビジネスフロー
│   ├── inventory-alert-flow.ts        # 在庫アラートフロー
│   └── profit-management-flow.ts      # 利益管理フロー
│
├── shared/                            # 共有モジュール
│   └── tools/
│       ├── inventory-tools.ts         # 在庫データツール
│       ├── profit-tools.ts            # 利益データツール
│       └── slack-tools.ts             # Slack通知ツール
│
├── data/                              # データファイル
│   └── test/
│       ├── inventory-test-data.json   # 在庫テストデータ
│       └── profit-test-data.json      # 利益テストデータ
│
└── tests/                             # テストファイル
    └── (未実装)
```

---

## 4. 開発ワークフロー

### 4.1 新機能追加

1. **ブランチ作成**
   ```bash
   git checkout -b feat/new-feature
   ```

2. **実装**
   - `flows/`に新しいフローを追加
   - `shared/tools/`に必要なツールを追加
   - テストデータを作成

3. **テスト**
   ```bash
   npm run test
   ```

4. **コミット・プッシュ**
   ```bash
   git add .
   git commit -m "feat: 新機能追加"
   git push origin feat/new-feature
   ```

5. **Pull Request作成**
   - GitHubでPRを作成
   - レビュー依頼

### 4.2 バグ修正

1. **ブランチ作成**
   ```bash
   git checkout -b fix/bug-fix
   ```

2. **修正**
   - バグを修正
   - テスト追加

3. **コミット・プッシュ**
   ```bash
   git add .
   git commit -m "fix: バグ修正"
   git push origin fix/bug-fix
   ```

4. **Pull Request作成**
   - GitHubでPRを作成
   - レビュー依頼

---

## 5. コーディング規約

### 5.1 TypeScript

- **厳格モード有効**: `tsconfig.json`で`strict: true`
- **型定義必須**: `any`型の使用を避ける
- **関数型プログラミング**: 純粋関数を優先
- **非同期処理**: `async/await`を使用

### 5.2 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | キャメルケース | `inventoryData`, `fetchProfitData` |
| 型・インターフェース | パスカルケース | `InventoryData`, `ProfitReport` |
| 定数 | 大文字＋アンダースコア | `MAX_RETRY_COUNT` |
| ファイル名 | ケバブケース | `inventory-alert-flow.ts` |

### 5.3 コメント

- **JSDoc形式**を使用
- **関数の目的**を明記
- **パラメータ**と**戻り値**を説明
- **TODO**は`// TODO:`形式

```typescript
/**
 * 在庫データを取得する
 * 
 * @param mall - フィルタリングするモール
 * @returns 在庫データの配列
 */
async function fetchInventoryData(mall?: string): Promise<InventoryData[]> {
  // TODO: 本番実装
}
```

---

## 6. テスト

### 6.1 テスト実行

```bash
# 全テスト実行
npm run test

# 特定フローのテスト
npm run test:inventory
npm run test:profit
```

### 6.2 テスト作成

`tests/`ディレクトリにテストファイルを作成します。

```typescript
// tests/inventory-alert-flow.test.ts

import { inventoryAlertFlow } from '../flows/inventory-alert-flow';

describe('inventoryAlertFlow', () => {
  it('should detect critical alerts', async () => {
    // テスト実装
  });
});
```

---

## 7. デプロイ

### 7.1 ビルド

```bash
npm run build
```

### 7.2 本番環境

現在、本番環境はローカル環境で動作しています。

**Cronジョブ設定:**

```bash
# 在庫アラート（毎朝8:00）
hermes cron create "0 8 * * *" \
  --name "在庫アラート" \
  --deliver "slack:C0AAZ7UAMMM" \
  --script "flows/inventory-alert-flow.ts" \
  --workdir "C:\Users\okamu\OneDrive\ドキュメント\バイブコーディング\mws-ec-optimization"
```

---

## 8. トラブルシューティング

### 8.1 よくある問題

#### TypeScriptコンパイルエラー

```bash
# 依存パッケージ再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 環境変数エラー

```bash
# .envファイル確認
cat .env

# 環境変数再読み込み
source .env
```

#### Slack通知エラー

```bash
# Slack Bot Token確認
echo $SLACK_BOT_TOKEN

# Slack App設定確認
# https://api.slack.com/apps
```

### 8.2 ログ確認

```bash
# ログファイル確認
tail -f logs/app.log

# エラーログ確認
grep "ERROR" logs/app.log
```

---

## 9. 参考資料

- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [Slack APIドキュメント](https://api.slack.com/)
- [Amazon Ads API](https://advertising.amazon.com/API/docs)
- [Hermes Agentドキュメント](https://hermes-agent.nousresearch.com/docs)

---

## 10. サポート

質問や問題がある場合は、以下にお問い合わせください：

- **GitHub Issues**: https://github.com/okamura-hub/mws-ec-optimization/issues
- **Slack**: `#mws_ec_optimization` チャンネル

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-12 | 初版作成 |

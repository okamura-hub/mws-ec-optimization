# 貢献ガイドライン

MWS EC Optimizationプロジェクトへの貢献ありがとうございます！

## 目次

- [行動規範](#行動規範)
- [開発フロー](#開発フロー)
- [Issue起票](#issue起票)
- [Pull Request](#pull-request)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [コミットメッセージ](#コミットメッセージ)
- [レビュー基準](#レビュー基準)

---

## 行動規範

本プロジェクトは[Contributor Covenant](https://www.contributor-covenant.org/ja/version/2/0/code_of_conduct/)行動規範に準拠します。

## 開発フロー

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/mws-ec-optimization.git
cd mws-ec-optimization
git remote add upstream https://github.com/okamura-hub/mws-ec-optimization.git
```

### 2. ブランチ作成

```bash
# 新機能
git checkout -b feat/feature-name

# バグ修正
git checkout -b fix/bug-name

# ドキュメント
git checkout -b docs/doc-name
```

### 3. 開発・テスト

```bash
# 依存インストール
npm install

# 型チェック
npm run typecheck

# テスト実行
npm test

# フロー動作確認
npm run test:inventory
npm run test:profit
```

### 4. コミット・プッシュ

```bash
git add .
git commit -m "feat: 新機能追加"
git push origin feat/feature-name
```

### 5. Pull Request作成

GitHub上でPRを作成し、レビューを依頼します。

---

## Issue起票

### バグ報告

以下のテンプレートを使用してください：

```markdown
## 概要
バグの簡潔な説明

## 再現手順
1. '...'
2. '...'
3. '...'

## 期待される動作
期待される結果

## 実際の動作
実際の結果

## 環境
- OS: [e.g. Windows 10]
- Node.js: [e.g. 18.17.0]
- ブラウザ: [e.g. Chrome 120]

## スクリーンショット
該当する場合

## 追加情報
その他の情報
```

### 機能提案

```markdown
## 概要
機能の簡潔な説明

## 背景
なぜこの機能が必要か

## 提案する解決策
期待される動作

## 代替案
検討した代替案

## 追加情報
モックアップ、参考リンク等
```

---

## Pull Request

### PRテンプレート

```markdown
## 概要
PRの簡潔な説明

## 関連Issue
Closes #123

## 変更内容
- 変更1
- 変更2

## チェックリスト
- [ ] テストが通る
- [ ] 型チェックが通る
- [ ] ドキュメントを更新した（必要に応じて）
- [ ] CHANGELOGを更新した（ユーザー向け変更の場合）

## スクリーンショット
UI変更がある場合
```

### PRサイズ

- **小さく保つ**: 1PR = 1変更
- **500行以下**: 大きすぎる場合は分割
- **明確なスコープ**: 関連する変更のみ含める

---

## コーディング規約

### TypeScript

- **strictモード**: `tsconfig.json`で`strict: true`
- **型定義必須**: `any`型の使用を避ける
- **関数型**: 純粋関数を優先
- **非同期**: `async/await`を使用

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | キャメルケース | `inventoryData`, `fetchProfitData` |
| 型・インターフェース | パスカルケース | `InventoryData`, `ProfitReport` |
| 定数 | 大文字＋アンダースコア | `MAX_RETRY_COUNT` |
| ファイル名 | ケバブケース | `inventory-alert-flow.ts` |

### コメント

- **JSDoc形式**を使用
- **関数の目的**を明記
- **パラメータ**と**戻り値**を説明

```typescript
/**
 * 在庫データを取得する
 * 
 * @param mall - フィルタリングするモール
 * @returns 在庫データの配列
 */
async function fetchInventoryData(mall?: string): Promise<InventoryData[]> {
  // 実装
}
```

---

## テスト

### テスト実行

```bash
# 全テスト
npm test

# 特定フロー
npm run test:inventory
npm run test:profit

# カバレッジ
npm test -- --coverage
```

### テスト作成

- `tests/`ディレクトリに配置
- ファイル名: `*.test.ts`
- 説明: 日本語OK、動作がわかるように

```typescript
describe('在庫アラートフロー', () => {
  describe('fetchInventoryData', () => {
    it('モックデータを取得できる', async () => {
      const data = await fetchInventoryData();
      expect(data).toBeDefined();
    });
  });
});
```

---

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/)に準拠します。

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント変更
- **style**: コード意味に影響しない変更（空白、フォーマット等）
- **refactor**: 機能変更なしのリファクタリング
- **test**: テスト追加・修正
- **chore**: ビルド、CI、ツール変更

### 例

```
feat(inventory): 在庫アラートフローに過剰在庫検出を追加

- 180日分以上の在庫を過剰在庫として検出
- Slack通知に過剰在庫セクションを追加
- テストケースを3件追加

Closes #11
```

---

## レビュー基準

### マージ条件

- [ ] テストがすべて通る
- [ ] 型チェックが通る
- [ ] コーディング規約に準拠
- [ ] ドキュメントが更新されている（必要に応じて）
- [ ] 1人以上のレビュー承認

### レビュー観点

1. **機能性**: 期待通りに動作するか
2. **可読性**: コードが読みやすいか
3. **保守性**: 将来の変更に強いか
4. **テスト**: 十分なテストカバレッジか
5. **セキュリティ**: セキュリティホールはないか

---

## 問い合わせ

質問や問題がある場合は：

- **GitHub Issues**: https://github.com/okamura-hub/mws-ec-optimization/issues
- **Slack**: `#mws_ec_optimization` チャンネル

---

本ガイドラインは[contributing-template.json](https://github.com/nayafia/contributing-template/blob/master/CONTRIBUTING-template.json)を参考に作成されました。

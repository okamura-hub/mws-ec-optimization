# Changelog

本プロジェクトの重要な変更履歴を記録します。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に準拠します。

---

## [Unreleased]

### Added
- **ROAS低下キャンペーン自動検出フロー** 実装（Issue #8）
  - 全広告キャンペーンのROASを前期間と比較
  - 3段階深刻度判定（🔴 Critical: 40%以上低下/ROAS<1.0、🟡 Warning: 20%以上低下、🔵 Info: 10%以上低下）
  - 原因分析（CTR低下/CV率低下/CPC上昇/インプレッション減少/新規比率偏高/予算超過）
  - 推奨アクション自動生成（入札調整/LP改善/キーワード見直し等）
  - 推定損失額計算
  - `campaign-performance-tools.ts`: キャンペーンパフォーマンスデータ取得（モック10件）
  - `roas-decline-detection-flow.ts`: ROAS低下検出フロー
  - `roas-decline-detection-flow.test.ts`: テスト24件
  - package.json: `test:roas` スクリプト追加

- **商品名バリデーションフロー** 実装（Issue #7）
  - Amazon商品名の75文字制限バリデーション
  - 超過商品検出（警告: 10文字以下超過 / エラー: 11文字以上超過）
  - ASIN・SKU・文字数・修正推奨メッセージのレポート生成
  - Slack通知メッセージ・Block Kitフォーマット生成
  - `amazon-catalog-tools.ts`: Amazon商品カタログデータ取得（モック）
  - `title-validation-flow.ts`: 商品名バリデーションフロー
  - `title-validation-flow.test.ts`: テスト17件

### Changed
- テスト合計: 36件 → **60件合格**（+24件）
- 開発者ガイド: テストセクションを60件合格に更新
- API仕様書: 実際のコードに即した内容に更新
- package.json: `test:title` スクリプト追加
- README: ディレクトリ構成・ロードマップ更新

---

## [1.0.0] - 2026-06-13

### Added
- **在庫アラートフロー** プロトタイプ実装
  - 在庫切れ注意（7日分以下）の検出
  - 在庫警告（14日分以下）の検出
  - 滞留在庫（90日以上未販売）の検出
  - 過剰在庫（180日分以上）の検出
  - Slack通知（モック）

- **利益管理フロー** プロトタイプ実装
  - 商品別・モール別の利益率計算
  - 総コスト計算（原価 + 配送費 + 広告費 + 手数料）
  - 原価未登録商品の検出
  - 低利益率商品（10%未満）のアラート
  - 利益レポート生成

- **共有ツール**
  - `inventory-tools.ts`: 在庫データ取得（モック）
  - `profit-tools.ts`: 利益データ取得（モック）
  - `slack-tools.ts`: Slack通知（モック + Block Kit対応）

- **テストコード**（19件すべて合格）
  - 在庫アラートテスト: 9件
  - 利益管理テスト: 10件

- **ドキュメント**
  - README.md
  - API仕様書 (`docs/api/api-specification.md`)
  - 開発者ガイド (`docs/developer-guide.md`)
  - 課題分析 (`docs/01-challenges-analysis.md`)
  - エージェント設計 (`docs/02-agent-design.md`)
  - 実装ロードマップ (`docs/03-implementation-roadmap.md`)
  - 統合ガイド (`docs/04-integration-guide.md`)
  - 環境変数テンプレート (`.env.example`)

- **インフラ**
  - TypeScript設定 (`tsconfig.json`)
  - Jestテスト設定 (`jest.config.js`)
  - package.json スクリプト
  - GitHub Issue 9件起票（P0-P2）

### Fixed
- TypeScriptコンパイルエラー11件修正
- `null`安全処理の追加（原価null許容）
- 未使用インポートの削除
- 在庫アラート: 滞留在庫と過剰在庫の重複検出を修正
- Infinity表示修正（「90日分以上未販売」に統一）
- 利益計算: 総コストに配送費・広告費・手数料を含める

---

## [0.1.0] - 2026-06-12

### Added
- リポジトリ作成
- 議事録分析（38回分、2025年12月〜2026年6月）
- エージェント設計ドキュメント
- 実装ロードマップ策定
- GitHub Issue起票（6件 → のちに9件に再編）

---

[Unreleased]: https://github.com/okamura-hub/mws-ec-optimization/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/okamura-hub/mws-ec-optimization/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/okamura-hub/mws-ec-optimization/releases/tag/v0.1.0

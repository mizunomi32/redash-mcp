# Redash MCP サーバー 仕様書
## 1. 目的とスコープ
社内のRedashインスタンスに対して、AIエージェント（Claude等）から **既存クエリの取得と実行** を行うためのMCPサーバー。
完全な **読み取り専用** とし、クエリ定義の作成・更新・削除は行わない。クエリの編集・追加は、AIエージェントが提案しながら人間がRedash GUIで操作する運用とする。
### スコープ内
- 既存クエリの一覧・検索
- クエリ定義（SQL本文・パラメータ定義）の取得
- 保存済みクエリの実行と結果取得
### スコープ外（Non-Goals）
- クエリ定義の作成・更新・アーカイブ・削除
- アドホックSQL（保存されない任意SQL）の実行
- ダッシュボード／ウィジェットの取得・操作
- 可視化（チャート）の生成・編集
- アラート管理、ユーザー／グループ管理
- データソース一覧の取得（保存済みクエリ実行には不要なため）
## 2. 技術構成
| 項目 | 選定 |
| --- | --- |
| 言語 | TypeScript |
| SDK | `@modelcontextprotocol/sdk`（公式） |
| トランスポート | stdio |
| 配布 | 社内Gitリポジトリ直参照、または社内レジストリのDockerイメージ |
## 3. 設定（環境変数）
| 変数名 | 必須 | 説明 |
| --- | --- | --- |
| `REDASH_URL` | ○ | RedashインスタンスのベースURL（例: `https://redash.example.com`） |
| `REDASH_API_KEY` | ○ | RedashのAPIキー。**読み取り専用ユーザー**のキーを割り当てること |
| `REDASH_EXTRA_HEADERS` | - | 全リクエストに付与する追加HTTPヘッダ（社内ゲートウェイ／Cloudflare Access等向け）。`Authorization` ヘッダはサーバー側で固定し上書き不可 |
## 4. 認証・セキュリティ方針
- APIキーは **読み取り専用ユーザー** に紐づけて発行する。書き込み系APIを実装しないため、誤操作・悪用によるクエリ定義破壊の経路自体が存在しない。
- `REDASH_EXTRA_HEADERS` は社内プロキシやCloudflare Access背後のRedashに対応するための任意ヘッダ付与機構。`Authorization` ヘッダだけはサーバーが `Key <REDASH_API_KEY>` で固定し、外部から上書きできないようにする。
- APIキーおよび追加ヘッダの値は、ログ・エラーメッセージに一切出力しない。
## 5. ツール仕様
### 5.1 `list_queries`
既存クエリを検索・一覧する。
**入力**
| 引数 | 型 | 必須 | 既定値 | 説明 |
| --- | --- | --- | --- | --- |
| `search` | string | - | - | 名前・タグの部分一致 |
| `page` | number | - | 1 | ページ番号 |
| `page_size` | number | - | 25 | 1ページあたり件数 |
**出力**: `{ id, name, tags, updated_at }` の配列。SQL本文は含めず軽量に返す。
対応API: `GET /api/queries?q=<search>&page=<n>&page_size=<m>`
### 5.2 `get_query`
クエリ定義の詳細を取得する。実行前にAIがSQL内容と必要なパラメータを把握するために使う。
**入力**
| 引数 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `query_id` | number | ○ | クエリID |
**出力**: SQL本文、パラメータ定義（名前・型・既定値）、データソースID、最終更新者・更新日時などのメタ情報。
対応API: `GET /api/queries/<query_id>`
### 5.3 `run_query`
保存済みクエリを実行し、結果を取得する。
**入力**
| 引数 | 型 | 必須 | 既定値 | 説明 |
| --- | --- | --- | --- | --- |
| `query_id` | number | ○ | - | 実行対象のクエリID |
| `parameters` | object | - | - | パラメータ化クエリ用の値（例: `{ "start_date": "2026-01-01" }`） |
| `max_age` | number | - | 0 | キャッシュ結果の許容秒数。0で常に再実行 |
| `row_limit` | number | - | 100 | 返却する最大行数 |
| `timeout_sec` | number | - | 60 | ジョブ完了待ちのタイムアウト |
**出力**: `{ columns, rows, row_count, truncated }`。`row_limit` を超えた場合は `truncated: true` を返し、結果を切り詰める。タイムアウト時はジョブIDと中断した旨を返す。
対応API: `POST /api/queries/<query_id>/results`（`{ parameters, max_age }` をボディに指定）
## 6. 非同期ジョブのポーリング
Redashのクエリ実行は非同期ジョブを返す場合がある。`run_query` は以下のフローで完了を待つ。
1. `POST /api/queries/<query_id>/results` を実行。
2. レスポンスに `job` が含まれる場合、`GET /api/jobs/<job_id>` をポーリングする。
3. ジョブ完了（status=3）で `query_result_id` を取得し、`GET /api/query_results/<id>` で結果を取得する。
4. `timeout_sec` を超えた場合はポーリングを中断し、ジョブIDを添えて「実行中（中断）」を返す。
ポーリング間隔は1秒程度から開始し、指数的に延ばしてもよい。
## 7. エラーハンドリング
- RedashのHTTPステータスとレスポンスボディを構造化して返し、SQLエラー・権限エラー・存在しないクエリIDをAIが判別できるようにする。
- ネットワークエラーとAPIエラーを区別して返す。
- いかなるエラー時もAPIキー・追加ヘッダの値は出力しない。
## 8. 設定例
### Claude Desktop（Docker起動）
```json
{
  "mcpServers": {
    "redash": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "REDASH_URL",
        "-e", "REDASH_API_KEY",
        "-e", "REDASH_EXTRA_HEADERS",
        "redash-mcp:latest"],
      "env": {
        "REDASH_URL": "https://redash.example.com",
        "REDASH_API_KEY": "<read-only-api-key>",
        "REDASH_EXTRA_HEADERS": "{\"CF-Access-Client-Id\":\"...\",\"CF-Access-Client-Secret\":\"...\"}"
      }
    }
  }
}
```
### Node直接起動
```json
{
  "mcpServers": {
    "redash": {
      "command": "node",
      "args": ["/absolute/path/to/redash-mcp/dist/index.js"],
      "env": {
        "REDASH_URL": "https://redash.example.com",
        "REDASH_API_KEY": "<read-only-api-key>"
      }
    }
  }
}
```
## 9. 想定ワークフロー
1. AIエージェントが `list_queries` で目的のクエリを検索。
2. `get_query` でSQL本文とパラメータ定義を確認。
3. `run_query` でパラメータを指定して実行し、結果を取得・分析。
4. 改善案がある場合、AIはSQLの修正案を提示する。実際の保存・編集は人間がRedash GUIで行う。

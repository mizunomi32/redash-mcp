# redash-mcp

Redash用の読み取り専用MCPサーバーです。AIエージェント（Claude等）がMCPプロトコル経由で既存のRedashクエリを一覧・取得・実行できます。

## ツール一覧

| ツール | 説明 |
|---|---|
| `list_queries` | 既存クエリを検索・一覧（id, name, tags, updated_at を返却） |
| `get_query` | クエリ定義の詳細を取得（SQL本文・パラメータ定義を含む） |
| `run_query` | 保存済みクエリを実行し結果を取得（非同期ジョブのポーリング対応） |

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `REDASH_URL` | ○ | RedashインスタンスのベースURL（例: `https://redash.example.com`） |
| `REDASH_API_KEY` | ○ | RedashのAPIキー。**読み取り専用ユーザー**のキーを推奨 |
| `REDASH_EXTRA_HEADERS` | - | 全リクエストに付与する追加HTTPヘッダ（JSON形式。Cloudflare Access等向け） |

> **セキュリティ**: `Authorization` ヘッダは常に `Key <REDASH_API_KEY>` として固定され、`REDASH_EXTRA_HEADERS` からは上書きできません。

## セットアップ

### Claude Desktop — Docker起動

```json
{
  "mcpServers": {
    "redash": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "REDASH_URL",
        "-e", "REDASH_API_KEY",
        "-e", "REDASH_EXTRA_HEADERS",
        "redash-mcp:latest"
      ],
      "env": {
        "REDASH_URL": "https://redash.example.com",
        "REDASH_API_KEY": "<read-only-api-key>",
        "REDASH_EXTRA_HEADERS": "{\"CF-Access-Client-Id\":\"...\",\"CF-Access-Client-Secret\":\"...\"}"
      }
    }
  }
}
```

### Claude Desktop — Node直接起動

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

## 開発

```bash
npm install
npm run build   # TypeScriptコンパイル
npm test        # Vitestでテスト実行
npm run dev     # tsx で直接実行（ビルド不要）
```

## Dockerビルド

```bash
docker build -t redash-mcp .
docker run --rm -i \
  -e REDASH_URL="https://redash.example.com" \
  -e REDASH_API_KEY="your-key" \
  redash-mcp
```

## アーキテクチャ

クリーンアーキテクチャを採用しています。

```
interface/mcp  →  application/usecases  →  domain  ←  infrastructure/redash
```

| 層 | 役割 |
|---|---|
| **domain** | エンティティ・リポジトリインターフェース・エラー型。外部依存なし |
| **application** | ユースケース（ListQueries / GetQuery / RunQuery・非同期ポーリング） |
| **infrastructure** | Redash HTTP クライアントとリポジトリ実装 |
| **interface/mcp** | MCPツール定義とサーバー初期化 |
| **index.ts** | 依存性注入（コンポジションルート）・stdioトランスポート起動 |

## 想定ワークフロー

1. `list_queries` で目的のクエリを検索
2. `get_query` でSQL本文とパラメータ定義を確認
3. `run_query` でパラメータを指定して実行し、結果を取得・分析
4. 改善案がある場合、AIがSQL修正案を提示。実際の保存・編集は人間がRedash GUIで実施

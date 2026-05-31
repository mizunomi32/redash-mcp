/** Metadata describing a single column in a result set. */
export interface Column {
  /** Internal column name used as the key in each row object. */
  name: string;
  /** Human-readable column label from Redash. */
  friendly_name: string;
  /** Redash column type hint (e.g. `"string"`, `"integer"`, `"float"`). */
  type: string;
}

/**
 * Raw columnar data as returned directly from the Redash API.
 * Used internally before applying row limits or truncation flags.
 */
export interface QueryResultData {
  /** Ordered column descriptors. */
  columns: Column[];
  /** Data rows, each keyed by column name. */
  rows: Record<string, unknown>[];
}

/**
 * Query result as surfaced to MCP clients.
 * Rows are capped at the requested `row_limit`; `truncated` signals that
 * additional rows were dropped.
 */
export interface QueryResult {
  /** Ordered column descriptors. */
  columns: Column[];
  /** Data rows, capped to `row_limit`. */
  rows: Record<string, unknown>[];
  /** Total number of rows returned by Redash before truncation. */
  row_count: number;
  /** `true` when `row_count` exceeds `row_limit` and rows were dropped. */
  truncated: boolean;
}

/** Options controlling how a query is executed via the MCP `run_query` tool. */
export interface RunQueryOptions {
  /** Numeric ID of the saved Redash query to execute. */
  query_id: number;
  /** Runtime parameter values keyed by parameter name. */
  parameters?: Record<string, unknown>;
  /** Maximum cache age in seconds; `0` forces a fresh execution. */
  max_age: number;
  /** Maximum number of rows to return in the response. */
  row_limit: number;
  /** Seconds to wait for async job completion before returning a timeout result. */
  timeout_sec: number;
}

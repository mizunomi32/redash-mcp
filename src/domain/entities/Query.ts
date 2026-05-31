/** A single parameter definition attached to a Redash query. */
export interface QueryParameter {
  /** Internal parameter name used as the substitution key in SQL. */
  name: string;
  /** Human-readable label shown in the Redash UI. */
  title: string;
  /** Redash parameter type (e.g. `"text"`, `"number"`, `"enum"`). */
  type: string;
  /** Default or last-used value for the parameter. */
  value?: unknown;
  /** Newline-separated option list; present only when type is `"enum"`. */
  enumOptions?: string;
}

/** Lightweight query summary returned by the list-queries endpoint. */
export interface QueryListItem {
  /** Numeric query ID. */
  id: number;
  /** Display name of the query. */
  name: string;
  /** Tags attached to the query. */
  tags: string[];
  /** ISO 8601 timestamp of the last modification. */
  updated_at: string;
}

/** Full query definition including its SQL body and parameter schema. */
export interface Query {
  /** Numeric query ID. */
  id: number;
  /** Display name of the query. */
  name: string;
  /** Optional human-readable description; `null` when not set. */
  description: string | null;
  /** Raw SQL text of the query. */
  query: string;
  /** Ordered list of parameter definitions. Empty array when the query has none. */
  parameters: QueryParameter[];
  /** ID of the data source the query runs against. */
  data_source_id: number;
  /** Tags attached to the query. */
  tags: string[];
  /** ISO 8601 timestamp of the last modification. */
  updated_at: string;
  /** Owner of the query. */
  user: { id: number; name: string };
}

/** Input options for the list-queries operation. */
export interface ListQueriesOptions {
  /** Optional full-text search term filtered server-side by Redash. */
  search?: string;
  /** 1-based page number. */
  page: number;
  /** Maximum number of results per page (up to 100). */
  page_size: number;
}

/** Paginated response returned by the list-queries operation. */
export interface ListQueriesResult {
  /** Query summaries for the requested page. */
  results: QueryListItem[];
  /** Total number of queries matching the filter. */
  count: number;
  /** Current page number. */
  page: number;
  /** Page size used for this response. */
  page_size: number;
}

export interface Column {
  name: string;
  friendly_name: string;
  type: string;
}

export interface QueryResultData {
  columns: Column[];
  rows: Record<string, unknown>[];
}

export interface QueryResult {
  columns: Column[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
}

export interface RunQueryOptions {
  query_id: number;
  parameters?: Record<string, unknown>;
  max_age: number;
  row_limit: number;
  timeout_sec: number;
}

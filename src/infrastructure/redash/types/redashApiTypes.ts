/**
 * Raw response shape for a single query from `GET /api/queries/:id` and
 * embedded inside `RedashApiQueryListResponse`.
 */
export interface RedashApiQuery {
  id: number;
  name: string;
  query: string;
  description: string | null;
  /** Query options object; currently only `parameters` is used. */
  options: { parameters: RedashApiQueryParameter[] };
  data_source_id: number;
  tags: string[];
  /** ISO 8601 timestamp of the last modification. */
  updated_at: string;
  user: { id: number; name: string };
}

/** Parameter definition as returned by the Redash API. */
export interface RedashApiQueryParameter {
  name: string;
  title: string;
  type: string;
  value?: unknown;
  enumOptions?: string;
}

/** Paginated response from `GET /api/queries`. */
export interface RedashApiQueryListResponse {
  results: RedashApiQuery[];
  count: number;
  page: number;
  page_size: number;
}

/** Async job object as returned inside job-related API responses. */
export interface RedashApiJob {
  id: string;
  /** Numeric status code corresponding to `JobStatus`. */
  status: number;
  /** Error message; empty string when the job has not failed. */
  error: string;
  /** Set to the stored result ID once the job reaches Done status. */
  query_result_id: number | null;
  result: unknown;
}

/** Top-level wrapper for responses from `GET /api/jobs/:id`. */
export interface RedashApiJobResponse {
  job: RedashApiJob;
}

/** Metadata for a single result column. */
export interface RedashApiColumn {
  name: string;
  friendly_name: string;
  type: string;
}

/** Columnar data payload returned inside a query result. */
export interface RedashApiQueryResultData {
  columns: RedashApiColumn[];
  rows: Record<string, unknown>[];
}

/** Top-level wrapper for responses from `GET /api/query_results/:id`. */
export interface RedashApiQueryResult {
  query_result: {
    data: RedashApiQueryResultData;
    /** ISO 8601 timestamp indicating when the result was cached. */
    retrieved_at: string;
  };
}

/**
 * Response shape for `POST /api/queries/:id/results`.
 *
 * Exactly one of `query_result` or `job` will be present:
 * - `query_result` — cache hit; data is immediately available.
 * - `job` — query was queued for async execution.
 */
export interface RedashApiResultsResponse {
  query_result?: RedashApiQueryResult["query_result"];
  job?: RedashApiJob;
}

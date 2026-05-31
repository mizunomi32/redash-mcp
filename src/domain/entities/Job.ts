/**
 * Represents an asynchronous query execution job returned by the Redash API
 * when a query cannot be answered from cache and must be run asynchronously.
 */
export interface Job {
  /** Unique job identifier assigned by Redash. */
  id: string;
  /** Current execution state of the job. */
  status: JobStatus;
  /** Error message populated when the job fails; empty string otherwise. */
  error: string;
  /** ID of the stored query result; non-null only when status is Done. */
  query_result_id: number | null;
}

/** Numeric status codes returned by the Redash Jobs API. */
export enum JobStatus {
  Pending = 1,
  Started = 2,
  Done = 3,
  Failed = 4,
  Cancelled = 5,
}

/**
 * Discriminated union representing the outcome of polling a job to completion.
 *
 * - `success` — the query finished and produced a result.
 * - `timeout` — the polling deadline was reached before the job completed.
 * - `error` — Redash reported a failure or cancellation.
 */
export type JobPollOutcome =
  | { kind: "success"; queryResultId: number }
  | { kind: "timeout"; jobId: string }
  | { kind: "error"; message: string };

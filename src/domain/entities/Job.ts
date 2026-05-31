export interface Job {
  id: string;
  status: JobStatus;
  error: string;
  query_result_id: number | null;
}

export enum JobStatus {
  Pending = 1,
  Started = 2,
  Done = 3,
  Failed = 4,
  Cancelled = 5,
}

export type JobPollOutcome =
  | { kind: "success"; queryResultId: number }
  | { kind: "timeout"; jobId: string }
  | { kind: "error"; message: string };

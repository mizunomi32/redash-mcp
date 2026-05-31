import { type JobPollOutcome, JobStatus } from "../../domain/entities/Job.js";
import type {
  QueryResult,
  QueryResultData,
  RunQueryOptions,
} from "../../domain/entities/QueryResult.js";
import { RedashError, RedashErrorKind } from "../../domain/errors/RedashError.js";
import type { IJobRepository } from "../../domain/repositories/IJobRepository.js";
import type { IQueryRepository } from "../../domain/repositories/IQueryRepository.js";

/**
 * Discriminated union representing the outcome of a run-query execution.
 *
 * - `completed` — query finished within the timeout; result is available.
 * - `timeout` — the job is still running; `jobId` can be used to poll later.
 */
export type RunQueryResult =
  | { kind: "completed"; result: QueryResult }
  | { kind: "timeout"; jobId: string };

/**
 * Application use case: execute a saved Redash query and return its results.
 *
 * Handles both the synchronous (cache hit) and asynchronous (job) code paths.
 * When Redash returns a job ID, this use case polls with exponential back-off
 * until the job completes or the configured `timeout_sec` is exceeded.
 * Results are truncated to `row_limit` rows; the `truncated` flag on the
 * returned `QueryResult` indicates when rows were dropped.
 */
export class RunQueryUseCase {
  /**
   * @param queryRepository - Repository for submitting queries and fetching results.
   * @param jobRepository - Repository for polling async job state.
   */
  constructor(
    private readonly queryRepository: IQueryRepository,
    private readonly jobRepository: IJobRepository,
  ) {}

  /**
   * Executes a query and returns its (possibly truncated) result set.
   *
   * @param options - Execution options including query ID, parameters, and limits.
   * @returns `RunQueryResult` — either the completed result or a timeout indicator.
   * @throws {RedashError} with kind `Sql` when Redash reports a query failure.
   * @throws {RedashError} propagated from repositories on HTTP or network errors.
   */
  async execute(options: RunQueryOptions): Promise<RunQueryResult> {
    const response = await this.queryRepository.postQueryResults(options.query_id, {
      parameters: options.parameters,
      max_age: options.max_age,
    });

    let data: QueryResultData;

    if (response.kind === "immediate") {
      data = response.data;
    } else {
      const outcome = await this.pollJob(response.jobId, options.timeout_sec * 1000);

      if (outcome.kind === "timeout") {
        return { kind: "timeout", jobId: outcome.jobId };
      }

      if (outcome.kind === "error") {
        throw new RedashError(RedashErrorKind.Sql, outcome.message);
      }

      data = await this.queryRepository.getQueryResult(outcome.queryResultId);
    }

    const truncated = data.rows.length > options.row_limit;
    return {
      kind: "completed",
      result: {
        columns: data.columns,
        rows: data.rows.slice(0, options.row_limit),
        row_count: data.rows.length,
        truncated,
      },
    };
  }

  /**
   * Polls a Redash job using exponential back-off until it reaches a terminal
   * state or the deadline is exceeded.
   *
   * Back-off starts at 1 s and doubles each iteration up to a maximum of 8 s.
   *
   * @param jobId - Redash job ID to poll.
   * @param timeoutMs - Maximum total polling duration in milliseconds.
   * @returns `JobPollOutcome` describing success, timeout, or error.
   */
  private async pollJob(jobId: string, timeoutMs: number): Promise<JobPollOutcome> {
    const deadline = Date.now() + timeoutMs;
    let intervalMs = 1000;
    const maxIntervalMs = 8000;

    while (Date.now() < deadline) {
      await sleep(intervalMs);
      intervalMs = Math.min(intervalMs * 2, maxIntervalMs);

      const job = await this.jobRepository.getJob(jobId);

      if (job.status === JobStatus.Done) {
        if (!job.query_result_id) {
          return { kind: "error", message: "Job completed but no query_result_id returned" };
        }
        return { kind: "success", queryResultId: job.query_result_id };
      }

      if (job.status === JobStatus.Failed) {
        return { kind: "error", message: job.error || "Query execution failed" };
      }

      if (job.status === JobStatus.Cancelled) {
        return { kind: "error", message: "Query was cancelled" };
      }
    }

    return { kind: "timeout", jobId };
  }
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 *
 * @param ms - Delay duration in milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

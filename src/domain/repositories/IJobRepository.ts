import type { Job } from "../entities/Job.js";

/**
 * Port (secondary port in hexagonal architecture) for fetching the state of
 * an asynchronous Redash job.  The infrastructure layer provides the concrete
 * implementation via the Redash Jobs API.
 */
export interface IJobRepository {
  /**
   * Fetches the current state of a Redash async job.
   *
   * @param jobId - Unique job identifier returned by the results endpoint.
   * @returns Current job state including status and, when done, `query_result_id`.
   */
  getJob(jobId: string): Promise<Job>;
}

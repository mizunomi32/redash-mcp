import type { Job } from "../../domain/entities/Job.js";
import type { IJobRepository } from "../../domain/repositories/IJobRepository.js";
import type { RedashHttpClient } from "./RedashHttpClient.js";
import type { RedashApiJobResponse } from "./types/redashApiTypes.js";

/**
 * Concrete implementation of `IJobRepository` backed by the Redash Jobs API
 * (`GET /api/jobs/:id`).
 *
 * Maps the raw API response shape (`RedashApiJobResponse`) to the domain
 * `Job` entity so that the application layer remains decoupled from the
 * Redash API contract.
 */
export class RedashJobRepository implements IJobRepository {
  /** @param client - Configured HTTP client for Redash API calls. */
  constructor(private readonly client: RedashHttpClient) {}

  /**
   * Fetches the current state of an async job from the Redash Jobs API.
   *
   * @param jobId - Unique job identifier returned by the results endpoint.
   * @returns Domain `Job` entity with the current status and result ID.
   * @throws {RedashError} propagated from `RedashHttpClient` on any HTTP error.
   */
  async getJob(jobId: string): Promise<Job> {
    const response = await this.client.get<RedashApiJobResponse>(`/api/jobs/${jobId}`);

    return {
      id: response.job.id,
      status: response.job.status,
      error: response.job.error,
      query_result_id: response.job.query_result_id,
    };
  }
}

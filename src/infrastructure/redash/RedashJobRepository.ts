import type { Job } from "../../domain/entities/Job.js";
import type { IJobRepository } from "../../domain/repositories/IJobRepository.js";
import type { RedashHttpClient } from "./RedashHttpClient.js";
import type { RedashApiJobResponse } from "./types/redashApiTypes.js";

export class RedashJobRepository implements IJobRepository {
  constructor(private readonly client: RedashHttpClient) {}

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

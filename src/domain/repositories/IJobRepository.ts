import type { Job } from "../entities/Job.js";

export interface IJobRepository {
  getJob(jobId: string): Promise<Job>;
}

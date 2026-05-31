/** Unit tests for {@link RunQueryUseCase} — covers immediate results, async job polling, truncation, timeouts, and SQL errors. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RunQueryUseCase } from "../../../src/application/usecases/RunQueryUseCase.js";
import { JobStatus } from "../../../src/domain/entities/Job.js";
import { RedashErrorKind } from "../../../src/domain/errors/RedashError.js";
import type { IJobRepository } from "../../../src/domain/repositories/IJobRepository.js";
import type { IQueryRepository } from "../../../src/domain/repositories/IQueryRepository.js";

vi.useFakeTimers();

const mockQueryRepository: IQueryRepository = {
  listQueries: vi.fn(),
  getQuery: vi.fn(),
  postQueryResults: vi.fn(),
  getQueryResult: vi.fn(),
};

const mockJobRepository: IJobRepository = {
  getJob: vi.fn(),
};

const mockColumns = [{ name: "id", friendly_name: "ID", type: "integer" }];
const mockRows = Array.from({ length: 150 }, (_, i) => ({ id: i + 1 }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RunQueryUseCase - immediate result", () => {
  it("returns result directly when no job is needed", async () => {
    vi.mocked(mockQueryRepository.postQueryResults).mockResolvedValue({
      kind: "immediate",
      data: { columns: mockColumns, rows: mockRows.slice(0, 10) },
    });

    const useCase = new RunQueryUseCase(mockQueryRepository, mockJobRepository);
    const result = await useCase.execute({
      query_id: 1,
      max_age: 0,
      row_limit: 100,
      timeout_sec: 60,
    });

    expect(result.kind).toBe("completed");
    if (result.kind === "completed") {
      expect(result.result.truncated).toBe(false);
      expect(result.result.row_count).toBe(10);
    }
  });

  it("truncates rows when result exceeds row_limit", async () => {
    vi.mocked(mockQueryRepository.postQueryResults).mockResolvedValue({
      kind: "immediate",
      data: { columns: mockColumns, rows: mockRows },
    });

    const useCase = new RunQueryUseCase(mockQueryRepository, mockJobRepository);
    const result = await useCase.execute({
      query_id: 1,
      max_age: 0,
      row_limit: 50,
      timeout_sec: 60,
    });

    expect(result.kind).toBe("completed");
    if (result.kind === "completed") {
      expect(result.result.rows).toHaveLength(50);
      expect(result.result.row_count).toBe(150);
      expect(result.result.truncated).toBe(true);
    }
  });
});

describe("RunQueryUseCase - async job polling", () => {
  it("polls and returns result on job completion", async () => {
    vi.mocked(mockQueryRepository.postQueryResults).mockResolvedValue({
      kind: "job",
      jobId: "job-123",
    });
    vi.mocked(mockJobRepository.getJob)
      .mockResolvedValueOnce({
        id: "job-123",
        status: JobStatus.Started,
        error: "",
        query_result_id: null,
      })
      .mockResolvedValueOnce({
        id: "job-123",
        status: JobStatus.Done,
        error: "",
        query_result_id: 99,
      });
    vi.mocked(mockQueryRepository.getQueryResult).mockResolvedValue({
      columns: mockColumns,
      rows: mockRows.slice(0, 5),
    });

    const useCase = new RunQueryUseCase(mockQueryRepository, mockJobRepository);
    const executePromise = useCase.execute({
      query_id: 1,
      max_age: 0,
      row_limit: 100,
      timeout_sec: 60,
    });

    await vi.runAllTimersAsync();
    const result = await executePromise;

    expect(result.kind).toBe("completed");
    if (result.kind === "completed") {
      expect(result.result.row_count).toBe(5);
      expect(mockQueryRepository.getQueryResult).toHaveBeenCalledWith(99);
    }
  });

  it("returns timeout result when job exceeds timeout_sec", async () => {
    vi.mocked(mockQueryRepository.postQueryResults).mockResolvedValue({
      kind: "job",
      jobId: "job-slow",
    });
    vi.mocked(mockJobRepository.getJob).mockResolvedValue({
      id: "job-slow",
      status: JobStatus.Started,
      error: "",
      query_result_id: null,
    });

    const useCase = new RunQueryUseCase(mockQueryRepository, mockJobRepository);
    const executePromise = useCase.execute({
      query_id: 1,
      max_age: 0,
      row_limit: 100,
      timeout_sec: 1,
    });

    await vi.runAllTimersAsync();
    const result = await executePromise;

    expect(result.kind).toBe("timeout");
    if (result.kind === "timeout") {
      expect(result.jobId).toBe("job-slow");
    }
  });

  it("throws SQL error when job fails", async () => {
    vi.mocked(mockQueryRepository.postQueryResults).mockResolvedValue({
      kind: "job",
      jobId: "job-fail",
    });
    vi.mocked(mockJobRepository.getJob).mockResolvedValue({
      id: "job-fail",
      status: JobStatus.Failed,
      error: "syntax error at or near SELECT",
      query_result_id: null,
    });

    const useCase = new RunQueryUseCase(mockQueryRepository, mockJobRepository);
    const executePromise = useCase.execute({
      query_id: 1,
      max_age: 0,
      row_limit: 100,
      timeout_sec: 60,
    });

    // Attach rejection handler before advancing timers to avoid unhandled rejection
    const expectation = expect(executePromise).rejects.toMatchObject({
      kind: RedashErrorKind.Sql,
      message: "syntax error at or near SELECT",
    });

    await vi.runAllTimersAsync();
    await expectation;
  });
});

/** Unit tests for {@link GetQueryUseCase}. */
import { describe, expect, it, vi } from "vitest";
import { GetQueryUseCase } from "../../../src/application/usecases/GetQueryUseCase.js";
import { RedashError, RedashErrorKind } from "../../../src/domain/errors/RedashError.js";
import type { IQueryRepository } from "../../../src/domain/repositories/IQueryRepository.js";

const mockRepository: IQueryRepository = {
  listQueries: vi.fn(),
  getQuery: vi.fn(),
  postQueryResults: vi.fn(),
  getQueryResult: vi.fn(),
};

const mockQuery = {
  id: 42,
  name: "Test Query",
  description: null,
  query: "SELECT 1",
  parameters: [],
  data_source_id: 1,
  tags: [],
  updated_at: "2026-01-01",
  user: { id: 1, name: "Alice" },
};

describe("GetQueryUseCase", () => {
  it("returns query from repository", async () => {
    vi.mocked(mockRepository.getQuery).mockResolvedValue(mockQuery);

    const useCase = new GetQueryUseCase(mockRepository);
    const result = await useCase.execute(42);

    expect(result).toEqual(mockQuery);
    expect(mockRepository.getQuery).toHaveBeenCalledWith(42);
  });

  it("throws NOT_FOUND for invalid query_id (zero)", async () => {
    const useCase = new GetQueryUseCase(mockRepository);

    await expect(useCase.execute(0)).rejects.toThrow(RedashError);
    await expect(useCase.execute(0)).rejects.toMatchObject({
      kind: RedashErrorKind.NotFound,
    });
  });

  it("throws NOT_FOUND for negative query_id", async () => {
    const useCase = new GetQueryUseCase(mockRepository);

    await expect(useCase.execute(-1)).rejects.toMatchObject({
      kind: RedashErrorKind.NotFound,
    });
  });

  it("propagates repository errors", async () => {
    vi.mocked(mockRepository.getQuery).mockRejectedValue(
      new RedashError(RedashErrorKind.NotFound, "Query not found"),
    );

    const useCase = new GetQueryUseCase(mockRepository);

    await expect(useCase.execute(999)).rejects.toMatchObject({
      kind: RedashErrorKind.NotFound,
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { ListQueriesUseCase } from "../../../src/application/usecases/ListQueriesUseCase.js";
import type { IQueryRepository } from "../../../src/domain/repositories/IQueryRepository.js";

const mockRepository: IQueryRepository = {
  listQueries: vi.fn(),
  getQuery: vi.fn(),
  postQueryResults: vi.fn(),
  getQueryResult: vi.fn(),
};

describe("ListQueriesUseCase", () => {
  it("applies default page and page_size when not provided", async () => {
    vi.mocked(mockRepository.listQueries).mockResolvedValue({
      results: [],
      count: 0,
      page: 1,
      page_size: 25,
    });

    const useCase = new ListQueriesUseCase(mockRepository);
    await useCase.execute({});

    expect(mockRepository.listQueries).toHaveBeenCalledWith({
      page: 1,
      page_size: 25,
      search: undefined,
    });
  });

  it("passes search term when provided", async () => {
    vi.mocked(mockRepository.listQueries).mockResolvedValue({
      results: [],
      count: 0,
      page: 1,
      page_size: 25,
    });

    const useCase = new ListQueriesUseCase(mockRepository);
    await useCase.execute({ search: "sales", page: 2, page_size: 10 });

    expect(mockRepository.listQueries).toHaveBeenCalledWith({
      search: "sales",
      page: 2,
      page_size: 10,
    });
  });

  it("returns results from repository", async () => {
    const mockResult = {
      results: [{ id: 1, name: "My Query", tags: ["tag1"], updated_at: "2026-01-01" }],
      count: 1,
      page: 1,
      page_size: 25,
    };
    vi.mocked(mockRepository.listQueries).mockResolvedValue(mockResult);

    const useCase = new ListQueriesUseCase(mockRepository);
    const result = await useCase.execute({});

    expect(result).toEqual(mockResult);
  });
});

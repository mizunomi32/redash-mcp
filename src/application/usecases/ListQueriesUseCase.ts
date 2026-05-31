import type { ListQueriesOptions, ListQueriesResult } from "../../domain/entities/Query.js";
import type { IQueryRepository } from "../../domain/repositories/IQueryRepository.js";

export class ListQueriesUseCase {
  constructor(private readonly queryRepository: IQueryRepository) {}

  async execute(options: Partial<ListQueriesOptions>): Promise<ListQueriesResult> {
    const normalized: ListQueriesOptions = {
      page: options.page ?? 1,
      page_size: options.page_size ?? 25,
      search: options.search,
    };
    return this.queryRepository.listQueries(normalized);
  }
}

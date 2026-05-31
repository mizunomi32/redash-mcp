import type { ListQueriesOptions, ListQueriesResult } from "../../domain/entities/Query.js";
import type { IQueryRepository } from "../../domain/repositories/IQueryRepository.js";

/**
 * Application use case: list and optionally search Redash queries with pagination.
 *
 * Applies default values for `page` (1) and `page_size` (25) so that callers
 * can omit those fields and still receive a valid response.
 */
export class ListQueriesUseCase {
  /** @param queryRepository - Repository used to retrieve paginated query lists. */
  constructor(private readonly queryRepository: IQueryRepository) {}

  /**
   * Returns a paginated list of query summaries.
   *
   * @param options - Partial options; `page` defaults to `1` and `page_size` to `25`.
   * @returns Paginated result containing query summaries and total count.
   * @throws {RedashError} propagated from the repository on HTTP or network errors.
   */
  async execute(options: Partial<ListQueriesOptions>): Promise<ListQueriesResult> {
    const normalized: ListQueriesOptions = {
      page: options.page ?? 1,
      page_size: options.page_size ?? 25,
      search: options.search,
    };
    return this.queryRepository.listQueries(normalized);
  }
}

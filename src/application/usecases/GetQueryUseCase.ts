import type { Query } from "../../domain/entities/Query.js";
import { RedashError, RedashErrorKind } from "../../domain/errors/RedashError.js";
import type { IQueryRepository } from "../../domain/repositories/IQueryRepository.js";

/**
 * Application use case: fetch the full definition of a single Redash query.
 *
 * Validates the query ID before delegating to the repository, so that
 * callers receive a typed `RedashError` rather than a raw HTTP 400/404
 * from the API.
 */
export class GetQueryUseCase {
  /** @param queryRepository - Repository used to retrieve query definitions. */
  constructor(private readonly queryRepository: IQueryRepository) {}

  /**
   * Returns the full query definition including SQL body and parameter schema.
   *
   * @param queryId - Positive integer ID of the query.
   * @returns The query definition.
   * @throws {RedashError} with kind `NotFound` when `queryId` is not a positive integer.
   * @throws {RedashError} propagated from the repository on HTTP or network errors.
   */
  async execute(queryId: number): Promise<Query> {
    if (!Number.isInteger(queryId) || queryId <= 0) {
      throw new RedashError(RedashErrorKind.NotFound, `Invalid query_id: ${queryId}`);
    }
    return this.queryRepository.getQuery(queryId);
  }
}

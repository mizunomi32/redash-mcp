import type { ListQueriesOptions, ListQueriesResult, Query } from "../entities/Query.js";
import type { QueryResultData } from "../entities/QueryResult.js";

/**
 * Discriminated union for the two response shapes from Redash's
 * `POST /api/queries/:id/results` endpoint.
 *
 * - `immediate` — the result was served from cache and is ready now.
 * - `job` — execution was queued; the caller must poll the job.
 */
export type QueryResultsResponse =
  | { kind: "immediate"; data: QueryResultData }
  | { kind: "job"; jobId: string };

/**
 * Port (secondary port in hexagonal architecture) for all query-related
 * Redash operations.  The infrastructure layer provides the concrete
 * implementation via the Redash REST API.
 */
export interface IQueryRepository {
  /**
   * Returns a paginated list of query summaries, optionally filtered by a
   * search term.
   *
   * @param options - Pagination and search parameters.
   */
  listQueries(options: ListQueriesOptions): Promise<ListQueriesResult>;

  /**
   * Fetches the full definition of a single query including its SQL body and
   * parameter schema.
   *
   * @param queryId - Numeric ID of the query.
   */
  getQuery(queryId: number): Promise<Query>;

  /**
   * Submits a query for execution.  Redash may return the result immediately
   * from cache (`kind: "immediate"`) or queue an async job (`kind: "job"`).
   *
   * @param queryId - Numeric ID of the query to execute.
   * @param options - Execution parameters and cache-age control.
   */
  postQueryResults(
    queryId: number,
    options: { parameters?: Record<string, unknown>; max_age: number },
  ): Promise<QueryResultsResponse>;

  /**
   * Fetches a stored query result by its result ID (obtained from a completed
   * job or a cached-hit response).
   *
   * @param queryResultId - Numeric ID of the stored result.
   */
  getQueryResult(queryResultId: number): Promise<QueryResultData>;
}

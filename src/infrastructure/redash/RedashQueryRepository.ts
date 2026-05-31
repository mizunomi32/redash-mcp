import type { ListQueriesOptions, ListQueriesResult, Query } from "../../domain/entities/Query.js";
import type { QueryResultData } from "../../domain/entities/QueryResult.js";
import type {
  IQueryRepository,
  QueryResultsResponse,
} from "../../domain/repositories/IQueryRepository.js";
import type { RedashHttpClient } from "./RedashHttpClient.js";
import type {
  RedashApiQuery,
  RedashApiQueryListResponse,
  RedashApiQueryResult,
  RedashApiResultsResponse,
} from "./types/redashApiTypes.js";

/**
 * Concrete implementation of `IQueryRepository` backed by the Redash Queries
 * and Query Results APIs.
 *
 * Translates between the raw Redash API response shapes (defined in
 * `redashApiTypes.ts`) and the domain entity types used by the application
 * layer, keeping the domain model free of Redash-specific field names.
 */
export class RedashQueryRepository implements IQueryRepository {
  /** @param client - Configured HTTP client for Redash API calls. */
  constructor(private readonly client: RedashHttpClient) {}

  /**
   * Lists queries from `GET /api/queries` with optional full-text search and
   * pagination.
   *
   * @param options - Page number, page size, and optional search term.
   * @returns Paginated list of query summaries.
   */
  async listQueries(options: ListQueriesOptions): Promise<ListQueriesResult> {
    const params = new URLSearchParams({
      page: String(options.page),
      page_size: String(options.page_size),
    });
    if (options.search) {
      params.set("q", options.search);
    }

    const response = await this.client.get<RedashApiQueryListResponse>(
      `/api/queries?${params.toString()}`,
    );

    return {
      results: response.results.map((q) => ({
        id: q.id,
        name: q.name,
        tags: q.tags,
        updated_at: q.updated_at,
      })),
      count: response.count,
      page: response.page,
      page_size: response.page_size,
    };
  }

  /**
   * Fetches a single query definition from `GET /api/queries/:id`.
   *
   * @param queryId - Numeric ID of the query.
   * @returns Full query entity including SQL body and parameter schema.
   */
  async getQuery(queryId: number): Promise<Query> {
    const q = await this.client.get<RedashApiQuery>(`/api/queries/${queryId}`);

    return {
      id: q.id,
      name: q.name,
      description: q.description,
      query: q.query,
      parameters: q.options.parameters ?? [],
      data_source_id: q.data_source_id,
      tags: q.tags,
      updated_at: q.updated_at,
      user: { id: q.user.id, name: q.user.name },
    };
  }

  /**
   * Submits a query for execution via `POST /api/queries/:id/results`.
   *
   * Redash either returns the result immediately (cache hit) or a job ID for
   * async polling.  The return value is normalised into a `QueryResultsResponse`
   * discriminated union so the caller does not need to inspect the raw shape.
   *
   * @param queryId - Numeric ID of the query to execute.
   * @param options - Runtime parameters and `max_age` cache threshold.
   * @returns Either an immediate result or a job ID for polling.
   * @throws {Error} when Redash returns neither a `query_result` nor a `job`.
   */
  async postQueryResults(
    queryId: number,
    options: { parameters?: Record<string, unknown>; max_age: number },
  ): Promise<QueryResultsResponse> {
    const response = await this.client.post<RedashApiResultsResponse>(
      `/api/queries/${queryId}/results`,
      { parameters: options.parameters ?? {}, max_age: options.max_age },
    );

    if (response.query_result) {
      return {
        kind: "immediate",
        data: {
          columns: response.query_result.data.columns,
          rows: response.query_result.data.rows,
        },
      };
    }

    if (response.job) {
      return { kind: "job", jobId: response.job.id };
    }

    throw new Error("Unexpected response from Redash results endpoint");
  }

  /**
   * Fetches a stored query result from `GET /api/query_results/:id`.
   *
   * @param queryResultId - Numeric ID of the stored result (from a completed job).
   * @returns Raw columnar data containing columns and rows.
   */
  async getQueryResult(queryResultId: number): Promise<QueryResultData> {
    const response = await this.client.get<RedashApiQueryResult>(
      `/api/query_results/${queryResultId}`,
    );

    return {
      columns: response.query_result.data.columns,
      rows: response.query_result.data.rows,
    };
  }
}

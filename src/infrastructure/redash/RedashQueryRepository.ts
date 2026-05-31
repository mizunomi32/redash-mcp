import type { IQueryRepository, QueryResultsResponse } from "../../domain/repositories/IQueryRepository.js";
import type { ListQueriesOptions, ListQueriesResult, Query } from "../../domain/entities/Query.js";
import type { QueryResultData } from "../../domain/entities/QueryResult.js";
import type { RedashHttpClient } from "./RedashHttpClient.js";
import type {
  RedashApiQueryListResponse,
  RedashApiQuery,
  RedashApiResultsResponse,
  RedashApiQueryResult,
} from "./types/redashApiTypes.js";

export class RedashQueryRepository implements IQueryRepository {
  constructor(private readonly client: RedashHttpClient) {}

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

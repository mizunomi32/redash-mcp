import type { ListQueriesOptions, ListQueriesResult, Query } from "../entities/Query.js";
import type { QueryResultData } from "../entities/QueryResult.js";

export interface IQueryRepository {
  listQueries(options: ListQueriesOptions): Promise<ListQueriesResult>;
  getQuery(queryId: number): Promise<Query>;
  postQueryResults(
    queryId: number,
    options: { parameters?: Record<string, unknown>; max_age: number },
  ): Promise<QueryResultsResponse>;
  getQueryResult(queryResultId: number): Promise<QueryResultData>;
}

export type QueryResultsResponse =
  | { kind: "immediate"; data: QueryResultData }
  | { kind: "job"; jobId: string };

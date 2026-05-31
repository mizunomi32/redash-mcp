export interface RedashApiQuery {
  id: number;
  name: string;
  query: string;
  description: string | null;
  options: { parameters: RedashApiQueryParameter[] };
  data_source_id: number;
  tags: string[];
  updated_at: string;
  user: { id: number; name: string };
}

export interface RedashApiQueryParameter {
  name: string;
  title: string;
  type: string;
  value?: unknown;
  enumOptions?: string;
}

export interface RedashApiQueryListResponse {
  results: RedashApiQuery[];
  count: number;
  page: number;
  page_size: number;
}

export interface RedashApiJob {
  id: string;
  status: number;
  error: string;
  query_result_id: number | null;
  result: unknown;
}

export interface RedashApiJobResponse {
  job: RedashApiJob;
}

export interface RedashApiColumn {
  name: string;
  friendly_name: string;
  type: string;
}

export interface RedashApiQueryResultData {
  columns: RedashApiColumn[];
  rows: Record<string, unknown>[];
}

export interface RedashApiQueryResult {
  query_result: {
    data: RedashApiQueryResultData;
    retrieved_at: string;
  };
}

export interface RedashApiResultsResponse {
  query_result?: RedashApiQueryResult["query_result"];
  job?: RedashApiJob;
}

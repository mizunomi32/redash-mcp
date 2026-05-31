export interface QueryParameter {
  name: string;
  title: string;
  type: string;
  value?: unknown;
  enumOptions?: string;
}

export interface QueryListItem {
  id: number;
  name: string;
  tags: string[];
  updated_at: string;
}

export interface Query {
  id: number;
  name: string;
  description: string | null;
  query: string;
  parameters: QueryParameter[];
  data_source_id: number;
  tags: string[];
  updated_at: string;
  user: { id: number; name: string };
}

export interface ListQueriesOptions {
  search?: string;
  page: number;
  page_size: number;
}

export interface ListQueriesResult {
  results: QueryListItem[];
  count: number;
  page: number;
  page_size: number;
}

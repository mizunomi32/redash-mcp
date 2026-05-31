import { z } from "zod";
import type { ListQueriesUseCase } from "../../../application/usecases/ListQueriesUseCase.js";
import { formatToolError } from "../toolError.js";

export const listQueriesSchema = {
  search: z.string().optional().describe("Search term to filter queries by name or tags"),
  page: z.number().int().positive().default(1).describe("Page number (1-based)"),
  page_size: z.number().int().positive().max(100).default(25).describe("Results per page"),
};

export type ListQueriesInput = {
  search?: string;
  page: number;
  page_size: number;
};

export function createListQueriesHandler(useCase: ListQueriesUseCase) {
  return async (input: ListQueriesInput) => {
    try {
      const result = await useCase.execute(input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatToolError(error);
    }
  };
}

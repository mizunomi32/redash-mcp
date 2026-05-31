import { z } from "zod";
import type { GetQueryUseCase } from "../../../application/usecases/GetQueryUseCase.js";
import { formatToolError } from "../toolError.js";

export const getQuerySchema = {
  query_id: z.number().int().positive().describe("Numeric ID of the Redash query"),
};

export type GetQueryInput = {
  query_id: number;
};

export function createGetQueryHandler(useCase: GetQueryUseCase) {
  return async (input: GetQueryInput) => {
    try {
      const result = await useCase.execute(input.query_id);
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

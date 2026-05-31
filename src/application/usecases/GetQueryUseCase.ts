import type { Query } from "../../domain/entities/Query.js";
import { RedashError, RedashErrorKind } from "../../domain/errors/RedashError.js";
import type { IQueryRepository } from "../../domain/repositories/IQueryRepository.js";

export class GetQueryUseCase {
  constructor(private readonly queryRepository: IQueryRepository) {}

  async execute(queryId: number): Promise<Query> {
    if (!Number.isInteger(queryId) || queryId <= 0) {
      throw new RedashError(RedashErrorKind.NotFound, `Invalid query_id: ${queryId}`);
    }
    return this.queryRepository.getQuery(queryId);
  }
}

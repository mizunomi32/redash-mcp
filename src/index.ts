import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/Config.js";
import { RedashHttpClient } from "./infrastructure/redash/RedashHttpClient.js";
import { RedashQueryRepository } from "./infrastructure/redash/RedashQueryRepository.js";
import { RedashJobRepository } from "./infrastructure/redash/RedashJobRepository.js";
import { ListQueriesUseCase } from "./application/usecases/ListQueriesUseCase.js";
import { GetQueryUseCase } from "./application/usecases/GetQueryUseCase.js";
import { RunQueryUseCase } from "./application/usecases/RunQueryUseCase.js";
import { createMcpServer } from "./interface/mcp/McpServer.js";
import { RedashError } from "./domain/errors/RedashError.js";

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    const message =
      error instanceof RedashError
        ? `Configuration error: ${error.message}`
        : `Startup error: ${error}`;
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }

  // Dependency injection (composition root)
  const httpClient = new RedashHttpClient(config);
  const queryRepository = new RedashQueryRepository(httpClient);
  const jobRepository = new RedashJobRepository(httpClient);

  const listQueriesUseCase = new ListQueriesUseCase(queryRepository);
  const getQueryUseCase = new GetQueryUseCase(queryRepository);
  const runQueryUseCase = new RunQueryUseCase(queryRepository, jobRepository);

  const server = createMcpServer(listQueriesUseCase, getQueryUseCase, runQueryUseCase);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  process.stderr.write("redash-mcp server running on stdio\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});

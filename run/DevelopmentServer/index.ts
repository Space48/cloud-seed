import { BaseConfig } from "../../utils/rootConfig";
import { RuntimeConfig } from "../../utils/runtimeConfig";
import GcpServer from "./GcpServer";
import { DevelopmentServer } from "./types";

export function getDevelopmentServer(
  projectConfig: BaseConfig,
  functionConfig: RuntimeConfig,
  compiledFile: string,
  port: number,
  environment: string,
): DevelopmentServer {
  switch (functionConfig.cloud) {
    case "gcp":
      return new GcpServer(projectConfig, functionConfig, compiledFile, port, environment);
    default:
      throw new Error(
        `The development server does not support running functions using the "${functionConfig.cloud}" cloud at this time.`,
      );
  }
}

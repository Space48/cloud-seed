import { ChildProcess, spawn } from "node:child_process";
import { BaseConfig } from "../../utils/rootConfig";
import { RuntimeConfig } from "../../utils/runtimeConfig";
import { DevelopmentServer } from "./types";

export default class GcpServer implements DevelopmentServer {
  private sourceFile: string;
  private signatureType: string;
  private port: string;
  private environmentVariables: { [key: string]: string | undefined } = {};

  private serverProcess: ChildProcess | undefined;

  constructor(
    projectConfig: BaseConfig,
    functionConfig: RuntimeConfig,
    compiledFile: string,
    port: number,
    environment: string,
  ) {
    this.sourceFile = compiledFile;
    this.signatureType = getFunctionSignatureType(functionConfig);
    this.port = port.toString();
    this.environmentVariables = getFunctionEnvironmentVariables(projectConfig, environment);
  }

  public up() {
    if (this.serverProcess === undefined) {
      this.startServerProcess();
    } else {
      this.serverProcess.on("exit", () => {
        setTimeout(this.startServerProcess.bind(this), 500);
      });
      this.serverProcess.kill("SIGINT");
    }
  }

  public down() {
    if (this.serverProcess !== undefined) {
      this.serverProcess.on("exit", () => {
        this.serverProcess = undefined;
      });
      this.serverProcess.kill("SIGINT");
    }
  }

  public isRunning() {
    return this.serverProcess !== undefined;
  }

  private startServerProcess() {
    this.serverProcess = spawn(
      "npx",
      [
        "-y",
        "@google-cloud/functions-framework",
        "--source",
        this.sourceFile,
        "--target",
        "default",
        "--signature-type",
        this.signatureType,
        "--port",
        this.port,
      ],
      {
        env: this.environmentVariables,
        stdio: "inherit",
      },
    );
  }
}

function getFunctionSignatureType(functionConfig: RuntimeConfig): "http" | "event" | "cloudevent" {
  switch (functionConfig.type) {
    case "event":
    case "schedule":
    case "firestore":
    case "storage":
      return "cloudevent";
    default:
      return "http";
  }
}

function getFunctionEnvironmentVariables(projectConfig: BaseConfig, environment: string) {
  return {
    CLOUD_SEED_ENVIRONMENT: environment,
    CLOUD_SEED_PROJECT: projectConfig.cloud.gcp.project,
    CLOUD_SEED_REGION: projectConfig.cloud.gcp.region,
    ...projectConfig.runtimeEnvironmentVariables,
    ...process.env,
  };
}

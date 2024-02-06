import { GcsBackendConfig, LocalBackendConfig, S3BackendConfig } from "cdktf";
import { BuildOptions } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { DeepPartial } from "./types";

export function getRootConfig(rootDir: string): DeepPartial<RootConfig> {
  const rootConfPath = resolve(join(rootDir, "cloudseed.json"));
  const rootConf = existsSync(rootConfPath) ? readFileSync(rootConfPath) : null;
  if (rootConf === null) {
    return {};
  }
  return JSON.parse(rootConf.toString("utf8"));
}

export interface BaseConfig {
  cloud: {
    gcp: {
      project: string;
      region: string;
      sourceCodeStorage?: {
        bucket?: {
          name: string;
        };
      };
    };
  };
  tfConfig: {
    backend?:
      | {
          type: "gcs";
          backendOptions: GcsBackendConfig;
        }
      | {
          type: "local";
          backendOptions: LocalBackendConfig;
        }
      | {
          type: "s3";
          backendOptions: S3BackendConfig;
        };
  };
  buildConfig: {
    dir: string;
    outDir: string;
    esbuildOptions?: BuildOptions;
  };
  runtimeEnvironmentVariables?: {
    [key: string]: string;
  };
  secretVariableNames?: string[];
}

export interface RootConfig {
  default?: BaseConfig;
  environmentOverrides?: {
    [key: string]: Partial<BaseConfig>;
  };
}

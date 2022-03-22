import { GcsBackendProps, LocalBackendProps, S3BackendProps } from "cdktf";
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
    };
  };
  tfConfig: {
    backend?:
      | {
          type: "gcs";
          backendOptions: GcsBackendProps;
        }
      | {
          type: "local";
          backendOptions: LocalBackendProps;
        }
      | {
          type: "s3";
          backendOptions: S3BackendProps;
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
  envOverrides?: {
    [key: string]: Partial<BaseConfig>;
  };
}

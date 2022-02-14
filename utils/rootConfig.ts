import { GcsBackendProps } from "cdktf";
import { BuildOptions } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

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
    backend: {
      type: "gcs" | "local";
      backendOptions?: Partial<GcsBackendProps>;
    };
  };
  buildConfig: {
    dir: string;
    outDir: string;
    esbuildOptions?: Partial<BuildOptions>;
  };
  envVars?: Record<string, string>;
  secretNames?: string[];
}

export interface RootConfig {
  default: BaseConfig;
  envOverrides?: Record<string, BaseConfig>;
}

export type DeepPartial<T> = T extends Record<string, any>
  ? {
      [K in keyof T]?: DeepPartial<T[K]>;
    }
  : T;

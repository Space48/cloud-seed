import { GcsBackendProps } from "cdktf";
import { BuildOptions } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function getRootConfig(location: string): DeepPartial<RootConfig> {
  const rootConfPath = join(location, "cloudseed.json");
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
      type: string;
      backendOptions?: DeepPartial<GcsBackendProps>;
    };
  };
  buildConfig: {
    dir: string;
    outDir: string;
    esbuildOptions?: DeepPartial<BuildOptions>;
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

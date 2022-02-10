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
      backend: string;
    };
  };
  envVars?: Record<string, string>;
  secretNames?: string[];
  buildConfig: {
    dir: string;
    outDir: string;
    tsconfig?: string;
  };
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

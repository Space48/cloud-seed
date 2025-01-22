import { GcsBackendConfig, LocalBackendConfig, S3BackendConfig } from "cdktf";
import { BuildOptions } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { DeepPartial } from "./types";

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

export interface CliOptions {
  srcDir?: string;
  outDir?: string;
  environment: string;
}

export function getRootConfig(workingDirectory: string, cliOptions: CliOptions): BaseConfig {
  const rootConfig = discoverRootConfig(workingDirectory);

  return parseConfig(rootConfig, cliOptions);
}

function discoverRootConfig(startingDirectory: string): DeepPartial<RootConfig> {
  let previousDirectory: string | undefined;
  let currentDirectory = startingDirectory;

  while (currentDirectory !== previousDirectory) {
    const configPath = resolve(join(currentDirectory, "cloudseed.json"));

    if (existsSync(configPath)) {
      const config = readFileSync(configPath) ?? undefined;

      try {
        return config !== undefined ? JSON.parse(config.toString("utf-8")) : {};
      } catch {
        return {};
      }
    }

    previousDirectory = currentDirectory;
    currentDirectory = dirname(currentDirectory);
  }

  return {};
}

function parseConfig(rootConfig: DeepPartial<RootConfig>, cliOptions: CliOptions): BaseConfig {
  const environmentConfig = rootConfig.environmentOverrides?.[cliOptions.environment] ?? undefined;
  const defaultConfig = rootConfig.default;

  const sourceDirectory = resolve(
    cliOptions.srcDir ??
      environmentConfig?.buildConfig?.dir ??
      defaultConfig?.buildConfig?.dir ??
      "src",
  );

  const outputDirectory = resolve(
    cliOptions.outDir ??
      environmentConfig?.buildConfig?.outDir ??
      defaultConfig?.buildConfig?.outDir ??
      ".build",
  );

  return {
    cloud: {
      gcp: {
        project: environmentConfig?.cloud?.gcp?.project ?? defaultConfig?.cloud?.gcp?.project ?? "",
        region:
          environmentConfig?.cloud?.gcp?.region ??
          defaultConfig?.cloud?.gcp?.region ??
          "europe-west2",
        sourceCodeStorage: {
          bucket: {
            name:
              environmentConfig?.cloud?.gcp?.sourceCodeStorage?.bucket?.name ??
              defaultConfig?.cloud?.gcp?.sourceCodeStorage?.bucket?.name ??
              "",
          },
        },
      },
    },
    tfConfig: {
      backend: ((environmentConfig?.tfConfig?.backend ??
        defaultConfig?.tfConfig?.backend) as BaseConfig["tfConfig"]["backend"]) ?? {
        type: "local",
        backendOptions: { path: outputDirectory },
      },
    },
    buildConfig: {
      dir: sourceDirectory,
      outDir: outputDirectory,
      esbuildOptions: (environmentConfig?.buildConfig?.esbuildOptions ??
        defaultConfig?.buildConfig?.esbuildOptions) as BuildOptions | undefined,
    },
    runtimeEnvironmentVariables: Object.fromEntries(
      Object.entries(
        environmentConfig?.runtimeEnvironmentVariables ??
          defaultConfig?.runtimeEnvironmentVariables ??
          {},
      )
        .map(([key, value]) => [key, typeof value === "string" ? value : ""])
        .filter(([, value]) => value.length),
    ),
    secretVariableNames: (
      environmentConfig?.secretVariableNames ?? defaultConfig?.secretVariableNames
    )?.filter((name): name is string => typeof name === "string"),
  };
}

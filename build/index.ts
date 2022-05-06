import { resolve } from "path";
import { mkdirSync } from "fs";
import { App, GcsBackend, LocalBackend, S3Backend } from "cdktf";
import GcpStack from "../stacks/gcp/GcpStack";
import bundle from "./esbuild/bundle";
import { BaseConfig, getRootConfig, RootConfig } from "../utils/rootConfig";
import { BuildOptions } from "esbuild";
import { DeepPartial } from "../utils/types";

export type BuildOpts = {
  rootDir: string;
  srcDir: string;
  outDir: string;
  debug: boolean;
  environment: string;
};

export default (buildOpts: Partial<BuildOpts>): { config: BaseConfig; app: App } => {
  const rootConfig = getRootConfig(buildOpts.rootDir || ".");

  const options = mergeConfig(rootConfig, buildOpts);

  const buildDir = resolve(options.buildConfig.dir);
  const buildOutDir = resolve(options.buildConfig.outDir);

  mkdirSync(buildOutDir, { recursive: true });

  // Run bundler.
  bundle(buildDir, buildOutDir, options.buildConfig.esbuildOptions);

  // Generate stacks.
  const app = new App({ outdir: options.buildConfig.outDir });

  const stack = new GcpStack(app, options.cloud.gcp.project, {
    outDir: buildOutDir,
    environment: buildOpts.environment || "dev",
    gcpOptions: options.cloud.gcp,
    envVars: options.runtimeEnvironmentVariables,
    secretNames: options.secretVariableNames,
  });

  switch (options.tfConfig.backend?.type) {
    case "gcs":
      new GcsBackend(stack, options.tfConfig.backend.backendOptions);
      break;
    case "s3":
      new S3Backend(stack, options.tfConfig.backend.backendOptions);
      break;
    case "local":
      new LocalBackend(stack, options.tfConfig.backend.backendOptions);
      break;
    default:
      new LocalBackend(stack, { path: buildOutDir });
      break;
  }

  app.synth();

  return { config: options, app };
};

function mergeConfig(rootOpts: DeepPartial<RootConfig>, cmdOpts: Partial<BuildOpts>): BaseConfig {
  const envSpecificRoot =
    cmdOpts.environment &&
    rootOpts.environmentOverrides &&
    rootOpts.environmentOverrides[cmdOpts.environment]
      ? rootOpts.environmentOverrides[cmdOpts.environment]
      : undefined;
  const defaultRoot = rootOpts.default;
  const dir = resolve(
    cmdOpts.srcDir ?? envSpecificRoot?.buildConfig?.dir ?? defaultRoot?.buildConfig?.dir ?? "src",
  );
  const outDir = resolve(
    cmdOpts.outDir ??
      envSpecificRoot?.buildConfig?.outDir ??
      defaultRoot?.buildConfig?.outDir ??
      ".build",
  );

  return {
    cloud: {
      gcp: {
        project: envSpecificRoot?.cloud?.gcp?.project ?? defaultRoot?.cloud?.gcp?.project ?? "",
        region:
          envSpecificRoot?.cloud?.gcp?.region ?? defaultRoot?.cloud?.gcp?.region ?? "europe-west2",
        sourceCodeStorage: {
          bucket: {
            name:
              envSpecificRoot?.cloud?.gcp?.sourceCodeStorage?.bucket?.name ??
              defaultRoot?.cloud?.gcp?.sourceCodeStorage?.bucket?.name ??
              "",
          },
        },
      },
    },
    tfConfig: {
      backend: ((envSpecificRoot?.tfConfig?.backend ??
        defaultRoot?.tfConfig?.backend) as BaseConfig["tfConfig"]["backend"]) ?? {
        type: "local",
        backendOptions: { path: outDir },
      },
    },
    buildConfig: {
      dir,
      outDir,
      esbuildOptions: (envSpecificRoot?.buildConfig?.esbuildOptions ??
        defaultRoot?.buildConfig?.esbuildOptions) as BuildOptions | undefined,
    },
    runtimeEnvironmentVariables: Object.fromEntries(
      Object.entries(
        envSpecificRoot?.runtimeEnvironmentVariables ??
          defaultRoot?.runtimeEnvironmentVariables ??
          {},
      )
        .map(([key, value]) => [key, typeof value === "string" ? value : ""])
        .filter(([, value]) => value.length),
    ),
    secretVariableNames: (
      envSpecificRoot?.secretVariableNames ?? defaultRoot?.secretVariableNames
    )?.filter((name): name is string => typeof name === "string"),
  };
}

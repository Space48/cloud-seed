import { resolve } from "path";
import { existsSync, mkdirSync, rmdirSync } from "fs";
import { App, GcsBackend, GcsBackendProps, LocalBackend } from "cdktf";
import GcpStack from "../stacks/gcp/GcpStack";
import bundle from "./esbuild/bundle";
import { BaseConfig, DeepPartial, getRootConfig, RootConfig } from "../utils/rootConfig";
import { BuildOptions } from "esbuild";

export type BuildOpts = {
  rootDir: string;
  srcDir: string;
  outDir: string;
  debug: boolean;
  environment: string;
};

export default (buildOpts: Partial<BuildOpts>) => {
  const rootConfig = getRootConfig(buildOpts.rootDir ?? ".");

  const options = mergeConfig(rootConfig, buildOpts);

  const buildDir = resolve(options.buildConfig.dir);
  const buildOutDir = resolve(options.buildConfig.outDir);

  if (existsSync(buildOutDir)) {
    rmdirSync(buildOutDir, { recursive: true });
  }
  mkdirSync(buildOutDir, { recursive: true });

  // Run bundler.
  bundle(buildDir, buildOutDir, options.buildConfig.esbuildOptions);

  // Generate stacks.
  const app = new App({ outdir: options.buildConfig.outDir });

  const stack = new GcpStack(app, options.cloud.gcp.project, {
    outDir: buildOutDir,
    environment: buildOpts.environment ?? "dev",
    project: options.cloud.gcp.project,
    region: options.cloud.gcp.region,
    envVars: options.envVars,
    secretNames: options.secretNames,
  });

  // If bucket is defined,
  // then configure the remote backend where state will be stored,
  // else use a local backend.
  options.tfConfig.backend.type.toLowerCase() === "gcs"
    ? new GcsBackend(stack, {
        bucket: options.tfConfig.backend.backendOptions?.bucket!,
        ...options.tfConfig.backend.backendOptions,
      })
    : new LocalBackend(stack, {
        path: buildOutDir,
      });

  app.synth();

  console.log("Success!");
};

function mergeConfig(rootOpts: DeepPartial<RootConfig>, cmdOpts: Partial<BuildOpts>): BaseConfig {
  const envSpecificRoot =
    cmdOpts.environment && rootOpts.envOverrides && rootOpts.envOverrides[cmdOpts.environment]
      ? rootOpts.envOverrides[cmdOpts.environment]
      : undefined;
  const defaultRoot = rootOpts.default;
  return {
    cloud: {
      gcp: {
        project: envSpecificRoot?.cloud?.gcp?.project ?? defaultRoot?.cloud?.gcp?.project ?? "",
        region:
          envSpecificRoot?.cloud?.gcp?.region ?? defaultRoot?.cloud?.gcp?.region ?? "europe-west2",
      },
    },
    tfConfig: {
      backend: {
        type:
          envSpecificRoot?.tfConfig?.backend?.type ??
          defaultRoot?.tfConfig?.backend?.type ??
          "local",
        backendOptions: (envSpecificRoot?.tfConfig?.backend?.backendOptions ??
          defaultRoot?.tfConfig?.backend?.backendOptions) as Partial<GcsBackendProps> | undefined,
      },
    },
    buildConfig: {
      dir:
        cmdOpts.srcDir ??
        envSpecificRoot?.buildConfig?.dir ??
        defaultRoot?.buildConfig?.dir ??
        "src",
      outDir:
        cmdOpts.outDir ??
        envSpecificRoot?.buildConfig?.outDir ??
        defaultRoot?.buildConfig?.outDir ??
        ".build",
      esbuildOptions: (envSpecificRoot?.buildConfig?.esbuildOptions ??
        defaultRoot?.buildConfig?.esbuildOptions) as Partial<BuildOptions> | undefined,
    },
    envVars: Object.fromEntries(
      Object.entries(envSpecificRoot?.envVars ?? defaultRoot?.envVars ?? {})
        .map(([key, value]) => [key, typeof value === "string" ? value : ""])
        .filter(([, value]) => value.length),
    ),
    secretNames: (envSpecificRoot?.secretNames ?? defaultRoot?.secretNames)?.filter(
      (name): name is string => typeof name === "string",
    ),
  };
}

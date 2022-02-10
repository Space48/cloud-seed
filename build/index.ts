import { join } from "path";
import { existsSync, mkdirSync, rmdirSync } from "fs";
import { App } from "cdktf";
import GcpStack from "../stacks/gcp/GcpStack";
import bundle from "./esbuild/bundle";
import { BaseConfig, DeepPartial, getRootConfig, RootConfig } from "../utils/rootConfig";

export type BuildOpts = {
  dir: string;
  outDir: string;
  project: string;
  region: string;
  debug: boolean;
  environment: string;
  backend?: string;
  tsconfig?: string;
};

export default (buildOpts: Partial<BuildOpts>) => {
  const rootConfig = getRootConfig(buildOpts.dir ?? ".");

  const options = mergeConfig(rootConfig, buildOpts);

  const functionsOutDir = join(options.buildConfig.outDir, "functions");

  if (existsSync(functionsOutDir)) {
    rmdirSync(functionsOutDir, { recursive: true });
  }
  mkdirSync(functionsOutDir, { recursive: true });

  // Run bundler.
  bundle(options.buildConfig.dir, options.buildConfig.outDir, options.buildConfig.tsconfig);

  // Generate stacks.
  const app = new App({ outdir: options.buildConfig.outDir });
  new GcpStack(app, options.cloud.gcp.project, {
    functionsDir: functionsOutDir,
    environment: buildOpts.environment ?? "dev",
    region: options.cloud.gcp.region,
    backendBucket: options.cloud.gcp.backend,
    envVars: options.envVars,
    secretNames: options.secretNames,
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
        project:
          cmdOpts.project ??
          envSpecificRoot?.cloud?.gcp?.project ??
          defaultRoot?.cloud?.gcp?.project ??
          "",
        region:
          cmdOpts.region ??
          envSpecificRoot?.cloud?.gcp?.region ??
          defaultRoot?.cloud?.gcp?.region ??
          "europe-west2",
        backend:
          cmdOpts.backend ??
          envSpecificRoot?.cloud?.gcp?.backend ??
          defaultRoot?.cloud?.gcp?.backend ??
          "",
      },
    },
    buildConfig: {
      dir: cmdOpts.dir ?? envSpecificRoot?.buildConfig?.dir ?? defaultRoot?.buildConfig?.dir ?? ".",
      outDir:
        cmdOpts.outDir ??
        envSpecificRoot?.buildConfig?.outDir ??
        defaultRoot?.buildConfig?.outDir ??
        ".build",
      tsconfig:
        cmdOpts.tsconfig ??
        envSpecificRoot?.buildConfig?.tsconfig ??
        defaultRoot?.buildConfig?.tsconfig,
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

import { BuildOptions } from "esbuild";
import { join } from "node:path";
import { RuntimeConfig } from "./runtimeConfig";

export function getEsbuildOptions(
  functionConfig: RuntimeConfig,
  outputDirectory: string,
  additionalOptions?: Partial<BuildOptions>,
): Partial<BuildOptions> {
  return {
    entryPoints: [functionConfig.file],
    absWorkingDir: process.cwd(), // We should probably infer the working directory from the cloudseed.json file
    format: "cjs",
    bundle: true,
    platform: "node",
    outfile: join(outputDirectory, `functions/${functionConfig.name}/index.js`),
    sourcemap: "both",
    ...additionalOptions,
  };
}

import { BuildOptions, buildSync } from "esbuild";
import { writeFileSync } from "fs";
import { sync } from "glob";
import { join } from "path";
import { getEsbuildOptions } from "../../utils/esbuild";
import { getRuntimeConfig, RuntimeConfig } from "../../utils/runtimeConfig";

const bundle = (
  dir: string,
  outDir: string,
  environment?: string,
  esbuildOptions?: Partial<BuildOptions>,
) => {
  const files = sync(join(dir, "**/*.ts"));

  const runtimeConfigs: RuntimeConfig[] = [];

  files.forEach(file => {
    const runtimeConfig = getRuntimeConfig(file, environment);

    if (runtimeConfig !== undefined) {
      runtimeConfigs.push(runtimeConfig);
    }
  });

  writeFileSync(join(outDir, "functions.json"), JSON.stringify(runtimeConfigs, null, 2));
  runtimeConfigs.forEach(config => {
    buildSync(getEsbuildOptions(config, outDir, esbuildOptions));
  });
};

export default bundle;

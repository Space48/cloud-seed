import { rollup } from "rollup";
import functionsGenerator from "./plugins/functionsGenerator";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import multiInput from "rollup-plugin-multi-input";
import generatePackageJson from "rollup-plugin-generate-package-json";
import path from "path";
import { promises as fsp } from "fs";
import generateFunctionsConfig from "./plugins/generateFunctionsConfig";

const bundle = async (buildDir = ".build") => {
  // The prebundle will compile typescript -> esnext -> commonjs.
  // additionally, the generateFunctionsConfig function will traverse the AST and detect all functions.
  const prebundle = await rollup({
    input: "src/**/*.ts",
    onwarn: (message) => {
      // @ts-ignore
      if (/external dependency/.test(message)) return;
      console.error(message);
    },
    plugins: [multiInput({}), typescript(), commonjs(), generateFunctionsConfig()],
  });
  await prebundle.write({
    exports: "named",
    dir: `${process.cwd()}/${buildDir}/compiled`,
    format: "cjs",
    sourcemap: true,
  });

  // Read generated functions configuration.
  const functionsFile = await fsp.readFile(`${buildDir}/compiled/functions.json`);
  const functions = JSON.parse(await functionsFile.toString());

  // Iterate over each function and run rollup again.
  for (const f in functions) {
    const func = functions[f];
    const funcPath = path.resolve("./src", func.functionPath.replace(".js", ".ts"));

    const functionRoller = await rollup({
      input: funcPath,
      onwarn: (message) => {
        // Ignore external dependency errors as they'll be in the package.json anyway.
        // @ts-ignore
        if (/external dependency/.test(message)) return;
        console.error(message);
      },
      plugins: [
        typescript(),
        commonjs(),
        // Creates unique package.json with external dependencies used in this function.
        generatePackageJson({
          additionalDependencies: { tslib: "^2.1.0" },
          baseContents: () => ({
            name: func.functionName,
            main: "index.js",
            dependencies: {},
            private: true,
          }),
        }),
      ],
    });

    await functionRoller.write({
      preserveModules: true,
      preserveModulesRoot: "src",
      format: "cjs",
      exports: "named",
      sourcemap: true,
      dir: `${buildDir}/functions/${func.functionName}`,
      plugins: [functionsGenerator(func)],
    });
  }
};
export default bundle;

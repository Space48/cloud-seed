import { walk } from "estree-walker";
import { Plugin } from "rollup";
import type { VariableDeclarator, Identifier, ObjectExpression } from "estree";
import astObjectMapper from "../astObjectMapper";
import { RuntimeConfig } from "../types";

export default function generateFunctionsConfig(): Plugin {
  const functions: RuntimeConfig[] = [];
  return {
    name: "functions-config-generator",
    moduleParsed(info) {
      const { ast, id } = info;
      let runtimeConfig: RuntimeConfig = {};
      if (!ast) {
        return;
      }
      walk(ast, {
        enter(node, parent) {
          if (node.type !== "ObjectExpression") {
            return;
          }

          if (
            node.type !== "ObjectExpression" ||
            parent.type !== "VariableDeclarator" ||
            ((parent as VariableDeclarator).id as Identifier).name !== "runtimeConfig"
          ) {
            return;
          }

          astObjectMapper(runtimeConfig)(node as ObjectExpression);
        },
      });

      if (Object.keys(runtimeConfig).length === 0) {
        return;
      }

      const functionPath = id.replace(process.cwd() + "/src/", "").replace(".ts", ".js");
      const functionName = runtimeConfig.name
        ? runtimeConfig.name
        : functionPath.replace(/\//g, "-").replace(".js", "");
      runtimeConfig = { functionPath, functionName, ...runtimeConfig };
      functions.push(runtimeConfig);
    },
    buildEnd() {
      this.emitFile({
        type: "asset",
        name: "functions.json",
        fileName: "functions.json",
        source: JSON.stringify(functions, null, 2),
      });
    },
  };
}

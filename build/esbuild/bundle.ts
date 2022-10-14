import ts from "typescript";
import { sync } from "glob";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { BuildOptions, buildSync } from "esbuild";
import { join, relative } from "path";
import { BaseConfig } from "../../utils/rootConfig";

const bundle = (
  dir: string,
  outDir: string,
  cloudConfig: BaseConfig["cloud"],
  esbuildOptions?: Partial<BuildOptions>,
) => {
  const files = [...sync(join(dir, "**/*.ts")), ...sync(join("webhooks", "**/*.ts"))];

  let runtimeConfig: any = null;
  const runtimeConfigs: any[] = [];

  files.forEach(file => {
    const fileContents = readFileSync(file);
    const sourceFile = ts.createSourceFile(
      "temp.ts",
      fileContents.toString(),
      ts.ScriptTarget.Latest,
    );

    runtimeConfig = detectRuntimeConfig(sourceFile);

    if (runtimeConfig !== null) {
      runtimeConfigs.push({
        file,
        name: generateFunctionName(file),
        ...runtimeConfig,
      });
    }
  });

  writeFileSync(join(outDir, "functions.json"), JSON.stringify(runtimeConfigs, null, 2));

  runtimeConfigs.forEach(config => {
    buildSync({
      entryPoints: [config.file],
      absWorkingDir: process.cwd(),
      format: "cjs",
      bundle: true,
      platform: "node",
      outfile: join(outDir, `functions/${config.name}/index.js`),
      sourcemap: "both",
      ...esbuildOptions,
    });
  });

  const bigcommerceWebhookScopes = runtimeConfigs
    .filter(config => config.type === "webhook" && config.webhook.type === "bigcommerce")
    .map(config => config.webhook.scope)
    .filter((scope, index, scopes) => scopes.indexOf(scope) === index);

  mkdirSync(join(outDir, "webhooks"));

  if (bigcommerceWebhookScopes.length)
    writeFileSync(
      join(outDir, "webhooks", "bigcommerceWebhooks.json"),
      JSON.stringify(
        {
          destinationUrl: getGCPFunctionUrl(
            cloudConfig.gcp,
            "bigcommerce",
            "//BIGCOMMERCE_WEBHOOK_PUBLISHER_FUNCTION//",
          ),
          scopes: bigcommerceWebhookScopes,
        },
        null,
        2,
      ),
    );
};
export default bundle;

function generateFunctionName(file: string) {
  return relative(process.cwd(), file)
    .replace(/(src|index|functions|function|\.ts)/g, "")
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/[\/_]/g, "-")
    .replace(/[-]{2,}/g, "-")
    .replace(/^[-]+/, "")
    .replace(/[-]+$/, "");
}

function detectRuntimeConfig(node: ts.Node) {
  let runtimeConfig = null;
  if (node.kind === ts.SyntaxKind.SourceFile) {
    const sourceFile = node as ts.SourceFile;
    sourceFile.statements.forEach(statement => {
      if (statement.kind !== ts.SyntaxKind.FirstStatement) {
        return;
      }
      const firstStatement = statement as ts.VariableStatement;
      firstStatement.declarationList.declarations.forEach(declaration => {
        if (declaration.name.kind !== ts.SyntaxKind.Identifier) {
          return;
        }
        if (declaration.name.escapedText === "runtimeConfig") {
          runtimeConfig = mapObjectLiteral(declaration.initializer as ts.ObjectLiteralExpression);
        }
      });
    });
  }

  return runtimeConfig;
}

function mapObjectLiteral(node: ts.ObjectLiteralExpression) {
  return node.properties.reduce((accumulator, currentValue) => {
    const res = readObjectNode(currentValue);
    return { ...accumulator, ...res };
  }, {});
}

function readObjectNode(node: ts.ObjectLiteralElement) {
  if (node.kind !== ts.SyntaxKind.PropertyAssignment) {
    return;
  }

  const mappedObject: any = {};
  const property = node as ts.PropertyAssignment;
  const propertyName = property.name as ts.Identifier;
  const idx = propertyName.escapedText.toString();
  mappedObject[idx] = mapNode(property.initializer);
  return mappedObject;
}

function mapNode(node: ts.Node): any {
  switch (node.kind) {
    case ts.SyntaxKind.NumericLiteral:
      return Number((node as ts.NumericLiteral).text);
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.StringLiteral:
      return (node as ts.StringLiteral).text;
    case ts.SyntaxKind.ObjectLiteralExpression:
      return mapObjectLiteral(node as ts.ObjectLiteralExpression);
    case ts.SyntaxKind.ArrayLiteralExpression:
      const array = node as ts.ArrayLiteralExpression;
      return array.elements.map(mapNode);
  }

  return "UNSUPPORTED";
}

function findFunctionFilePath(identifier: string) {
  const files = sync(join("webhooks", "**/*.ts"));
  let sourceFile = "";
  files.some(file => {
    const fileContentsBuffer = readFileSync(file);
    const [fileFirstLine] = fileContentsBuffer.toString().split(/\r?\n/);
    if (fileFirstLine === identifier) {
      return (sourceFile = file);
    }
  });
  return sourceFile;
}

function getGCPFunctionUrl(
  GcpConfig: BaseConfig["cloud"]["gcp"],
  type: "bigcommerce",
  functionIdentifier: string,
) {
  if (type === "bigcommerce")
    return `https://${GcpConfig.region}-${
      GcpConfig.project
    }.cloudfunctions.net/${generateFunctionName(findFunctionFilePath(functionIdentifier))}`;
}

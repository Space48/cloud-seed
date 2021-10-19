import ts from "typescript";
import { sync } from "glob";
import { readFileSync, writeFileSync } from "fs";
import * as esbuild from "esbuild";
import path from "path";

const bundle = (dir: string, outDir: string, tsconfig?: string) => {
  const files = sync(path.join(dir, "src/**/*.ts"));

  let runtimeConfig: any = null;
  const runtimeConfigs: any[] = [];

  files.forEach((file) => {
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

  writeFileSync(path.join(outDir, "functions.json"), JSON.stringify(runtimeConfigs, null, 2));
  runtimeConfigs.forEach((config) => {
    esbuild.buildSync({
      entryPoints: [config.file],
      absWorkingDir: process.cwd(),
      format: "cjs",
      bundle: true,
      platform: "node",
      outfile: path.join(outDir, `functions/${config.name}/index.js`),
      sourcemap: "both",
      tsconfig,
    });
  });
};
export default bundle;

function generateFunctionName(file: string) {
  return file
    .replace(/(src|index|functions|function|\.ts)/g, "")
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/[\/]{2,}/g, "/")
    .replace(/\//g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+/, "")
    .replace(/[-_]+$/, "");
}

function detectRuntimeConfig(node: ts.Node) {
  let runtimeConfig = null;
  if (node.kind === ts.SyntaxKind.SourceFile) {
    const sourceFile = node as ts.SourceFile;
    sourceFile.statements.forEach((statement) => {
      if (statement.kind !== ts.SyntaxKind.FirstStatement) {
        return;
      }
      const firstStatement = statement as ts.VariableStatement;
      firstStatement.declarationList.declarations.forEach((declaration) => {
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

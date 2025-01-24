import { readFileSync } from "node:fs";
import { relative } from "node:path";
import ts from "typescript";

export type RuntimeConfig = {
  file: string;
  name: string;
} & RuntimeConfigProperties;

type RuntimeConfigProperties = {
  [key: string]: RuntimeConfigValue | undefined;
};

type RuntimeConfigValue =
  | string
  | number
  | boolean
  | RuntimeConfigValue[]
  | { [key: string]: RuntimeConfigValue | undefined };

export function getRuntimeConfig(
  fileName: string,
  environment?: string,
): RuntimeConfig | undefined {
  let fileContents: ReturnType<typeof readFileSync>;
  try {
    fileContents = readFileSync(fileName);
  } catch {
    return undefined;
  }

  const sourceFile = ts.createSourceFile(
    "temp.ts",
    fileContents.toString(),
    ts.ScriptTarget.Latest,
  );

  const runtimeConfig = detectRuntimeConfig(sourceFile);

  if (runtimeConfig === undefined) return undefined;

  return {
    file: fileName,
    name: generateFunctionName(fileName),
    ...applyEnvironmentOverrides(runtimeConfig, environment),
  };
}

function detectRuntimeConfig(node: ts.Node): RuntimeConfigProperties | undefined {
  if (node.kind !== ts.SyntaxKind.SourceFile) return undefined;

  const sourceFile = node as ts.SourceFile;

  for (const statement of sourceFile.statements) {
    if (statement.kind !== ts.SyntaxKind.VariableStatement) continue;

    const variableStatement = statement as ts.VariableStatement;

    for (const declaration of variableStatement.declarationList.declarations) {
      if (declaration.name.kind !== ts.SyntaxKind.Identifier) continue;
      if (declaration.name.escapedText !== "runtimeConfig") continue;

      // We are assuming here that the declaration of runtimeConfig contains an object
      // literal expression. We should probably validate that and report a warning if
      // it's not an object literal, instead of potentially causing a runtime error.
      return mapObjectLiteral(declaration.initializer as ts.ObjectLiteralExpression);
    }
  }
}

function mapObjectLiteral(node: ts.ObjectLiteralExpression) {
  return node.properties.reduce<{ [key: string]: RuntimeConfigValue | undefined }>(
    (accumulator, currentValue) => {
      return { ...accumulator, ...mapObjectProperty(currentValue) };
    },
    {},
  );
}

function mapObjectProperty(node: ts.ObjectLiteralElement) {
  if (node.kind !== ts.SyntaxKind.PropertyAssignment) return;

  const propertyAssignment = node as ts.PropertyAssignment;

  // We're assuming that runtime config keys are all identifiers here. We should probably
  // validate that and report a warning instead of potentially causing a runtime error.
  const propertyName = (propertyAssignment.name as ts.Identifier).escapedText.toString();

  return {
    [propertyName]: mapValue(propertyAssignment.initializer),
  };
}

function mapValue(node: ts.Node): RuntimeConfigValue {
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
      return (node as ts.ArrayLiteralExpression).elements.map(mapValue);
    default:
      // We should probably raise a warning here instead of using a default string value
      return "UNSUPPORTED";
  }
}

function applyEnvironmentOverrides(
  runtimeConfig: RuntimeConfigProperties,
  environment: string | undefined,
): RuntimeConfigProperties {
  if (environment === undefined) return runtimeConfig;

  const { environmentOverrides, ...rest } = runtimeConfig;

  if (!isObjectLike(environmentOverrides)) return { ...rest };

  const overrides = environmentOverrides[environment];

  if (!isObjectLike(overrides)) return { ...rest };

  return { ...rest, ...overrides };
}

function generateFunctionName(fileName: string) {
  return relative(process.cwd(), fileName)
    .replace(/(src|index|functions|function|\.ts)/g, "")
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/[\/_]/g, "-")
    .replace(/[-]{2,}/g, "-")
    .replace(/^[-]+/, "")
    .replace(/[-]+$/, "");
}

function isObjectLike(value: unknown): value is Partial<Record<string | number | symbol, unknown>> {
  return typeof value === "object" && value !== null;
}

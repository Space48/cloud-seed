import { readFileSync } from "node:fs";
import { getRuntimeConfig } from "./runtimeConfig";

jest.mock("node:fs");

describe("getRuntimeConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return undefined where the file does not contain a runtimeConfig", () => {
    const fileName = "src/path/to/function.ts";
    const fileContents = `
      const myFunc = (req: Request, res: Response) => {
        res.sendStatus(200);
      };

      export default myFunc;
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName);

    expect(result).toBeUndefined();
  });

  it("should return undefined when the file does not contain a top-level runtimeConfig", () => {
    const fileName = "src/path/to/function.ts";
    const fileContents = `
      const myFunc = (req: Request, res: Response) => {
        const runtimeConfig = {
          cloud: "gcp",
          runtime: "nodejs20",
          type: "http",
          public: true,
        };

        res.sendStatus(200);
      };

      export default myFunc;
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName);

    expect(result).toBeUndefined();
  });

  it("should return undefined if the provided file does not exist", () => {
    const fileName = "src/path/to/function.ts";

    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("File not found");
    });

    const result = getRuntimeConfig(fileName);

    expect(result).toBeUndefined();
  });

  it("should return the runtimeConfig defined in the provided file", () => {
    const fileName = "src/path/to/function.ts";
    const fileContents = `
      import type { GcpConfig } from "@space48/cloud-seed";

      const myFunc = (req: Request, res: Response) => {
        res.sendStatus(200);
      };

      export default myFunc;

      export const runtimeConfig: GcpConfig = {
        cloud: "gcp",
        name: "my-test-function",
        runtime: "nodejs20",
        type: "http",
        public: true,
      };
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName);

    expect(result).toEqual({
      file: "src/path/to/function.ts",
      name: "my-test-function",
      cloud: "gcp",
      runtime: "nodejs20",
      type: "http",
      public: true,
    });
  });

  it("should apply environment-specific overrides to the runtimeConfig", () => {
    const fileName = "src/path/to/function.ts";
    const fileContents = `
      import type { GcpConfig } from "@space48/cloud-seed";

      const myFunc = (req: Request, res: Response) => {
        res.sendStatus(200);
      };

      export default myFunc;

      export const runtimeConfig: GcpConfig = {
        cloud: "gcp",
        runtime: "nodejs20",
        name: "my-test-function",
        type: "http",
        public: true,
        timeout: 300,
        environmentOverrides: {
          testing: {
            timeout: 600,
          },
        },
      };
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName, "testing");

    expect(result).toEqual({
      file: "src/path/to/function.ts",
      name: "my-test-function",
      cloud: "gcp",
      runtime: "nodejs20",
      type: "http",
      public: true,
      timeout: 600,
    });
  });

  it("should correctly parse all supported configuration value types", () => {
    const fileName = "src/path/to/function.ts";
    const fileContents = `
      export const runtimeConfig = {
        name: "my-test-function",
        stringKey: "stringValue",
        numberKeyInteger: 1,
        numberKeyDecimal: 9.999,
        booleanKeyTrue: true,
        booleanKeyFalse: false,
        objectKey: {
          stringKey: "stringValue",
          objectKey: {
            numberKey: 100,
          },
          arrayKey: ["stringValue", 100, true, false, { stringKey: "stringValue" }],
        },
        arrayKey: ["stringValue", 100, true, { stringKey: "stringValue" }, [ "stringValue", 5, false]],
      };
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName);

    expect(result).toEqual({
      file: "src/path/to/function.ts",
      name: "my-test-function",
      stringKey: "stringValue",
      numberKeyInteger: 1,
      numberKeyDecimal: 9.999,
      booleanKeyTrue: true,
      booleanKeyFalse: false,
      objectKey: {
        stringKey: "stringValue",
        objectKey: {
          numberKey: 100,
        },
        arrayKey: ["stringValue", 100, true, false, { stringKey: "stringValue" }],
      },
      arrayKey: ["stringValue", 100, true, { stringKey: "stringValue" }, ["stringValue", 5, false]],
    });
  });

  it("should generate the function name from the source file name if a name is not provided", () => {
    const fileName = "src/my-integration//functions/webhook-receiver/index.ts";
    const fileContents = `
      export const runtimeConfig = {
        exampleKey: "exampleValue",
      };
    `;

    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(fileContents));

    const result = getRuntimeConfig(fileName);

    expect(result?.name).toEqual("my-integration-webhook-receiver");
  });
});

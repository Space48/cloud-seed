import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { getRootConfig, RootConfig } from "./rootConfig";
import { DeepPartial } from "./types";

jest.mock("fs");
jest.mock("path");

describe("getRootConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the default config options when cloudseed.json does not exist and no overrides are provided", () => {
    const workingDirectory = "/project";
    const cliOptions = { environment: "testing" };

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValue(false);

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "",
          region: "europe-west2",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: ".build" },
        },
      },
      buildConfig: {
        dir: "src",
        outDir: ".build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should return the config from cloudseed.json if its found in the working directory", () => {
    const workingDirectory = "/project";
    const cliOptions = { environment: "testing" };
    const configFileContent = JSON.stringify({
      default: {
        cloud: {
          gcp: {
            project: "default-project",
            region: "default-region",
          },
        },
        tfConfig: {
          backend: {
            type: "local",
            backendOptions: { path: "default-backend-path" },
          },
        },
        buildConfig: {
          dir: "default-src",
          outDir: "default-build",
        },
      },
    } satisfies DeepPartial<RootConfig>);

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "default-project",
          region: "default-region",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: "default-backend-path" },
        },
      },
      buildConfig: {
        dir: "default-src",
        outDir: "default-build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should return the config from cloudseed.json if its found in the parent directory", () => {
    const workingDirectory = "/path/to/project";
    const cliOptions = { environment: "testing" };
    const configFileContent = JSON.stringify({
      default: {
        cloud: {
          gcp: {
            project: "default-project",
            region: "default-region",
          },
        },
        tfConfig: {
          backend: {
            type: "local",
            backendOptions: { path: "default-backend-path" },
          },
        },
        buildConfig: {
          dir: "default-src",
          outDir: "default-build",
        },
      },
    } satisfies DeepPartial<RootConfig>);

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "default-project",
          region: "default-region",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: "default-backend-path" },
        },
      },
      buildConfig: {
        dir: "default-src",
        outDir: "default-build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should return the default config options when cloudseed.json is empty or invalid", () => {
    const workingDirectory = "/path/to/project";
    const cliOptions = { environment: "testing" };
    const configFileContent = "";

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "",
          region: "europe-west2",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: ".build" },
        },
      },
      buildConfig: {
        dir: "src",
        outDir: ".build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should return the root config options when no environment-specific overrides are specified", () => {
    const workingDirectory = "/project";
    const cliOptions = { environment: "testing" };
    const configFileContent = JSON.stringify({
      default: {
        cloud: {
          gcp: {
            project: "default-project",
            region: "default-region",
          },
        },
        tfConfig: {
          backend: {
            type: "local",
            backendOptions: { path: "default-backend-path" },
          },
        },
        buildConfig: {
          dir: "default-src",
          outDir: "default-build",
        },
      },
    } satisfies DeepPartial<RootConfig>);

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "default-project",
          region: "default-region",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: "default-backend-path" },
        },
      },
      buildConfig: {
        dir: "default-src",
        outDir: "default-build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should override the root config options with environment-specific overrides", () => {
    const workingDirectory = "/project";
    const cliOptions = { environment: "testing" };
    const configFileContent = JSON.stringify({
      default: {
        cloud: {
          gcp: {
            project: "default-project",
            region: "default-region",
          },
        },
        tfConfig: {
          backend: {
            type: "local",
            backendOptions: { path: "default-backend-path" },
          },
        },
        buildConfig: {
          dir: "default-src",
          outDir: "default-build",
        },
      },
      environmentOverrides: {
        testing: {
          cloud: {
            gcp: {
              project: "testing-project",
              region: "testing-region",
            },
          },
          buildConfig: {
            dir: "testing-src",
            outDir: "testing-build",
          },
        },
      },
    } satisfies DeepPartial<RootConfig>);

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "testing-project",
          region: "testing-region",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: "default-backend-path" },
        },
      },
      buildConfig: {
        dir: "testing-src",
        outDir: "testing-build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });

  it("should use CLI options to override config values", () => {
    const workingDirectory = "/project";
    const cliOptions = {
      environment: "testing",
      srcDir: "cli-src",
      outDir: "cli-build",
    };
    const configFileContent = JSON.stringify({
      default: {
        cloud: {
          gcp: {
            project: "default-project",
            region: "default-region",
          },
        },
        buildConfig: {
          dir: "default-src",
          outDir: "default-build",
        },
      },
    } satisfies DeepPartial<RootConfig>);

    (resolve as jest.Mock).mockImplementation((...args) => args[0]);
    (existsSync as jest.Mock).mockReturnValueOnce(true);
    (readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from(configFileContent));

    const result = getRootConfig(workingDirectory, cliOptions);

    expect(result).toEqual({
      cloud: {
        gcp: {
          project: "default-project",
          region: "default-region",
          sourceCodeStorage: {
            bucket: {
              name: "",
            },
          },
        },
      },
      tfConfig: {
        backend: {
          type: "local",
          backendOptions: { path: "cli-build" },
        },
      },
      buildConfig: {
        dir: "cli-src",
        outDir: "cli-build",
        esbuildOptions: undefined,
      },
      runtimeEnvironmentVariables: {},
      secretVariableNames: undefined,
    });
  });
});

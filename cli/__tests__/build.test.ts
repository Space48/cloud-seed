/**
 * Tests for the build command CLI interface.
 * These tests verify the command-line argument parsing and validation,
 * as well as the proper invocation of the underlying build functionality.
 */

import { jest } from "@jest/globals";
import { cmdBuild } from "../build";
import * as utils from "../utils";
import build from "../../build";

// Mock dependencies
jest.mock("../utils", () => ({
  printAndExit: jest.fn((message: string, exitCode?: number) => {
    if (exitCode === undefined) exitCode = 1;
    return message;
  }),
}));
jest.mock("../../build");

// Create mock functions for fs and path
const mockExistsSync = jest.fn();
const mockResolve = jest.fn();

// Mock fs and path modules
jest.mock("fs", () => ({
  existsSync: mockExistsSync,
}));

jest.mock("path", () => ({
  resolve: mockResolve,
}));

/**
 * Test suite for the build command
 * Verifies command-line argument handling, help display, validation,
 * and proper invocation of the build functionality
 */
describe("cmdBuild", () => {
  // Store original console.log
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockResolve.mockImplementation((...args) => args.join("/"));

    // Mock console.log
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console.log after each test
    console.log = originalConsoleLog;
  });

  afterAll(() => {
    // Ensure console.log is restored after all tests
    console.log = originalConsoleLog;
  });

  /**
   * Verify that the help message is displayed when --help flag is used
   * The command should exit with status code 0 after displaying help
   */
  test("displays help message when --help flag is used", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;

    cmdBuild(["--help"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("Usage"), 0);
  });

  /**
   * Verify that the help message is displayed when -h flag is used
   * This tests the short form of the help flag
   */
  test("displays help message when -h flag is used", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;

    cmdBuild(["-h"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("Usage"), 0);
  });

  /**
   * Verify that the environment flag is required
   * The command should exit with an error if --env is not provided
   */
  test("requires environment flag", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;

    cmdBuild([]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("--env"));
  });

  /**
   * Verify that the project directory exists
   * The command should exit with an error if the specified directory doesn't exist
   */
  test("validates project directory exists", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;
    mockExistsSync.mockReturnValue(false);

    cmdBuild(["--env", "prod", "/non/existent/dir"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("/non/existent/dir"));
  });

  /**
   * Verify that the build function is called with correct parameters
   * Tests the proper parsing and forwarding of all command line arguments
   */
  test("calls build with correct parameters", () => {
    const mockBuild = build as jest.MockedFunction<typeof build>;
    const args = ["--env", "prod", "--src-dir", "src", "--out-dir", "dist", "/project/dir"];

    cmdBuild(args);

    expect(mockBuild).toHaveBeenCalledWith({
      rootDir: "/project/dir",
      environment: "prod",
      srcDir: "src",
      outDir: "dist",
      debug: false,
    });
  });

  /**
   * Verify that the debug flag is properly set when --debug is used
   * Tests the long form of the debug flag
   */
  test("sets debug flag when --debug is used", () => {
    const mockBuild = build as jest.MockedFunction<typeof build>;
    const args = ["--env", "prod", "--debug", "/project/dir"];

    cmdBuild(args);

    expect(mockBuild).toHaveBeenCalledWith({
      rootDir: "/project/dir",
      environment: "prod",
      debug: true,
    });
  });

  /**
   * Verify that the debug flag is properly set when -d is used
   * Tests the short form of the debug flag
   */
  test("sets debug flag when -d is used", () => {
    const mockBuild = build as jest.MockedFunction<typeof build>;
    const args = ["--env", "prod", "-d", "/project/dir"];

    cmdBuild(args);

    expect(mockBuild).toHaveBeenCalledWith({
      rootDir: "/project/dir",
      environment: "prod",
      debug: true,
    });
  });

  /**
   * Verify that the current directory is used when no project directory is specified
   * Tests the default behavior for project directory
   */
  test("uses current directory when no project directory is specified", () => {
    const mockBuild = build as jest.MockedFunction<typeof build>;
    const args = ["--env", "prod"];

    cmdBuild(args);

    expect(mockBuild).toHaveBeenCalledWith({
      rootDir: ".",
      environment: "prod",
      debug: false,
    });
  });

  /**
   * Verify that unknown command line options are handled gracefully
   * The command should exit with an error message for unknown flags
   */
  test("handles unknown options gracefully", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;

    cmdBuild(["--unknown-flag"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("--unknown-flag"));
  });

  /**
   * Verify that non-ARG_UNKNOWN_OPTION errors are properly propagated
   * Any unexpected errors should be thrown rather than handled silently
   */
  test("throws error for non-ARG_UNKNOWN_OPTION errors", () => {
    mockExistsSync.mockImplementation(() => {
      throw new Error("Some other error");
    });

    expect(() => cmdBuild(["--env", "prod"])).toThrow("Some other error");
  });
});

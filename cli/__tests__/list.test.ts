/**
 * Tests for the list command CLI interface.
 * These tests verify the command-line argument parsing and validation,
 * as well as the proper invocation of the underlying list functionality.
 */

import { jest } from "@jest/globals";
import { cmdList } from "../list";
import * as utils from "../utils";
import list from "../../list";

// Mock dependencies
jest.mock("../utils", () => ({
  printAndExit: jest.fn((message: string, exitCode?: number) => {
    if (exitCode === undefined) exitCode = 1;
    return message;
  }),
}));
jest.mock("../../list");

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
 * Test suite for the list command
 * Verifies command-line argument handling, help display, validation,
 * and proper invocation of the list functionality
 */
describe("cmdList", () => {
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

    cmdList(["--help"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("Usage"), 0);
  });

  /**
   * Verify that the out directory exists when specified
   * The command should exit with an error if the specified directory doesn't exist
   */
  test("validates out directory exists when specified", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;
    mockExistsSync.mockReturnValue(false);

    cmdList(["--out-dir", "/non/existent/dir"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("/non/existent/dir"));
  });

  /**
   * Verify that the list function is called with correct parameters
   * Tests the proper parsing and forwarding of all command line arguments
   */
  test("calls list with correct parameters", () => {
    const mockList = list as jest.MockedFunction<typeof list>;
    const args = ["--out-dir", "/output/dir"];

    cmdList(args);

    expect(mockList).toHaveBeenCalledWith({
      outDir: "/output/dir",
    });
  });

  /**
   * Verify that the list function is called with undefined when no out-dir is specified
   * Tests the default behavior for output directory
   */
  test("calls list with undefined when no out-dir specified", () => {
    const mockList = list as jest.MockedFunction<typeof list>;

    cmdList([]);

    expect(mockList).toHaveBeenCalledWith({});
  });

  /**
   * Verify that unknown command line options are handled gracefully
   * The command should exit with an error message for unknown flags
   */
  test("handles unknown options gracefully", () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;

    cmdList(["--unknown-flag"]);

    expect(mockPrintAndExit).toHaveBeenCalledWith(expect.stringContaining("--unknown-flag"));
  });
});

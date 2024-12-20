/**
 * Tests for the utilities module.
 * These tests verify the behavior of utility functions used across the CLI.
 */

import { jest } from "@jest/globals";
import { printAndExit } from "../utils";

/**
 * Test suite for the printAndExit utility function
 * Verifies the function's behavior with different message types and exit codes
 */
describe("printAndExit", () => {
  // Store original console.log and process.exit
  const originalConsoleLog = console.log;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log
    console.log = jest.fn();

    // Mock process.exit
    process.exit = jest.fn() as jest.MockedFunction<typeof process.exit>;
  });

  afterEach(() => {
    // Restore original functions after each test
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  });

  afterAll(() => {
    // Ensure original functions are restored after all tests
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  });

  /**
   * Verify that printAndExit logs the message and exits with code 1 by default
   */
  test("logs message and exits with code 1 by default", () => {
    const message = "Error message";

    printAndExit(message);

    expect(console.log).toHaveBeenCalledWith(message);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  /**
   * Verify that printAndExit logs the message and exits with specified code
   */
  test("logs message and exits with specified code", () => {
    const message = "Success message";
    const exitCode = 0;

    printAndExit(message, exitCode);

    expect(console.log).toHaveBeenCalledWith(message);
    expect(process.exit).toHaveBeenCalledWith(exitCode);
  });

  /**
   * Test case: printAndExit handles empty message
   * Verifies that printAndExit logs an empty message and exits with status code 1
   */
  test("handles empty message", () => {
    const message = "";

    printAndExit(message);

    expect(console.log).toHaveBeenCalledWith(message);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

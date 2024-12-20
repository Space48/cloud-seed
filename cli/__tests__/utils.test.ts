/**
 * Tests for utility functions used across the CLI.
 * These tests verify the behavior of common utility functions
 * that are shared between different CLI commands.
 */

import { jest } from "@jest/globals";
import { printAndExit } from "../utils";

/**
 * Test suite for the printAndExit utility function
 * Tests the behavior of printing messages and exiting with specific status codes
 */
describe("printAndExit", () => {
  // Declare mock function types for better type safety
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockProcessExit: jest.SpiedFunction<typeof process.exit>;

  /**
   * Set up test environment before each test
   * Mock console.log and process.exit to prevent actual side effects
   */
  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  /**
   * Clean up test environment after each test
   * Restore original console.log and process.exit functionality
   */
  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockProcessExit.mockRestore();
  });

  /**
   * Test case: printAndExit prints message and exits with default code 1
   * Verifies that printAndExit logs the provided message and exits with status code 1
   */
  test("prints message and exits with default code 1", () => {
    const message = "Test error message";

    printAndExit(message);

    expect(mockConsoleLog).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  /**
   * Test case: printAndExit prints message and exits with specified code
   * Verifies that printAndExit logs the provided message and exits with the specified status code
   */
  test("prints message and exits with specified code", () => {
    const message = "Test success message";
    const exitCode = 0;

    printAndExit(message, exitCode);

    expect(mockConsoleLog).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(exitCode);
  });

  /**
   * Test case: printAndExit handles empty message
   * Verifies that printAndExit logs an empty message and exits with status code 1
   */
  test("handles empty message", () => {
    const message = "";

    printAndExit(message);

    expect(mockConsoleLog).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});

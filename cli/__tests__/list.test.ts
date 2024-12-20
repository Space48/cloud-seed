/**
 * Tests for the list command CLI interface.
 * These tests verify the command-line argument parsing and validation,
 * as well as the proper invocation of the underlying list functionality.
 */

import { jest } from '@jest/globals';
import { cmdList } from '../list';
import * as utils from '../utils';
import * as fs from 'fs';
import * as path from 'path';
import list from '../../list';

// Mock dependencies
jest.mock('../utils', () => ({
  printAndExit: jest.fn((message: string, exitCode?: number) => {
    if (exitCode === undefined) exitCode = 1;
    return message;
  })
}));
jest.mock('fs');
jest.mock('path');
jest.mock('../../list');

/**
 * Test suite for the list command
 * Verifies command-line argument handling, help display, validation,
 * and proper invocation of the list functionality
 */
describe('cmdList', () => {
  // Store original console.log
  const originalConsoleLog = console.log;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
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
  test('displays help message when --help flag is used', () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;
    
    cmdList(['--help']);
    
    expect(mockPrintAndExit).toHaveBeenCalledWith(
      expect.stringContaining('Usage'),
      0
    );
  });

  /**
   * Verify that the output directory exists when specified
   * The command should exit with an error if the specified directory doesn't exist
   */
  test('validates out directory exists when specified', () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    cmdList(['--out-dir', '/non/existent/dir']);
    
    expect(mockPrintAndExit).toHaveBeenCalledWith(
      expect.stringContaining('/non/existent/dir')
    );
  });

  /**
   * Verify that the list function is called with correct parameters
   * Tests the proper parsing and forwarding of output directory argument
   */
  test('calls list with correct parameters', () => {
    const mockList = list as jest.MockedFunction<typeof list>;
    const outDir = '/output/dir';
    
    cmdList(['--out-dir', outDir]);
    
    expect(mockList).toHaveBeenCalledWith(outDir);
  });

  /**
   * Verify that the list function is called without outDir when not specified
   * Tests the default behavior when no output directory is provided
   */
  test('calls list with undefined when no out-dir specified', () => {
    const mockList = list as jest.MockedFunction<typeof list>;
    
    cmdList([]);
    
    expect(mockList).toHaveBeenCalledWith(undefined);
  });

  /**
   * Verify that unknown command line options are handled gracefully
   * The command should exit with an error message for unknown flags
   */
  test('handles unknown options gracefully', () => {
    const mockPrintAndExit = utils.printAndExit as jest.MockedFunction<typeof utils.printAndExit>;
    
    cmdList(['--unknown-flag']);
    
    expect(mockPrintAndExit).toHaveBeenCalledWith(
      expect.stringContaining('--unknown-flag')
    );
  });
});

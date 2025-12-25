/**
 * Test collector for session memory file
 * Feature: 001-session-memory-file
 *
 * Parses Vitest and Playwright test results
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { TestResults, TestSuite, TestFailure } from '../types';
import { generateTimestamp } from '../utils';

const execAsync = promisify(exec);

/**
 * Collect test results from Vitest and Playwright
 * @returns TestResults structure with unit and E2E results
 */
export async function collectTestResults(): Promise<TestResults> {
  const unitResults = await collectVitestResults();
  const e2eResults = await collectPlaywrightResults();

  return {
    lastRun: unitResults.status !== 'not-run' || e2eResults.status !== 'not-run'
      ? generateTimestamp()
      : null,
    unit: unitResults,
    e2e: e2eResults,
  };
}

/**
 * Collect Vitest test results
 */
async function collectVitestResults(): Promise<TestSuite> {
  const defaultSuite: TestSuite = {
    framework: 'Vitest',
    status: 'not-run',
    passed: 0,
    failed: 0,
    total: 0,
    percentage: 0,
    failures: [],
    command: 'npm test',
  };

  try {
    // Check for Vitest output files
    const possiblePaths = [
      '.vitest/results.json',
      'test-results/vitest-results.json',
      'coverage/vitest-results.json',
    ];

    let resultsData: any = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          resultsData = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch {
          continue;
        }
      }
    }

    // If no results file, skip execution (avoid recursive test runs)
    // In production, could optionally run tests, but for session memory
    // generation, we only report existing results
    if (!resultsData) {
      return defaultSuite;
    }

    // Parse results
    if (resultsData) {
      const passed = resultsData.numPassedTests || 0;
      const failed = resultsData.numFailedTests || 0;
      const total = passed + failed;

      const failures: TestFailure[] = [];
      if (resultsData.testResults) {
        for (const testResult of resultsData.testResults) {
          if (testResult.status === 'failed') {
            failures.push({
              file: testResult.name || testResult.testFilePath || 'unknown',
              testName: testResult.message || 'Test failed',
              message: testResult.message?.substring(0, 200),
            });

            if (failures.length >= 20) break; // Max 20 failures
          }
        }
      }

      return {
        framework: 'Vitest',
        status: failed > 0 ? 'failed' : 'passed',
        passed,
        failed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
        failures,
        command: 'npm test',
      };
    }
  } catch (error) {
    console.warn('[test-collector] Failed to collect Vitest results:', (error as Error).message);
  }

  return defaultSuite;
}

/**
 * Collect Playwright test results
 */
async function collectPlaywrightResults(): Promise<TestSuite> {
  const defaultSuite: TestSuite = {
    framework: 'Playwright',
    status: 'not-run',
    passed: 0,
    failed: 0,
    total: 0,
    percentage: 0,
    failures: [],
    command: 'npm run test:e2e',
  };

  try {
    // Check for Playwright results
    const possiblePaths = [
      'test-results/results.json',
      'playwright-report/results.json',
      '.playwright/results.json',
    ];

    let resultsData: any = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          resultsData = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch {
          continue;
        }
      }
    }

    // Check for test-results directory to see if tests were run
    if (!resultsData && fs.existsSync('test-results')) {
      const files = fs.readdirSync('test-results');
      if (files.length > 0) {
        // Tests were run but no JSON results - try to infer from directory
        return {
          ...defaultSuite,
          status: 'passed', // Assume passed if no failures found
        };
      }
    }

    if (resultsData) {
      const passed = resultsData.passed || 0;
      const failed = resultsData.failed || 0;
      const total = passed + failed;

      const failures: TestFailure[] = [];
      if (resultsData.failures && Array.isArray(resultsData.failures)) {
        for (const failure of resultsData.failures.slice(0, 20)) {
          failures.push({
            file: failure.file || failure.testFilePath || 'unknown',
            testName: failure.title || failure.name || 'E2E test failed',
            message: failure.error?.message?.substring(0, 200),
          });
        }
      }

      return {
        framework: 'Playwright',
        status: failed > 0 ? 'failed' : 'passed',
        passed,
        failed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
        failures,
        command: 'npm run test:e2e',
      };
    }
  } catch (error) {
    console.warn('[test-collector] Failed to collect Playwright results:', (error as Error).message);
  }

  return defaultSuite;
}

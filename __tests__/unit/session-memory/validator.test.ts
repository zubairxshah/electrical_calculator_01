/**
 * Unit tests for validator
 * Feature: 001-session-memory-file
 * Task: T043, T055-T056
 */

import { describe, it, expect } from 'vitest';
import {
  isValidISO8601,
  isValidPercentage,
  isRelativePath,
  containsSensitiveData,
  validateSessionMemory,
  sanitizeTimestamp,
} from '@/lib/session-memory/validator';
import type { SessionMemory } from '@/lib/session-memory/types';

describe('Validator', () => {
  describe('isValidISO8601', () => {
    it('should accept valid ISO 8601 timestamps', () => {
      expect(isValidISO8601('2025-12-25T10:11:41.100Z')).toBe(true);
      expect(isValidISO8601('2025-12-25T10:11:41Z')).toBe(true);
      expect(isValidISO8601('2025-12-25T10:11:41+00:00')).toBe(true);
      expect(isValidISO8601('2025-12-25T10:11:41-05:00')).toBe(true);
    });

    it('should reject invalid timestamps', () => {
      expect(isValidISO8601('')).toBe(false);
      expect(isValidISO8601('invalid')).toBe(false);
      expect(isValidISO8601('2025-13-45T99:99:99Z')).toBe(false);
      expect(isValidISO8601('12/25/2025')).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    it('should accept valid percentages', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(99.9)).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage(NaN)).toBe(false);
    });
  });

  describe('isRelativePath', () => {
    it('should accept relative paths', () => {
      expect(isRelativePath('src/index.ts')).toBe(true);
      expect(isRelativePath('./config.json')).toBe(true);
      expect(isRelativePath('../parent/file.txt')).toBe(true);
      expect(isRelativePath('specs/001-feature/tasks.md')).toBe(true);
    });

    it('should reject absolute paths', () => {
      expect(isRelativePath('/usr/local/bin')).toBe(false);
      expect(isRelativePath('C:\\Users\\test')).toBe(false);
      expect(isRelativePath('D:/projects/app')).toBe(false);
    });

    it('should accept empty paths', () => {
      expect(isRelativePath('')).toBe(true);
    });
  });

  describe('containsSensitiveData', () => {
    it('should detect API keys', () => {
      expect(containsSensitiveData('API_KEY=sk-1234567890abcdefghij')).toBe(true);
      expect(containsSensitiveData('api-key: "abc123456789012345678901"')).toBe(true);
    });

    it('should detect passwords', () => {
      expect(containsSensitiveData('PASSWORD=mySecretPass123')).toBe(true);
      expect(containsSensitiveData('password: "hunter2"')).toBe(true);
    });

    it('should detect database URLs with credentials', () => {
      expect(containsSensitiveData('postgres://user:pass@localhost/db')).toBe(true);
      expect(containsSensitiveData('mongodb://admin:secret@mongo.example.com')).toBe(true);
    });

    it('should detect AWS credentials', () => {
      expect(containsSensitiveData('AKIAIOSFODNN7EXAMPLE')).toBe(true);
      expect(containsSensitiveData('aws_secret_access_key = abcd1234')).toBe(true);
    });

    it('should not flag safe content', () => {
      expect(containsSensitiveData('This is normal content')).toBe(false);
      expect(containsSensitiveData('Task: Configure database')).toBe(false);
      expect(containsSensitiveData('http://localhost:3000')).toBe(false);
    });
  });

  describe('validateSessionMemory', () => {
    const validMemory: SessionMemory = {
      metadata: {
        projectName: 'test-project',
        generatedAt: '2025-12-25T10:00:00.000Z',
        branch: 'main',
        version: '1.0',
      },
      summary: {
        projectDescription: 'Test project',
        completionStatus: '50/100 tasks (50%)',
        currentPhase: 'Testing',
        majorBlocker: null,
        nextAction: 'Run tests',
      },
      taskStatus: {
        sourceFile: 'specs/tasks.md',
        phases: [
          { name: 'Setup', completed: 5, total: 5, percentage: 100 },
          { name: 'Core', completed: 10, total: 20, percentage: 50 },
        ],
        currentTask: { id: 'T010', title: 'Test task', phase: 'Core' },
        nextTasks: [],
      },
      blockers: [],
      testResults: {
        lastRun: '2025-12-25T09:00:00.000Z',
        unit: {
          framework: 'Vitest',
          status: 'passed',
          passed: 10,
          failed: 0,
          total: 10,
          percentage: 100,
          failures: [],
          command: 'npm test',
        },
        e2e: {
          framework: 'Playwright',
          status: 'not-run',
          passed: 0,
          failed: 0,
          total: 0,
          percentage: 0,
          failures: [],
          command: 'npm run test:e2e',
        },
      },
      environment: {
        servers: [],
        dependencies: {
          status: 'up-to-date',
          lastInstall: '2025-12-24T20:00:00.000Z',
          packageManager: 'npm',
        },
        build: {
          status: 'success',
          lastBuild: '2025-12-25T08:00:00.000Z',
          outputDir: '.next/',
        },
      },
      filesNeedingAttention: [],
      nextSteps: [],
    };

    it('should pass valid session memory', () => {
      const result = validateSessionMemory(validMemory);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing project name', () => {
      const invalid = {
        ...validMemory,
        metadata: { ...validMemory.metadata, projectName: '' },
      };
      const result = validateSessionMemory(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('metadata.projectName is required');
    });

    it('should warn on invalid timestamp', () => {
      const invalid = {
        ...validMemory,
        metadata: { ...validMemory.metadata, generatedAt: 'invalid-date' },
      };
      const result = validateSessionMemory(invalid);
      expect(result.warnings?.some((w) => w.includes('ISO 8601'))).toBe(true);
    });

    it('should fail on invalid percentage', () => {
      const invalid = {
        ...validMemory,
        taskStatus: {
          ...validMemory.taskStatus,
          phases: [{ name: 'Bad', completed: 5, total: 10, percentage: 150 }],
        },
      };
      const result = validateSessionMemory(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid percentage'))).toBe(true);
    });

    it('should fail on absolute paths', () => {
      const invalid = {
        ...validMemory,
        taskStatus: {
          ...validMemory.taskStatus,
          sourceFile: 'C:\\Users\\test\\tasks.md',
        },
      };
      const result = validateSessionMemory(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('relative path'))).toBe(true);
    });

    it('should fail on sensitive data', () => {
      const invalid = {
        ...validMemory,
        summary: {
          ...validMemory.summary,
          projectDescription: 'Project with API_KEY=sk-abcdefghijklmnopqrstuvwxyz',
        },
      };
      const result = validateSessionMemory(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Sensitive data'))).toBe(true);
    });
  });

  describe('sanitizeTimestamp', () => {
    it('should return valid timestamps unchanged', () => {
      expect(sanitizeTimestamp('2025-12-25T10:00:00.000Z')).toBe('2025-12-25T10:00:00.000Z');
    });

    it('should return "unknown" for invalid timestamps', () => {
      expect(sanitizeTimestamp('invalid')).toBe('unknown');
      expect(sanitizeTimestamp('')).toBe('unknown');
      expect(sanitizeTimestamp(null)).toBe('unknown');
      expect(sanitizeTimestamp(undefined)).toBe('unknown');
    });
  });
});

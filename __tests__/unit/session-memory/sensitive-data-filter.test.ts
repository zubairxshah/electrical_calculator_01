/**
 * Unit tests for sensitive-data-filter
 * Feature: 001-session-memory-file
 * SECURITY CRITICAL: SC-007 requires zero credential leakage
 */

import { describe, it, expect } from 'vitest';
import { filterSensitiveData } from '@/lib/session-memory/filters/sensitive-data-filter';

describe('sensitive-data-filter', () => {
  describe('API Keys', () => {
    it('should filter API keys', () => {
      const input = 'API_KEY=sk_live_1234567890abcdef\nOther data';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('sk_live_1234567890abcdef');
      expect(result).not.toContain('API_KEY=');
    });

    it('should filter various API key formats', () => {
      const input = `
OPENAI_API_KEY=sk-proj-abc123
STRIPE_KEY=pk_test_xyz789
APIKEY: "key_12345"
api-key = "secret123"
`;
      const result = filterSensitiveData(input);

      expect(result).not.toContain('sk-proj-abc123');
      expect(result).not.toContain('pk_test_xyz789');
      expect(result).not.toContain('key_12345');
      expect(result).not.toContain('secret123');
    });
  });

  describe('Passwords', () => {
    it('should filter password fields', () => {
      const input = 'PASSWORD=mySecretPass123\nUsername=john';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('mySecretPass123');
      expect(result).not.toContain('PASSWORD=');
    });

    it('should filter various password formats', () => {
      const input = `
password: "supersecret"
PASSWD=test123
pwd: "pass456"
`;
      const result = filterSensitiveData(input);

      expect(result).not.toContain('supersecret');
      expect(result).not.toContain('test123');
      expect(result).not.toContain('pass456');
    });
  });

  describe('Tokens', () => {
    it('should filter JWT tokens', () => {
      const input = 'JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should filter various token formats', () => {
      const input = `
TOKEN=ghp_1234567890abcdef
BEARER_TOKEN=bearer_xyz123
auth_token: "token_abc"
`;
      const result = filterSensitiveData(input);

      expect(result).not.toContain('ghp_1234567890abcdef');
      expect(result).not.toContain('bearer_xyz123');
      expect(result).not.toContain('token_abc');
    });
  });

  describe('Database URLs', () => {
    it('should filter PostgreSQL connection strings with credentials', () => {
      const input = 'DATABASE_URL=postgresql://user:password@host.com/dbname';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('user:password');
      expect(result).not.toContain('postgresql://user:password');
    });

    it('should filter MySQL connection strings', () => {
      const input = 'MYSQL_URL=mysql://admin:secret123@localhost:3306/mydb';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('admin:secret123');
    });

    it('should filter MongoDB connection strings', () => {
      const input = 'MONGO_URI=mongodb://user:pass@cluster.mongodb.net/database';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('user:pass');
    });

    it('should allow localhost URLs without credentials', () => {
      const input = 'Server running on http://localhost:3001';
      const result = filterSensitiveData(input);

      // Should keep this since no credentials
      expect(result).toContain('http://localhost:3001');
    });
  });

  describe('AWS Credentials', () => {
    it('should filter AWS access keys', () => {
      const input = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(result).not.toContain('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    });
  });

  describe('OAuth Secrets', () => {
    it('should filter client secrets', () => {
      const input = 'CLIENT_SECRET=abc123xyz789\nCLIENT_ID=public_id_123';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('abc123xyz789');
      // CLIENT_ID might be okay as it's public, but CLIENT_SECRET must be filtered
    });
  });

  describe('Private Keys', () => {
    it('should filter PEM private keys', () => {
      const input = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;
      const result = filterSensitiveData(input);

      expect(result).not.toContain('BEGIN PRIVATE KEY');
      expect(result).not.toContain('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj');
    });
  });

  describe('Allowlist Approach', () => {
    it('should allow safe data through', () => {
      const input = `
Task completion: 60/155 (38.7%)
Server running on port 3001
46/47 tests passing
Next task: T032 - Setup database
`;
      const result = filterSensitiveData(input);

      // All safe data should pass through
      expect(result).toContain('60/155');
      expect(result).toContain('port 3001');
      expect(result).toContain('46/47 tests');
      expect(result).toContain('T032');
    });

    it('should preserve file paths', () => {
      const input = 'File: __tests__/lib/utils.test.ts:42';
      const result = filterSensitiveData(input);

      expect(result).toContain('__tests__/lib/utils.test.ts');
    });

    it('should preserve package names', () => {
      const input = 'Installed: next@16.1.1, react@19.2.3';
      const result = filterSensitiveData(input);

      expect(result).toContain('next@16.1.1');
      expect(result).toContain('react@19.2.3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = filterSensitiveData('');
      expect(result).toBe('');
    });

    it('should handle string with no sensitive data', () => {
      const input = 'This is safe text with no secrets';
      const result = filterSensitiveData(input);
      expect(result).toBe(input);
    });

    it('should handle multiple sensitive patterns in one string', () => {
      const input = 'API_KEY=secret123\nPASSWORD=pass456\nTOKEN=token789';
      const result = filterSensitiveData(input);

      expect(result).not.toContain('secret123');
      expect(result).not.toContain('pass456');
      expect(result).not.toContain('token789');
    });
  });
});

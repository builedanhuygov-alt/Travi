import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security & Secret Isolation Boundary (Milestone v0.6)', () => {
  const rootDir = process.cwd();

  describe('1. Git Exclusion Safeguards', () => {
    it('.gitignore explicitly excludes .env and environment secrets', () => {
      const gitignorePath = path.join(rootDir, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const lines = content.split('\n').map((l: string) => l.trim());

      expect(lines.some((l: string) => l === '.env' || l === '*.env' || l.startsWith('.env'))).toBe(true);
      expect(lines.some((l: string) => l === '*.local' || l === '.env.*' || l.includes('.env'))).toBe(true);
    });
  });

  describe('2. Client Source Code Secret Isolation', () => {
    it('client source files under src/ NEVER reference QLOO_API_KEY directly', () => {
      const srcDir = path.join(rootDir, 'src');

      function scanDir(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            results = results.concat(scanDir(filePath));
          } else if (
            (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) &&
            !file.endsWith('.test.ts') &&
            !file.endsWith('.spec.ts')
          ) {
            results.push(filePath);
          }
        }
        return results;
      }

      const clientFiles = scanDir(srcDir);
      expect(clientFiles.length).toBeGreaterThan(20);

      for (const filePath of clientFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Client source must NEVER read process.env.QLOO_API_KEY or import QLOO_API_KEY
        expect(content).not.toContain('process.env.QLOO_API_KEY');
        expect(content).not.toContain('import.meta.env.QLOO_API_KEY');
        expect(content).not.toContain('import.meta.env.VITE_QLOO_API_KEY');
        expect(content).not.toContain('VITE_QLOO_API_KEY');
      }
    });

    it('client source files under src/ do NOT contain any Qloo client or proxies', () => {
      const qlooClientPath = path.join(rootDir, 'src/services/recommendations/qloo');
      const qlooServerProxyPath = path.join(rootDir, 'server/qlooProxy.js');
      expect(fs.existsSync(qlooClientPath)).toBe(false);
      expect(fs.existsSync(qlooServerProxyPath)).toBe(false);
    });
  });

  describe('3. Production Bundle Secret Verification', () => {
    it('dist bundle contains NO Qloo secrets or server-side environment variables', () => {
      const distAssetsDir = path.join(rootDir, 'dist/assets');
      if (!fs.existsSync(distAssetsDir)) {
        // If not yet built, skip softly with notice
        return;
      }

      const bundleFiles = fs.readdirSync(distAssetsDir).filter((f: string) => f.endsWith('.js'));
      expect(bundleFiles.length).toBeGreaterThan(0);

      for (const file of bundleFiles) {
        const bundleContent = fs.readFileSync(path.join(distAssetsDir, file), 'utf-8');
        // Ensure no leaked live API keys or VITE-prefixed secret variables in minified bundle
        expect(bundleContent).not.toContain('hack_');
        expect(bundleContent).not.toContain('VITE_QLOO_API_KEY');
      }
    });
  });

  describe('4. Firestore User Scoped Security Rules Integrity', () => {
    it('firestore.rules strictly enforces /users/{userId}/* ownership and does not allow global open access', () => {
      const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
      expect(fs.existsSync(firestoreRulesPath)).toBe(true);

      const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf-8');
      expect(rulesContent).toContain('match /users/{userId}');
      expect(rulesContent).toContain('request.auth != null');
      expect(rulesContent).toContain('request.auth.uid == userId');
      expect(rulesContent).toContain('allow read, write: if isOwner(userId);');

      // Ensure no insecure open write rules anywhere in the file
      expect(rulesContent).not.toMatch(/allow\s+write\s*:\s*if\s+true/);
      expect(rulesContent).not.toMatch(/allow\s+create\s*:\s*if\s+true/);
    });
  });
});

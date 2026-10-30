import { describe, it, expect } from 'vitest';
import { ProfilePage } from '../ProfilePage.tsx';
import { DevDiagnosticsPage } from '../DevDiagnosticsPage.tsx';

describe('ProfilePage User Experience & Diagnostics Separation (Milestone v1.1)', () => {
  describe('1. Absence of Firebase Diagnostics from ProfilePage UI', () => {
    it('ProfilePage exports a valid React component', () => {
      expect(ProfilePage).toBeDefined();
      expect(typeof ProfilePage).toBe('function');
    });

    it('ProfilePage source code contains zero diagnostic panels or raw SDK telemetry', async () => {
      const fs = await import('node:fs/promises');
      const profileCode = await fs.readFile('d:/Travi/src/pages/ProfilePage.tsx', 'utf-8');

      // Diagnostics that MUST be removed per Section 2 of v1.1
      expect(profileCode).not.toContain('Firebase SDK Diagnostic Panel');
      expect(profileCode).not.toContain('Persistence Architecture & Cloud Sync Boundary');
      expect(profileCode).not.toContain('Ping Cloud Firestore');
      expect(profileCode).not.toContain('Auth SDK Client:');
      expect(profileCode).not.toContain('Firestore SDK Client:');
      expect(profileCode).not.toContain('Web API Key:');
      expect(profileCode).not.toContain('App ID:');
      expect(profileCode).not.toContain('testFirestoreReachability');
      expect(profileCode).not.toContain('Zero Silent Migration Guarantee');
      expect(profileCode).not.toContain('Silent Migration Policy');
    });

    it('DevDiagnosticsPage contains the developer-only diagnostic panels', async () => {
      const fs = await import('node:fs/promises');
      const devCode = await fs.readFile('d:/Travi/src/pages/DevDiagnosticsPage.tsx', 'utf-8');

      expect(devCode).toContain('Firebase SDK Diagnostic Panel');
      expect(devCode).toContain('Ping Cloud Firestore');
      expect(devCode).toContain('testFirestoreReachability');
      expect(devCode).toContain('Persistence Architecture & Boundary');
    });
  });

  describe('2. Real Identity vs. Fabricated Sample Identity', () => {
    it('ProfilePage does not hardcode Minh Duy or sample personal details as real identity', async () => {
      const fs = await import('node:fs/promises');
      const profileCode = await fs.readFile('d:/Travi/src/pages/ProfilePage.tsx', 'utf-8');

      // Never hardcoded as the default identity
      expect(profileCode).not.toContain("name: 'Minh Duy'");
      expect(profileCode).not.toContain("handle: '@minhduy.travels'");
      expect(profileCode).not.toContain('sampleProfile');
    });

    it('ProfilePage links to developer diagnostics discreetly', async () => {
      const fs = await import('node:fs/promises');
      const profileCode = await fs.readFile('d:/Travi/src/pages/ProfilePage.tsx', 'utf-8');

      expect(profileCode).toContain('/dev/diagnostics');
    });
  });

  describe('3. DevDiagnosticsPage Component Validation', () => {
    it('DevDiagnosticsPage exports a valid component', () => {
      expect(DevDiagnosticsPage).toBeDefined();
      expect(typeof DevDiagnosticsPage).toBe('function');
    });
  });
});

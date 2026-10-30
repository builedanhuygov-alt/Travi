import { describe, it, expect } from 'vitest';
import {
  validateUserProfile,
  formatHandle,
  getFallbackProfile,
  saveUserProfile,
} from '../userProfile.ts';

describe('Real User Profile & Identity Service (Milestone v1.1)', () => {
  describe('1. Profile Field Validation (validateUserProfile)', () => {
    it('accepts valid display names and handles', () => {
      const valid = validateUserProfile({
        displayName: 'Maya Chen',
        handle: 'maya_chen',
        bio: 'Explorer of cultural sanctuaries and architectural heritage.',
        homeBase: 'Kyoto, Japan',
      });

      expect(valid.isValid).toBe(true);
      expect(valid.errors).toEqual({});
    });

    it('rejects display names that are too short or too long', () => {
      const tooShort = validateUserProfile({ displayName: 'M' });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.displayName).toMatch(/at least 2 characters/);

      const tooLong = validateUserProfile({ displayName: 'A'.repeat(51) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.displayName).toMatch(/cannot exceed 50 characters/);
    });

    it('validates handle rules: length and allowed characters', () => {
      const tooShort = validateUserProfile({ handle: 'ab' });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.handle).toMatch(/at least 3 characters/);

      const invalidChars = validateUserProfile({ handle: 'user!@#$' });
      expect(invalidChars.isValid).toBe(false);
      expect(invalidChars.errors.handle).toMatch(/letters, numbers, underscores, and dots/);

      const tooLong = validateUserProfile({ handle: 'a'.repeat(31) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.handle).toMatch(/cannot exceed 30 characters/);
    });

    it('strips leading @ symbol when validating handle length', () => {
      const validWithAt = validateUserProfile({ handle: '@traveler' });
      expect(validWithAt.isValid).toBe(true);

      const tooShortWithAt = validateUserProfile({ handle: '@ab' });
      expect(tooShortWithAt.isValid).toBe(false);
    });

    it('validates maximum bio and location lengths', () => {
      const longBio = validateUserProfile({ bio: 'x'.repeat(501) });
      expect(longBio.isValid).toBe(false);
      expect(longBio.errors.bio).toMatch(/cannot exceed 500 characters/);

      const longHome = validateUserProfile({ homeBase: 'y'.repeat(101) });
      expect(longHome.isValid).toBe(false);
      expect(longHome.errors.homeBase).toMatch(/cannot exceed 100 characters/);
    });
  });

  describe('2. Handle Formatting (formatHandle)', () => {
    it('ensures handle begins with a single @ prefix', () => {
      expect(formatHandle('explorer')).toBe('@explorer');
      expect(formatHandle('@explorer')).toBe('@explorer');
      expect(formatHandle('@@@explorer')).toBe('@explorer');
      expect(formatHandle('  @sanctuary  ')).toBe('@sanctuary');
    });

    it('returns empty string when input is empty or only whitespace', () => {
      expect(formatHandle('')).toBe('');
      expect(formatHandle('   ')).toBe('');
      expect(formatHandle('@@@')).toBe('');
    });
  });

  describe('3. Neutral Identity Fallback (getFallbackProfile)', () => {
    it('creates truthful fallback without fabricating demo identity or sample names', () => {
      const fallback = getFallbackProfile({
        uid: 'user_xyz_789',
        displayName: 'Sarah Connor',
        email: 'sarah@example.com',
        photoURL: 'https://example.com/avatar.jpg',
      });

      expect(fallback.uid).toBe('user_xyz_789');
      expect(fallback.displayName).toBe('Sarah Connor');
      expect(fallback.handle).toBe('@sarahconnor');
      expect(fallback.email).toBe('sarah@example.com');
      expect(fallback.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(fallback.bio).toBe('');
      expect(fallback.homeBase).toBe('');
      expect(fallback.displayName).not.toBe('Minh Duy');
      expect(fallback.handle).not.toBe('@minhduy.travels');
    });

    it('derives fallback name from email when displayName is missing', () => {
      const fallback = getFallbackProfile({
        uid: 'user_anon_123',
        displayName: null,
        email: 'nomad.adventurer@travi.test',
        photoURL: null,
      });

      expect(fallback.displayName).toBe('nomad.adventurer');
      expect(fallback.handle).toBe('@nomadadventurer');
      expect(fallback.avatarUrl).toBeUndefined();
    });

    it('falls back to generic Traveler if both name and email are missing', () => {
      const fallback = getFallbackProfile({
        uid: 'user_empty',
        displayName: null,
        email: null,
        photoURL: null,
      });

      expect(fallback.displayName).toBe('Traveler');
      expect(fallback.handle).toBe('@traveler');
    });
  });

  describe('4. Profile Persistence Boundary Safeguards', () => {
    it('rejects saveUserProfile when userId is empty or whitespace', async () => {
      await expect(saveUserProfile('', { displayName: 'Alex' })).rejects.toThrowError(
        /userId must be provided/
      );
      await expect(saveUserProfile('   ', { displayName: 'Alex' })).rejects.toThrowError(
        /userId must be provided/
      );
    });

    it('rejects saveUserProfile when validation fails', async () => {
      await expect(saveUserProfile('user_123', { displayName: 'A' })).rejects.toThrowError(
        /Profile validation failed/
      );
    });
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { RouteLoadingFallback } from '../../components/layout/RouteLoadingFallback.tsx';
import { routes, router } from '../router.tsx';

describe('Route-Level Code Splitting & Lazy Architecture (Milestone v0.9)', () => {
  describe('1. Route Loading Fallback & Accessibility', () => {
    it('RouteLoadingFallback exports a valid component with accessibility attributes', () => {
      expect(RouteLoadingFallback).toBeDefined();
      expect(typeof RouteLoadingFallback).toBe('function');

      const element = RouteLoadingFallback({});
      expect(element).toBeDefined();
      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement(element)) {
        const props = element.props as Record<string, unknown>;
        expect(props.role).toBe('status');
        expect(props['aria-label']).toBe('Loading page content');
      }
    });
  });

  describe('2. Dynamic Page Imports Resolution', () => {
    it('resolves ExplorePage lazy chunk correctly', async () => {
      const module = await import('../../pages/ExplorePage.tsx');
      expect(module.ExplorePage || module.default).toBeDefined();
    });

    it('resolves DestinationDetailPage lazy chunk correctly', async () => {
      const module = await import('../../pages/DestinationDetailPage.tsx');
      expect(module.DestinationDetailPage || module.default).toBeDefined();
    });

    it('resolves CopilotPage lazy chunk correctly', async () => {
      const module = await import('../../pages/CopilotPage.tsx');
      expect(module.CopilotPage || module.default).toBeDefined();
    });

    it('resolves TripsPage lazy chunk correctly', async () => {
      const module = await import('../../pages/TripsPage.tsx');
      expect(module.TripsPage || module.default).toBeDefined();
    });

    it('resolves ProfilePage lazy chunk correctly', async () => {
      const module = await import('../../pages/ProfilePage.tsx');
      expect(module.ProfilePage || module.default).toBeDefined();
    });

    it('resolves MemoriesPage, ExperiencesPage, and SocialPage lazy chunks', async () => {
      const [memories, experiences, social] = await Promise.all([
        import('../../pages/MemoriesPage.tsx'),
        import('../../pages/ExperiencesPage.tsx'),
        import('../../pages/SocialPage.tsx'),
      ]);
      expect(memories.MemoriesPage || memories.default).toBeDefined();
      expect(experiences.ExperiencesPage || experiences.default).toBeDefined();
      expect(social.SocialPage || social.default).toBeDefined();
    });
  });

  describe('3. Router Configuration & Lazy Route Mapping', () => {
    it('contains all required top-level and nested lazy routes', () => {
      expect(router).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);

      const rootRoute = routes[0];
      expect(rootRoute.children).toBeDefined();

      const childPaths = rootRoute.children?.map((c) => c.path || (c.index ? '/' : ''));
      expect(childPaths).toContain('explore');
      expect(childPaths).toContain('destinations/:id');
      expect(childPaths).toContain('trips');
      expect(childPaths).toContain('copilot');
      expect(childPaths).toContain('concierge');
      expect(childPaths).toContain('profile');
      expect(childPaths).toContain('memories');
      expect(childPaths).toContain('experiences');
      expect(childPaths).toContain('social');
    });
  });
});

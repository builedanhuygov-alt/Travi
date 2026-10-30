import { describe, it, expect } from 'vitest';
import {
  runAgenticTripBuilder,
  validateItineraryDraft,
  persistDraftToTrip,
} from '../agenticTripBuilder.ts';
import { generateCulturalItineraryDraft } from '../itineraryGenerator.ts';
import { demoStore } from '../../storage/demoStore.ts';

describe('Agentic Trip Builder — 8-Stage Vietnam Itinerary Workflow', () => {
  it('1. Executes all 8 bounded stages sequentially with timing telemetry', async () => {
    const stageEvents: string[] = [];

    const result = await runAgenticTripBuilder(
      {
        destination: 'ha-giang',
        durationDays: 4,
        budgetRange: 'Mid-range',
        travelPace: 'Unhurried',
        culturalInterests: ['Limestone Karst Peaks', 'H’mong Hemp Weaving'],
        foodPreferences: ['Highland Buckwheat Cake & Thắng Cố'],
      },
      (state) => {
        stageEvents.push(`stage-${state.currentStageIndex}`);
      }
    );

    expect(result.isComplete).toBe(true);
    expect(result.isRunning).toBe(false);
    expect(result.stages.length).toBe(8);

    // Verify each stage completed
    for (const stage of result.stages) {
      expect(stage.status).toBe('completed');
      expect(stage.executionMs).toBeGreaterThanOrEqual(0);
      expect(stage.logs.length).toBeGreaterThan(0);
    }

    // Verify stage definitions match architecture
    const stageIds = result.stages.map((s) => s.id);
    expect(stageIds).toEqual([
      'ANALYZE_CONSTRAINTS',
      'RESOLVE_GAPS',
      'RETRIEVE_VIETNAM_KNOWLEDGE',
      'GENERATE_CANDIDATES',
      'RANK_CANDIDATES',
      'SYNTHESIZE_ITINERARY',
      'VALIDATE_ITINERARY',
      'ASSEMBLE_BLUEPRINT',
    ]);
  });

  it('2. Detects missing parameter gaps and formulates transparent resolutions', async () => {
    const result = await runAgenticTripBuilder({
      destination: 'hue',
      durationDays: 4,
      budgetRange: 'Mid-range',
      travelPace: 'Moderate',
      culturalInterests: [], // Missing interests
      foodPreferences: [], // Missing food preferences
    });

    expect(result.missingInformationPrompts.length).toBeGreaterThan(0);
    expect(result.stages[1].status).toBe('completed');
    expect(result.draft).toBeDefined();
    expect(result.draft?.days.length).toBe(4);
  });

  it('3. Multi-tier validation engine audits duplicates, pacing, and time slots', () => {
    const draft = generateCulturalItineraryDraft({
      destination: 'ha-noi',
      durationDays: 4,
      budgetRange: 'Mid-range',
      travelPace: 'Unhurried',
      culturalInterests: ['Thăng Long Citadel', 'Bát Tràng Pottery'],
      foodPreferences: ['Traditional Phở Bát Đàn'],
    });

    const report = validateItineraryDraft(draft, 'Unhurried');

    expect(report.passed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.duplicatesCount).toBe(0);
    expect(report.unverifiedNoticesCount).toBeGreaterThan(0);
    expect(report.pacingCompliance).toContain('Unhurried');

    // Verify duplicate stop detection when an intentional duplicate is inserted
    const clonedDay = JSON.parse(JSON.stringify(draft.days[0]));
    const draftWithDuplicate = {
      ...draft,
      days: [...draft.days, clonedDay],
    };

    const duplicateReport = validateItineraryDraft(draftWithDuplicate, 'Unhurried');
    expect(duplicateReport.duplicatesCount).toBeGreaterThan(0);
    expect(duplicateReport.score).toBeLessThan(report.score);
  });

  it('4. Correctly flags pacing compliance violations for unhurried itineraries', () => {
    const draft = generateCulturalItineraryDraft({
      destination: 'hoi-an',
      durationDays: 3,
      budgetRange: 'Comfort',
      travelPace: 'Unhurried',
      culturalInterests: ['Ancient Shophouses', 'Lantern Crafting'],
    });

    // Add extra activities to exceed Unhurried pace threshold (max 3 stops/day)
    const crowdedDraft = {
      ...draft,
      days: draft.days.map((d) => ({
        ...d,
        activities: [
          ...d.activities,
          {
            id: `act-extra-1-${d.dayNumber}`,
            timeOfDay: 'Morning' as const,
            title: 'Extra Sightseeing Stop',
            description: 'Rushed tourist stop',
            culturalPillar: 'History',
            estimatedDuration: '1.0 hr',
            unverifiedEstimateNotice: 'Unverified',
          },
          {
            id: `act-extra-2-${d.dayNumber}`,
            timeOfDay: 'Evening' as const,
            title: 'Another Sightseeing Stop',
            description: 'Second rushed stop',
            culturalPillar: 'History',
            estimatedDuration: '1.0 hr',
            unverifiedEstimateNotice: 'Unverified',
          },
        ],
      })),
    };

    const report = validateItineraryDraft(crowdedDraft, 'Unhurried');
    expect(report.items.some((i) => i.category === 'pacing' && i.level === 'warning')).toBe(true);
  });

  it('5. Converts validated blueprint and persists into demoStore without cloud leak', () => {
    const draft = generateCulturalItineraryDraft({
      destination: 'saigon',
      durationDays: 4,
      budgetRange: 'Luxury',
      travelPace: 'Fast-paced',
      culturalInterests: ['Colonial Architecture', 'Street Food'],
    });

    const tripPayload = persistDraftToTrip(draft);
    expect(tripPayload.title).toBe(draft.title);
    expect(tripPayload.destination).toBe(draft.destinationName);
    expect(tripPayload.days?.length).toBe(4);

    const created = demoStore.createTrip(tripPayload);
    expect(created.id).toBeDefined();

    const storedTrips = demoStore.getTrips();
    const retrieved = storedTrips.find((t) => t.id === created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.days?.length).toBe(4);

    // Clean up
    demoStore.deleteTrip(created.id);
  });
});

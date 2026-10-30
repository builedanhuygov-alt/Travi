import { describe, it, expect } from 'vitest';
import {
  generateCulturalItineraryDraft,
  convertDraftToTrip,
  CONCIERGE_DISCLAIMERS,
  type GenerateItineraryParams,
} from '../itineraryGenerator.ts';

describe('Cultural Trip Concierge & Itinerary Generator (Milestone v0.6)', () => {
  const baseParams: GenerateItineraryParams = {
    destination: 'kyoto-japan',
    durationDays: 3,
    budgetRange: 'Artisanal Heritage',
    travelPace: 'Deliberate',
    culturalInterests: ['Architecture & Spaces', 'Food & Gastronomy', 'History & Heritage'],
    foodPreferences: ['Seasonal Kaiseki', 'Matcha & Mountain Teas'],
  };

  describe('1. Coherent Day-by-Day Draft Itinerary Generation', () => {
    it('generates a day-by-day draft itinerary matching the requested duration', () => {
      const draft = generateCulturalItineraryDraft(baseParams);

      expect(draft.destinationName).toContain('Kyoto');
      expect(draft.durationDays).toBe(3);
      expect(draft.days.length).toBe(3);
      expect(draft.days[0].dayNumber).toBe(1);
      expect(draft.days[1].dayNumber).toBe(2);
      expect(draft.days[2].dayNumber).toBe(3);
    });

    it('scales day count properly for longer journeys (5 days)', () => {
      const draft = generateCulturalItineraryDraft({
        ...baseParams,
        durationDays: 5,
      });

      expect(draft.durationDays).toBe(5);
      expect(draft.days.length).toBe(5);
    });

    it('generates a structured draft for an unlisted destination using cultural baseline heuristics', () => {
      const draft = generateCulturalItineraryDraft({
        ...baseParams,
        destination: 'Samarkand, Uzbekistan',
        durationDays: 2,
      });

      expect(draft.destinationName).toBe('Samarkand, Uzbekistan');
      expect(draft.days.length).toBe(2);
      expect(draft.days[0].interestExplanation).toContain('cultural interest');
    });
  });

  describe('2. Pacing Adaptation', () => {
    it('limits activity count to 2 per day when pace is Unhurried', () => {
      const draft = generateCulturalItineraryDraft({
        ...baseParams,
        travelPace: 'Unhurried',
      });

      draft.days.forEach((day) => {
        expect(day.activities.length).toBeLessThanOrEqual(2);
      });
    });

    it('includes up to 3 activities per day when pace is Deliberate or Expedition', () => {
      const draft = generateCulturalItineraryDraft({
        ...baseParams,
        travelPace: 'Deliberate',
      });

      const maxActivities = Math.max(...draft.days.map((d) => d.activities.length));
      expect(maxActivities).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Traceable Cultural Alignment & Honest Explanations', () => {
    it('explains cultural alignment referencing the user-selected pillars without fabricated percentages', () => {
      const draft = generateCulturalItineraryDraft(baseParams);

      expect(draft.matchedCulturalInterests).toEqual(baseParams.culturalInterests);
      expect(draft.days[0].interestExplanation).toBeDefined();
      expect(draft.days[0].interestExplanation.length).toBeGreaterThan(15);
      // Must not fabricate arbitrary satisfaction percentages or claim booking guarantees
      expect(draft.days[0].interestExplanation).not.toContain('100% satisfaction guaranteed');
      expect(draft.days[0].interestExplanation).not.toContain('booking confirmed');
    });

    it('each activity provides cultural relevance explaining why it aligns with the traveler', () => {
      const draft = generateCulturalItineraryDraft(baseParams);

      draft.days.forEach((day) => {
        day.activities.forEach((activity) => {
          expect(activity.culturalPillar).toBeDefined();
          expect(activity.culturalPillar.length).toBeGreaterThan(3);
          expect(activity.unverifiedEstimateNotice).toBeDefined();
        });
      });
    });
  });

  describe('4. Explicit Unverified Estimation Notices & No Fabricated Bookings', () => {
    it('explicitly marks travel times, opening hours, prices, and availability as unverified estimates', () => {
      const draft = generateCulturalItineraryDraft(baseParams);

      expect(draft.disclaimers.bookingNotice).toBe(CONCIERGE_DISCLAIMERS.bookingNotice);
      expect(draft.disclaimers.estimationNotice).toBe(CONCIERGE_DISCLAIMERS.estimationNotice);
      expect(draft.disclaimers.engineNotice).toBe(CONCIERGE_DISCLAIMERS.engineNotice);

      expect(draft.disclaimers.bookingNotice).toContain('No bookings, tickets, or hotel reservations have been made');
      expect(draft.disclaimers.estimationNotice).toContain('unverified estimates');

      draft.days.forEach((day) => {
        day.activities.forEach((act) => {
          expect(act.unverifiedEstimateNotice).toBeDefined();
          expect(act.estimatedDuration).toBeDefined();
        });
      });
    });
  });

  describe('5. Trip Model Conversion & Editing into My Trips', () => {
    it('converts an itinerary draft into a valid Travi Trip object ready for saving', () => {
      const draft = generateCulturalItineraryDraft(baseParams);
      const trip = convertDraftToTrip(draft);

      expect(trip.title).toBe(draft.title);
      expect(trip.destination).toContain(draft.destinationName);
      expect(trip.status).toBe('planning');
      expect(trip.daysCount).toBe(draft.durationDays);
      expect(trip.itineraryStops.length).toBe(draft.days.length);
    });

    it('allows editing draft parameters before saving', () => {
      const draft = generateCulturalItineraryDraft(baseParams);
      const updatedDraft = {
        ...draft,
        title: 'Customized Kyoto Contemplative Retreat',
        durationDays: 4,
      };

      const trip = convertDraftToTrip(updatedDraft);
      expect(trip.title).toBe('Customized Kyoto Contemplative Retreat');
      expect(trip.daysCount).toBe(4);
    });

    it('preserves personalized day notes when converting draft to trip', () => {
      const draft = generateCulturalItineraryDraft(baseParams);
      draft.days[0].notes = 'Early dawn photography access at rock garden.';
      draft.days[1].notes = 'Meet master tea farmer at 2 PM.';

      const trip = convertDraftToTrip(draft);
      expect(trip.dayNotes).toBeDefined();
      expect(trip.dayNotes?.[1]).toBe('Early dawn photography access at rock garden.');
      expect(trip.dayNotes?.[2]).toBe('Meet master tea farmer at 2 PM.');
    });
  });
});

import type { Destination, TasteProfile } from '../../types/index.ts';
import type {
  RecommendationProvider,
  RecommendationQuery,
  RecommendationResult,
  DestinationRecommendation,
  ProviderMetadata,
} from './types.ts';
import { LocalDeterministicRecommendationProvider } from './LocalDeterministicProvider.ts';

export type ExplicitProviderState =
  | 'Vietnam Travel Discovery Engine (Active)'
  | 'Local Deterministic Mode'
  | 'External AI Provider (Configured)';

class RecommendationServiceImpl {
  private provider: RecommendationProvider;

  constructor(defaultProvider?: RecommendationProvider) {
    this.provider = defaultProvider || new LocalDeterministicRecommendationProvider();
  }

  /**
   * Swap or register a new recommendation provider
   */
  public setProvider(provider: RecommendationProvider): void {
    this.provider = provider;
  }

  public getActiveProvider(): RecommendationProvider {
    return this.provider;
  }

  public getExplicitState(): ExplicitProviderState {
    return 'Vietnam Travel Discovery Engine (Active)';
  }

  public getProviderMetadata(): ProviderMetadata {
    return this.provider.getMetadata();
  }

  public getRecommendations(query: RecommendationQuery): RecommendationResult {
    return this.provider.getRecommendations(query);
  }

  public async getRecommendationsAsync(query: RecommendationQuery): Promise<RecommendationResult> {
    return Promise.resolve(this.provider.getRecommendations(query));
  }

  public getDestinationAffinity(
    destinationId: string,
    tasteProfile: TasteProfile,
    destinations?: Destination[]
  ): DestinationRecommendation | null {
    return this.provider.getDestinationAffinity(destinationId, tasteProfile, destinations);
  }
}

export const recommendationService = new RecommendationServiceImpl();
export { LocalDeterministicRecommendationProvider };

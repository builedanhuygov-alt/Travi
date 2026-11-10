export type Locale = 'vi' | 'en';

export interface TranslationDictionary {
  brand: {
    name: string;
    tagline: string;
    description: string;
    mission: string;
  };
  nav: {
    discover: string;
    destinations: string;
    experiences: string;
    stories: string;
    saved: string;
    planner: string;
    searchPlaceholder: string;
    searchShortcut: string;
  };
  search: {
    title: string;
    inputPlaceholder: string;
    recentSearches: string;
    clearHistory: string;
    suggestions: string;
    quickCurated: string;
    noResults: string;
    noResultsDesc: string;
    trySearching: string;
    groups: {
      destinations: string;
      experiences: string;
      food: string;
      heritage: string;
      stories: string;
    };
    filters: {
      all: string;
      allRegions: string;
      allCategories: string;
      region: string;
      category: string;
    };
  };
  regions: {
    all: string;
    north: string;
    central: string;
    highlands: string;
    south: string;
  };
  categories: {
    nature: string;
    beaches: string;
    heritage: string;
    food: string;
    culture: string;
    adventure: string;
    wellness: string;
    hiddenGems: string;
    photography: string;
  };
  experienceCategories: {
    all: string;
    food: string;
    culture: string;
    nature: string;
    crafts: string;
    localLife: string;
    festivals: string;
    wellness: string;
    family: string;
  };
  storyCategories: {
    all: string;
    localCulture: string;
    foodOrigins: string;
    heritageLineage: string;
    craftVillages: string;
    photoEssay: string;
    travelGuide: string;
  };
  provenance: {
    official: string;
    editorial: string;
    community: string;
    aiAssisted: string;
    unverified: string;
    reviewedUnder: string;
  };
  recommendations: {
    cultureFit: string;
    regionFit: string;
    savedFit: string;
    editorialTrust: string;
    noveltyFit: string;
    familyFit: string;
    natureFit: string;
    culinaryFit: string;
    curatedPick: string;
  };
  actions: {
    save: string;
    saved: string;
    markExplored: string;
    explored: string;
    exploreMore: string;
    viewDetails: string;
    startPlanning: string;
    share: string;
    linkCopied: string;
    close: string;
    cancel: string;
    confirm: string;
    filter: string;
    clear: string;
    readMore: string;
    readTime: string;
    createCollection: string;
  };
  common: {
    loading: string;
    error: string;
    empty: string;
    notAvailable: string;
    vndCurrency: string;
  };
}

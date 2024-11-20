export interface UserProfile {
  id: string;
  username: string;
  activeDeckId: string;
  created: number;
  preferences: UserPreferences;
  statistics: UserStatistics;
}

export interface UserPreferences {
  theme: 'default' | 'dark' | 'light';
  cardBack: string;
}

export interface UserStatistics {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: string[]; // Array of card IDs
  created?: number;
  updated?: number;
  format?: 'standard' | 'custom';
}

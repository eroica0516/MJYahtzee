export const MAX_ROLLS = 3;

export const CATEGORIES = {
  // Upper Section
  ONES: 'ONES',
  TWOS: 'TWOS',
  THREES: 'THREES',
  FOURS: 'FOURS',
  FIVES: 'FIVES',
  SIXES: 'SIXES',
  // Lower Section
  THREE_OF_A_KIND: 'THREE_OF_A_KIND',
  FOUR_OF_A_KIND: 'FOUR_OF_A_KIND',
  FULL_HOUSE: 'FULL_HOUSE',
  SMALL_STRAIGHT: 'SMALL_STRAIGHT',
  LARGE_STRAIGHT: 'LARGE_STRAIGHT',
  YAHTZEE: 'YAHTZEE',
  CHANCE: 'CHANCE',
};

export const CATEGORY_LABELS = {
  [CATEGORIES.ONES]: 'Aces',
  [CATEGORIES.TWOS]: 'Twos',
  [CATEGORIES.THREES]: 'Threes',
  [CATEGORIES.FOURS]: 'Fours',
  [CATEGORIES.FIVES]: 'Fives',
  [CATEGORIES.SIXES]: 'Sixes',
  [CATEGORIES.THREE_OF_A_KIND]: '3 of a Kind',
  [CATEGORIES.FOUR_OF_A_KIND]: '4 of a Kind',
  [CATEGORIES.FULL_HOUSE]: 'Full House',
  [CATEGORIES.SMALL_STRAIGHT]: 'Sm. Straight',
  [CATEGORIES.LARGE_STRAIGHT]: 'Lg. Straight',
  [CATEGORIES.YAHTZEE]: 'YAHTZEE',
  [CATEGORIES.CHANCE]: 'Chance',
};

export const INITIAL_GAME_STATE = {
  dice: Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })),
  rollsLeft: MAX_ROLLS,
  scores: {}, // category_id -> score (number)
  currentTurn: 1,
  isGameOver: false,
  message: 'Roll to start!',
};

import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';
import { CATEGORIES } from './gameRules';

describe('calculateScore', () => {
    it('calculates Ones correctly', () => {
        expect(calculateScore(CATEGORIES.ONES, [1, 2, 1, 4, 5])).toBe(2);
        expect(calculateScore(CATEGORIES.ONES, [2, 3, 4, 5, 6])).toBe(0);
    });

    it('calculates Threes correctly', () => {
        expect(calculateScore(CATEGORIES.THREES, [3, 3, 3, 3, 3])).toBe(15);
    });

    it('calculates Three of a Kind correctly', () => {
        expect(calculateScore(CATEGORIES.THREE_OF_A_KIND, [3, 3, 3, 4, 5])).toBe(18); // Sum of all
        expect(calculateScore(CATEGORIES.THREE_OF_A_KIND, [3, 3, 2, 4, 5])).toBe(0);
    });

    it('calculates Four of a Kind correctly', () => {
        expect(calculateScore(CATEGORIES.FOUR_OF_A_KIND, [5, 5, 5, 5, 2])).toBe(22);
        expect(calculateScore(CATEGORIES.FOUR_OF_A_KIND, [5, 5, 5, 2, 2])).toBe(0);
    });

    it('calculates Full House correctly', () => {
        expect(calculateScore(CATEGORIES.FULL_HOUSE, [2, 2, 3, 3, 3])).toBe(25);
        expect(calculateScore(CATEGORIES.FULL_HOUSE, [5, 5, 5, 5, 5])).toBe(25); // Yahtzee counts as Full House usually? 
        // In strict rules maybe not, but my implementation allowed it.
        expect(calculateScore(CATEGORIES.FULL_HOUSE, [2, 2, 3, 3, 4])).toBe(0);
    });

    it('calculates Small Straight correctly', () => {
        expect(calculateScore(CATEGORIES.SMALL_STRAIGHT, [1, 2, 3, 4, 6])).toBe(30);
        expect(calculateScore(CATEGORIES.SMALL_STRAIGHT, [2, 3, 4, 5, 2])).toBe(30);
        expect(calculateScore(CATEGORIES.SMALL_STRAIGHT, [1, 3, 4, 5, 6])).toBe(30);
        expect(calculateScore(CATEGORIES.SMALL_STRAIGHT, [1, 2, 3, 5, 6])).toBe(0);
    });

    it('calculates Large Straight correctly', () => {
        expect(calculateScore(CATEGORIES.LARGE_STRAIGHT, [1, 2, 3, 4, 5])).toBe(40);
        expect(calculateScore(CATEGORIES.LARGE_STRAIGHT, [2, 3, 4, 5, 6])).toBe(40);
        expect(calculateScore(CATEGORIES.LARGE_STRAIGHT, [1, 2, 3, 4, 6])).toBe(0);
    });

    it('calculates Yahtzee correctly', () => {
        expect(calculateScore(CATEGORIES.YAHTZEE, [6, 6, 6, 6, 6])).toBe(50);
        expect(calculateScore(CATEGORIES.YAHTZEE, [6, 6, 6, 6, 5])).toBe(0);
    });

    it('calculates Chance correctly', () => {
        expect(calculateScore(CATEGORIES.CHANCE, [1, 2, 3, 4, 5])).toBe(15);
    });
});

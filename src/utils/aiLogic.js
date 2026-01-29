import { CATEGORIES, MAX_ROLLS } from './gameRules';

const AI_NAMES = [
    'Titan', 'Behemoth', 'Vanguard', 'Strider', 'Nemesis',
    'Apex', 'Quantum', 'Cipher', 'Alpha', 'Omega',
    'Sentinel', 'Maverick', 'Vortex', 'Zenith', 'Goliath',
    'Phantom', 'Thunder', 'Blaze', 'Warlord', 'Shadow'
];

export const getRandomAIName = () => {
    return AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
};

/**
 * Determines which dice the AI should hold based on current roll and game state.
 * Returns an array of dice IDs to hold.
 */
export const getBestHold = (dice, scores, rollsLeft) => {
    const currentValues = dice.map(d => d.value).sort((a, b) => a - b);
    const counts = {};
    dice.forEach(d => { counts[d.value] = (counts[d.value] || 0) + 1; });

    // Helper: is category filled?
    const isFilled = (cat) => scores[cat] !== undefined;

    // --- 1. YAHTZEE Check ---
    // If we have 4 or 5 of a kind, go for Yahtzee!
    for (const [val, count] of Object.entries(counts)) {
        if (count >= 4) {
            // Always hold all of them to try for 5 (or keep the 5)
            // UNLESS we already have Yahtzee and Upper Section for this number is full?
            // Nah, always go for Yahtzee bonus or high upper score.
            return dice.filter(d => d.value === parseInt(val)).map(d => d.id);
        }
    }

    // --- 2. Large Straight / Small Straight Logic ---
    // If Straights are open, look for sequences
    const hasLargeStraightStr = !isFilled(CATEGORIES.LARGE_STRAIGHT);
    const hasSmallStraightStr = !isFilled(CATEGORIES.SMALL_STRAIGHT);

    if (hasLargeStraightStr || hasSmallStraightStr) {
        const uniqueVals = [...new Set(currentValues)];
        // Check for run of 4 (Large Straight ready, or Small Straight made)
        let longestRun = [];
        let currentRun = [uniqueVals[0]];

        for (let i = 1; i < uniqueVals.length; i++) {
            if (uniqueVals[i] === uniqueVals[i - 1] + 1) {
                currentRun.push(uniqueVals[i]);
            } else {
                if (currentRun.length > longestRun.length) longestRun = currentRun;
                currentRun = [uniqueVals[i]];
            }
        }
        if (currentRun.length > longestRun.length) longestRun = currentRun;

        // If we have 4 sequential, hold them! (Guarantees Small Straight, aims for Large)
        if (longestRun.length >= 4) {
            // Keep dice that match the run
            return dice.filter(d => longestRun.includes(d.value)).map(d => d.id);
        }

        // If we have 3 sequential AND Small Straight is needed, maybe hold?
        // Only if we don't have a better "pairs" plan.
        if (longestRun.length === 3 && hasSmallStraightStr && rollsLeft > 0) {
            // Example: 2,3,4 -> Need 1 or 5.
            // This is decent, but maybe pairs are better?
            // Let's implement a "Straight Strategy" flag if we determine this is our best bet.
            // For now, let's prioritize Straights only if we don't have 3-of-a-kind.
        }
    }

    // --- 3. Upper Section & N-of-a-kind Strategy ---
    // Find the "best" number to hold based on frequency and value
    let bestVal = 0;
    let bestCount = 0;

    // Filter out counts for numbers where Upper Section is ALREADY FULL
    // UNLESS we need 3/4-of-a-kind or Yahtzee

    // Priorities:
    // 1. Numbers we have 3+ of (for 3/4 kind / Yahtzee / Upper)
    // 2. High numbers (4,5,6) we have 2+ of (for Upper Bonus)
    // 3. Any pairs?

    for (const [valStr, count] of Object.entries(counts)) {
        const val = parseInt(valStr);
        // Map 1-6 to category keys
        const upperCatMap = [null, CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES];
        const isUpperFilled = isFilled(upperCatMap[val]);

        let priority = 0;

        if (count >= 3) priority += 10;
        if (count === 2) priority += 5;

        // Bonus for targeting open Upper Section
        if (!isUpperFilled) {
            priority += 2;
            if (val >= 4) priority += 3; // Focus on 4,5,6 for Bonus
        }

        // Bonus if n-of-a-kind categories are open
        if (!isFilled(CATEGORIES.THREE_OF_A_KIND) || !isFilled(CATEGORIES.FOUR_OF_A_KIND)) {
            if (count >= 2) priority += 2;
        }

        if (priority > bestCount) {
            bestCount = priority;
            bestVal = val;
        } else if (priority === bestCount) {
            // Break ties with value
            if (val > bestVal) bestVal = val;
        }
    }

    // Execution:
    // If we found a good target value (priority >= 5 implies at least a pair or open high number)
    if (bestCount >= 5 && bestVal > 0) {
        return dice.filter(d => d.value === bestVal).map(d => d.id);
    }

    // --- 4. Fallback / "Trash" Logic ---
    // If we have nothing (singletons):
    // - If it's early rolls (rollsLeft > 0), keep High numbers (4,5,6) if Upper open.
    // - Or keep a Straight start? (e.g. 2,3,4,5 mixed with a 1)

    // Simple fallback: Keep 5s and 6s if their upper section is open
    const keep6 = !isFilled(CATEGORIES.SIXES);
    const keep5 = !isFilled(CATEGORIES.FIVES);

    let fallbackIds = [];
    dice.forEach(d => {
        if (d.value === 6 && keep6) fallbackIds.push(d.id);
        else if (d.value === 5 && keep5) fallbackIds.push(d.id);
    });

    if (fallbackIds.length > 0) return fallbackIds;

    // Last resort: Hold nothing (Reroll all) to chance it
    return [];
};

/**
 * Determines the best category for the AI to pick given current dice.
 */
export const getBestCategory = (possibleScores, filledCategories) => {
    let bestCategory = null;
    let maxWeight = -Infinity;

    const isFilled = (cat) => filledCategories[cat] !== undefined;

    for (const [category, score] of Object.entries(possibleScores)) {
        if (isFilled(category)) continue;

        let weight = score; // Start with raw score

        // --- Weight Adjustments ---

        // 1. YAHTZEE
        // Always take Yahtzee if it's a valid 50 points (or 0 if we must scratch it)
        if (category === CATEGORIES.YAHTZEE) {
            if (score === 50) weight += 1000;
            else weight -= 50; // Try not to scratch Yahtzee unless necessary
        }

        // 2. Upper Section Logic
        // Prioritize filling Upper Section to catch the 35pt bonus
        if ([CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES].includes(category)) {
            const valMap = {
                [CATEGORIES.ONES]: 1, [CATEGORIES.TWOS]: 2, [CATEGORIES.THREES]: 3,
                [CATEGORIES.FOURS]: 4, [CATEGORIES.FIVES]: 5, [CATEGORIES.SIXES]: 6
            };
            const val = valMap[category];
            const target = val * 3; // Par score (3 of a kind)

            if (score >= target) {
                weight += 20; // Good roll for this number
            } else if (score === 0) {
                // Scratching logic
                if (val <= 2) weight -= 5; // Aces/Twos are fine to scratch
                else weight -= 20 * val; // Don't scratch high numbers
            } else {
                // Sub-par score (e.g. 2 of a kind)
                weight -= 5;
            }
        }

        // 3. Lower Section Logic

        // Straights: 
        // If we have them (score > 0), they are valuable.
        // If score is 0, apply penalty to avoid scratching them early
        if ((category === CATEGORIES.SMALL_STRAIGHT || category === CATEGORIES.LARGE_STRAIGHT) && score === 0) {
            weight -= 20;
        }

        // Full House:
        // No artificial boost needed. 25 pts is solid. 
        // If we have a Joker (forced Full House), scoring 25 is better than 0.
        // But if Joker gives Large Straight (40), the raw score (40) dominates (25).
        // This ensures proper Joker strategy.

        // Chance:
        // Save for high rolls.
        if (category === CATEGORIES.CHANCE) {
            if (score < 20) weight -= 15;
        }

        // 3/4 of a Kind:
        // Avoid taking low scores here
        if (category === CATEGORIES.THREE_OF_A_KIND || category === CATEGORIES.FOUR_OF_A_KIND) {
            if (score < 15 && score > 0) weight -= 5;
            if (score === 0) weight -= 10;
        }

        if (weight > maxWeight) {
            maxWeight = weight;
            bestCategory = category;
        }
    }

    // Fallback if no best category found (should not happen if possibleScores has options)
    if (!bestCategory) {
        // Pick first available
        for (const category of Object.keys(possibleScores)) {
            if (!isFilled(category)) return category;
        }
    }

    return bestCategory;
};

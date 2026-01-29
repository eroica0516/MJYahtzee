import { CATEGORIES, MAX_ROLLS } from './gameRules';

const AI_NAMES = ['Bot Bill', 'Robo Mike', 'Lisa CP', 'Hal 9000', 'Data'];

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
    let maxWeight = -1000; // Allow negatives for "bad choices"

    const isFilled = (cat) => filledCategories[cat] !== undefined;

    for (const [category, score] of Object.entries(possibleScores)) {
        if (isFilled(category)) continue;

        let weight = score; // Start with raw score

        // --- Weight Adjustments ---

        // 1. YAHTZEE
        if (category === CATEGORIES.YAHTZEE) {
            if (score === 50) weight += 1000; // Always take Yahtzee
            else weight = -100; // Never take 0 on Yahtzee unless forced (handled later)
        }

        // 2. Upper Section Logic
        if (['ONES', 'TWOS', 'THREES', 'FOURS', 'FIVES', 'SIXES'].includes(category)) {
            // Target: 3 of a kind for upper (e.g. 3x6 = 18).
            // If score >= 3 * val, good. Else bad.
            const valMap = { ONES: 1, TWOS: 2, THREES: 3, FOURS: 4, FIVES: 5, SIXES: 6 };
            const val = valMap[category];
            const target = val * 3;

            if (score >= target) {
                weight += 20; // Great! Helps bonus.
            } else if (score === 0) {
                // Taking a 0 on Upper
                if (val <= 2) weight -= 5; // 1s and 2s are fine to "trash"
                else weight -= 20 * val; // Don't trash 4s/5s/6s easily
            } else {
                // Sub-par score (e.g. two 6s = 12). 
                // Okay fallback, but maybe look for Chance?
                weight -= 5;
            }
        }

        // 3. Lower Section Logic

        // Straights: Fixed scores (30/40)
        // If 0, heavy penalty? No, taking 0 on straights is common if we missed.
        // But we prefer filling "trash" (1s, 2s) over 0-ing a straight early.
        if ((category === CATEGORIES.SMALL_STRAIGHT || category === CATEGORIES.LARGE_STRAIGHT) && score === 0) {
            weight -= 15; // Try not to X out straights too early
        }

        // Full House: 25.
        if (category === CATEGORIES.FULL_HOUSE) {
            if (score === 25) weight += 15;
        }

        // Chance: Sum.
        // Save chance for High Sums when other boxes fail.
        if (category === CATEGORIES.CHANCE) {
            if (score < 20) weight -= 10; // Don't waste Chance on low roll
        }

        // 3/4 of a Kind: Sum.
        // If score is low (< 15), treat as poor.
        if (category === CATEGORIES.THREE_OF_A_KIND || category === CATEGORIES.FOUR_OF_A_KIND) {
            if (score < 15 && score > 0) weight -= 5;
            if (score === 0) weight -= 10;
        }

        if (weight > maxWeight) {
            maxWeight = weight;
            bestCategory = category;
        }
    }

    // Fallback: If all weights are terrible (e.g. forced to take a 0),
    // we need to pick the "least bad" option.
    // The loop above already calculates weights, so `maxWeight` should point to the least bad.
    // But if maxWeight is very negative, it means we are taking a 0 or wasted category.
    // Ideally we "trash" Ones or Twos.

    // Re-check: Did we pick 'null' or existing best?
    // If logic above works, `maxWeight` tracks the highest value found.
    // If array was empty (impossible if game checks), returns null.

    // Fallback Safety:
    // If we somehow didn't pick a category (e.g. logic error or all weights super negative),
    // and we still have open categories, we MUST pick one to avoid game hang.
    if (!bestCategory) {
        for (const category of Object.keys(possibleScores)) {
            if (!isFilled(category)) {
                return category;
            }
        }
    }

    return bestCategory;
};

import { CATEGORIES } from './gameRules.js';

const sum = (dice) => dice.reduce((a, b) => a + b, 0);

const getFrequencies = (diceValues) => {
    const freqs = {};
    diceValues.forEach((v) => {
        freqs[v] = (freqs[v] || 0) + 1;
    });
    return freqs;
};

export const calculateScore = (category, diceValues, isJoker = false) => {
    const freqs = getFrequencies(diceValues);
    const total = sum(diceValues);
    const values = new Set(diceValues);

    switch (category) {
        // Upper Section
        case CATEGORIES.ONES: return (freqs[1] || 0) * 1;
        case CATEGORIES.TWOS: return (freqs[2] || 0) * 2;
        case CATEGORIES.THREES: return (freqs[3] || 0) * 3;
        case CATEGORIES.FOURS: return (freqs[4] || 0) * 4;
        case CATEGORIES.FIVES: return (freqs[5] || 0) * 5;
        case CATEGORIES.SIXES: return (freqs[6] || 0) * 6;

        // Lower Section
        case CATEGORIES.THREE_OF_A_KIND:
            return Object.values(freqs).some((count) => count >= 3) ? total : 0;

        case CATEGORIES.FOUR_OF_A_KIND:
            return Object.values(freqs).some((count) => count >= 4) ? total : 0;

        case CATEGORIES.FULL_HOUSE: {
            if (isJoker) return 25; // Joker rule: Forced Full House points
            const counts = Object.values(freqs);
            const hasThree = counts.includes(3);
            const hasTwo = counts.includes(2);
            // Standard: 3 of one, 2 of another. (5 of a kind handled by Joker rule or treated as 0 otherwise by strict rules, but often accepted. Let's stick to strict + Joker)
            const isYahtzee = counts.includes(5);
            if ((hasThree && hasTwo) || isYahtzee) return 25;
            return 0;
        }

        case CATEGORIES.SMALL_STRAIGHT: {
            if (isJoker) return 30; // Joker rule
            const sortedUnique = Array.from(values).sort((a, b) => a - b);
            let run = 0;
            let maxRun = 0;
            for (let i = 0; i < sortedUnique.length - 1; i++) {
                if (sortedUnique[i + 1] === sortedUnique[i] + 1) {
                    run++;
                } else {
                    run = 0;
                }
                if (run > maxRun) maxRun = run;
            }
            return maxRun >= 3 ? 30 : 0;
        }

        case CATEGORIES.LARGE_STRAIGHT: {
            if (isJoker) return 40; // Joker rule
            const sortedUnique = Array.from(values).sort((a, b) => a - b);
            const str = sortedUnique.join('');
            return (str === '12345' || str === '23456') ? 40 : 0;
        }

        case CATEGORIES.YAHTZEE:
            return Object.values(freqs).includes(5) ? 50 : 0;

        case CATEGORIES.CHANCE:
            return total;

        default:
            return 0;
    }
};

export const calculatePossibleScores = (diceValues, currentScores = {}) => {
    // Detect Joker Condition:
    // 1. It is a Yahtzee (5 of a kind)
    // 2. The Yahtzee category is already filled (score is not undefined)
    const freqs = getFrequencies(diceValues);
    const isYahtzeeRoll = Object.values(freqs).includes(5);
    const yahtzeeFilled = currentScores[CATEGORIES.YAHTZEE] !== undefined && currentScores[CATEGORIES.YAHTZEE] !== null;

    // Joker applies if we rolled a Yahtzee but the slot is already filled
    const isJoker = isYahtzeeRoll && yahtzeeFilled;

    // Helper map to find category for a number
    const numberToCategory = {
        1: CATEGORIES.ONES,
        2: CATEGORIES.TWOS,
        3: CATEGORIES.THREES,
        4: CATEGORIES.FOURS,
        5: CATEGORIES.FIVES,
        6: CATEGORIES.SIXES
    };

    let forcedCategory = null;
    if (isJoker) {
        // Find the number rolled
        const rolledNumber = parseInt(Object.keys(freqs).find(key => freqs[key] === 5));
        const correspondingCat = numberToCategory[rolledNumber];

        // If corresponding upper section is empty, MUST choose it
        if (currentScores[correspondingCat] === undefined || currentScores[correspondingCat] === null) {
            forcedCategory = correspondingCat;
        }
    }

    const scores = {};
    Object.values(CATEGORIES).forEach((cat) => {
        // If we are forced to a specific category, only calculate for that one
        if (forcedCategory && cat !== forcedCategory) {
            return; // undefined score = not selectable
        }

        scores[cat] = calculateScore(cat, diceValues, isJoker);
    });
    return scores;
};

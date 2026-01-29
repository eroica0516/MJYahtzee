import { CATEGORIES } from './gameRules';

const sum = (dice) => dice.reduce((a, b) => a + b, 0);

const getFrequencies = (diceValues) => {
    const freqs = {};
    diceValues.forEach((v) => {
        freqs[v] = (freqs[v] || 0) + 1;
    });
    return freqs;
};

export const calculateScore = (category, diceValues) => {
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
            const counts = Object.values(freqs);
            const uniqueCount = counts.length;
            // Full house is either [3, 2] or [5] (if Yahtzee plays as FH)
            // Standard rules: 3 of one, 2 of another. 
            // If 5 of a kind, it technically meets the condition (3 of X and 2 of X), but usually printed rules say 3 of one, 2 of ANOTHER.
            // However, typical digital implementations allow Yahtzee to count as Full House (25 pts).
            // Let's stick to standard: Must be 3 of one number and 2 of another.
            const hasThree = counts.includes(3);
            const hasTwo = counts.includes(2);
            const isYahtzee = counts.includes(5);

            // Allow Yahtzee as full house? Usually yes as a Joker, but let's be strict for now or check rules.
            // Standard Hasbro rules: "3 of one number and 2 of another". So [5] is NOT a full house purely.
            // But Joker rules apply if Yahtzee box is filled.
            // We will handle Joker logic at the game level, here we calculate "natural" score.
            if ((hasThree && hasTwo) || isYahtzee) return 25;
            return 0;
        }

        case CATEGORIES.SMALL_STRAIGHT: {
            // 4 sequential dice.
            // 1-2-3-4, 2-3-4-5, 3-4-5-6
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
            return maxRun >= 3 ? 30 : 0; // run of 3 pairs means 4 numbers
        }

        case CATEGORIES.LARGE_STRAIGHT: {
            const sortedUnique = Array.from(values).sort((a, b) => a - b);
            // Must be 5 sequential
            // 1-2-3-4-5 or 2-3-4-5-6
            // Since unique, length must be 5 and max-min = 4? No, could be 1,2,3,4,6 (range 5).
            // Just check if it matches exactly.
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

export const calculatePossibleScores = (diceValues) => {
    const scores = {};
    Object.values(CATEGORIES).forEach((cat) => {
        scores[cat] = calculateScore(cat, diceValues);
    });
    return scores;
};

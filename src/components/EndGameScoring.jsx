import React, { useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_LABELS } from '../utils/gameRules';
import './EndGameScoring.css';

const EndGameScoring = ({ userScores, aiScores, playerNames, onPlayAgain, userYahtzeeBonus = 0, aiYahtzeeBonus = 0 }) => {
    const [currentStep, setCurrentStep] = useState(-1);
    const [userTotal, setUserTotal] = useState(0);
    const [aiTotal, setAiTotal] = useState(0);

    // Safety check for CATEGORIES
    if (!CATEGORIES) {
        console.error("CATEGORIES is undefined");
        return null;
    }

    // Flatten categories for iteration
    const orderedCategories = [
        ...[CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES],
        'BONUS', // Upper Bonus
        ...[CATEGORIES.THREE_OF_A_KIND, CATEGORIES.FOUR_OF_A_KIND, CATEGORIES.FULL_HOUSE, CATEGORIES.SMALL_STRAIGHT, CATEGORIES.LARGE_STRAIGHT, CATEGORIES.YAHTZEE, CATEGORIES.CHANCE]
    ];

    const getScore = (scores, cat) => {
        if (!scores) return 0;
        return scores[cat] || 0;
    };

    useEffect(() => {
        console.log("EndGameScoring Mounted");
        console.log("Ordered Categories:", orderedCategories);

        let step = 0;
        // Safety: Ensure we have scores
        if (!userScores || !aiScores) {
            console.error("Scores missing in EndGameScoring");
            // Force finish
            setCurrentStep(orderedCategories.length + 1);
            return;
        }

        const interval = setInterval(() => {
            if (step >= orderedCategories.length) {
                clearInterval(interval);
                setCurrentStep(orderedCategories.length); // Show Grand Total
                setTimeout(() => {
                    setCurrentStep(orderedCategories.length + 1); // Show Winner
                }, 1500);
                return;
            }

            setCurrentStep(step);
            const cat = orderedCategories[step];
            console.log("Step:", step, "Category:", cat);

            if (!cat) {
                // Skip undefined categories if any
                step++;
                return;
            }

            try {
                if (cat === 'BONUS') {
                    const upperCats = [CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES];
                    const uSum = upperCats.reduce((acc, c) => acc + getScore(userScores, c), 0);
                    const aSum = upperCats.reduce((acc, c) => acc + getScore(aiScores, c), 0);

                    const uBonus = uSum >= 63 ? 35 : 0;
                    const aBonus = aSum >= 63 ? 35 : 0;

                    setUserTotal(prev => prev + uBonus);
                    setAiTotal(prev => prev + aBonus);
                } else {
                    let uVal = getScore(userScores, cat);
                    let aVal = getScore(aiScores, cat);

                    if (cat === CATEGORIES.YAHTZEE) {
                        uVal += userYahtzeeBonus;
                        aVal += aiYahtzeeBonus;
                    }

                    setUserTotal(prev => prev + uVal);
                    setAiTotal(prev => prev + aVal);
                }
            } catch (e) {
                console.error("Error calculating score for step", step, cat, e);
            }

            step++;
        }, 600); // Faster speed

        return () => clearInterval(interval);
    }, []); // Empty dependency logic is fine

    const userWin = userTotal > aiTotal;
    const tie = userTotal === aiTotal;

    // Safety check for playerNames
    const pNames = playerNames || { user: 'You', ai: 'Computer' };

    return (
        <div className="end-game-overlay">
            <div className="end-game-modal">
                <h2>Final Scoring</h2>

                <div className="scoring-grid">
                    <div className="grid-header">
                        <span>Category</span>
                        <span>{pNames.user}</span>
                        <span>{pNames.ai}</span>
                    </div>

                    {orderedCategories.map((cat, index) => {
                        if (index > currentStep) return null;
                        if (!cat) return null;

                        const isCurrent = index === currentStep;
                        let label = '';
                        if (cat === 'BONUS') {
                            label = 'Upper Bonus (35)';
                        } else {
                            label = CATEGORY_LABELS[cat] || cat;
                        }

                        let uScore = 0;
                        let aScore = 0;

                        if (cat === 'BONUS') {
                            const upperCats = [CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES];
                            const uSum = upperCats.reduce((acc, c) => acc + getScore(userScores, c), 0);
                            const aSum = upperCats.reduce((acc, c) => acc + getScore(aiScores, c), 0);
                            uScore = uSum >= 63 ? 35 : 0;
                            aScore = aSum >= 63 ? 35 : 0;
                        } else {
                            uScore = getScore(userScores, cat);
                            aScore = getScore(aiScores, cat);

                            if (cat === CATEGORIES.YAHTZEE) {
                                uScore += userYahtzeeBonus;
                                aScore += aiYahtzeeBonus;
                            }
                        }

                        return (
                            <div key={cat} className={`grid-row ${isCurrent ? 'highlight' : ''}`}>
                                <span className="cat-label">{label}</span>
                                <span className="cat-score">{uScore}</span>
                                <span className="cat-score">{aScore}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="total-display">
                    <div className="total-row">
                        <span>Total:</span>
                        <span className="total-score user">{userTotal}</span>
                        <span className="total-score ai">{aiTotal}</span>
                    </div>
                </div>

                {currentStep > orderedCategories.length && (
                    <div className="winner-announcement">
                        {tie ? (
                            <h3>It's a Tie!</h3>
                        ) : (
                            <h3>{userWin ? 'You Win! 🎉' : `${pNames.ai} Wins! 🤖`}</h3>
                        )}
                        <button className="btn-play-again" onClick={onPlayAgain}>Play Again</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndGameScoring;

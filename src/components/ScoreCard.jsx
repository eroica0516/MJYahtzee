import React from 'react';
import { CATEGORIES, CATEGORY_LABELS } from '../utils/gameRules';
import './ScoreCard.css';

const ScoreRow = ({
    label,
    userScore,
    aiScore,
    possibleScore,
    onSelect,
    isUserTurn,
    isActive,
    isLastUserSelection,
    isLastAiSelection
}) => {
    const isUserFilled = userScore !== undefined && userScore !== null;
    const isAiFilled = aiScore !== undefined && aiScore !== null;

    // Show possible score only if it's user's turn, user hasn't filled this yet, and we have a possible score
    const showPossible = !isUserFilled && isUserTurn && isActive && possibleScore !== undefined;

    // Winner Calculation
    let userWin = false;
    let aiWin = false;

    // Only highlight if both have played this category
    if (isUserFilled && isAiFilled) {
        if (userScore > aiScore) userWin = true;
        if (aiScore > userScore) aiWin = true;
    }

    return (
        <div className="score-row">
            <span className="label">{label}</span>

            {/* User Column */}
            <div
                className={`score-cell user-cell 
                    ${isUserFilled ? 'filled' : ''} 
                    ${showPossible ? 'selectable' : ''} 
                    ${userWin ? 'winner' : ''}
                    ${isLastUserSelection ? 'latest' : ''}`}
                onClick={showPossible ? () => onSelect(true) : undefined}
            >
                {isUserFilled ? userScore : (showPossible ? possibleScore : '-')}
            </div>

            {/* AI Column */}
            <div className={`score-cell ai-cell 
                ${isAiFilled ? 'filled' : ''} 
                ${aiWin ? 'winner' : ''}
                ${isLastAiSelection ? 'latest' : ''}`}>
                {isAiFilled ? aiScore : '-'}
            </div>
        </div>
    );
};

const SectionHeader = ({ title, userScore, aiScore }) => {
    const userWin = userScore > aiScore;
    const aiWin = aiScore > userScore;

    return (
        <div className="score-row section-header">
            <span className="label">{title}</span>
            <span className={`score-cell user-cell ${userWin ? 'winner' : ''}`}>
                {userScore !== undefined ? userScore : 0}
            </span>
            <span className={`score-cell ai-cell ${aiWin ? 'winner' : ''}`}>
                {aiScore !== undefined ? aiScore : 0}
            </span>
        </div>
    );
};

const ScoreCardHeader = ({ userTotal, aiTotal, userLabel, aiLabel, currentPlayer }) => (
    <div className="score-card-header">
        <div className="header-label">Category</div>
        <div className={`header-name ${currentPlayer === 'user' ? 'active' : ''}`}>
            {userLabel}<br />
            <span className="header-total">({userTotal})</span>
        </div>
        <div className={`header-name ${currentPlayer === 'ai' ? 'active' : ''}`}>
            {aiLabel}<br />
            <span className="header-total">({aiTotal})</span>
        </div>
    </div>
);

const ScoreCard = ({
    userScores,
    aiScores,
    userYahtzeeBonus = 0,
    aiYahtzeeBonus = 0,
    lastSelections,
    possibleScores,
    onSelectCategory,
    isUserTurn,
    isActiveTurn,
    userLabel = "You",
    aiLabel = "Computer"
}) => {

    const getScore = (scores, cat) => scores[cat] || 0;

    const calculateTotal = (scores, bonus = 0) => {
        const upperCats = [CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES];
        const lowerCats = [
            CATEGORIES.THREE_OF_A_KIND, CATEGORIES.FOUR_OF_A_KIND, CATEGORIES.FULL_HOUSE,
            CATEGORIES.SMALL_STRAIGHT, CATEGORIES.LARGE_STRAIGHT, CATEGORIES.YAHTZEE, CATEGORIES.CHANCE
        ];

        const upperSum = upperCats.reduce((acc, cat) => acc + getScore(scores, cat), 0);
        const upperBonus = upperSum >= 63 ? 35 : 0;
        const upperTotal = upperSum + upperBonus;
        const lowerSum = lowerCats.reduce((acc, cat) => acc + getScore(scores, cat), 0);
        const lowerTotal = lowerSum + bonus; // Add Yahtzee Bonus to Lower Section Total (or just Grand Total)

        return { upperSum, upperBonus, upperTotal, lowerTotal, lowerSum, yahtzeeBonus: bonus, grandTotal: upperTotal + lowerTotal };
    };

    const userTotals = calculateTotal(userScores, userYahtzeeBonus);
    const aiTotals = calculateTotal(aiScores, aiYahtzeeBonus);

    const upperCats = [CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES, CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES];
    const lowerCats = [
        CATEGORIES.THREE_OF_A_KIND, CATEGORIES.FOUR_OF_A_KIND, CATEGORIES.FULL_HOUSE,
        CATEGORIES.SMALL_STRAIGHT, CATEGORIES.LARGE_STRAIGHT, CATEGORIES.YAHTZEE, CATEGORIES.CHANCE
    ];

    return (
        <div className="score-card">
            <div className="score-sections-container">
                <div className="section upper-section">
                    <ScoreCardHeader
                        userTotal={userTotals.grandTotal}
                        aiTotal={aiTotals.grandTotal}
                        userLabel={userLabel}
                        aiLabel={aiLabel}
                        currentPlayer={isUserTurn ? 'user' : 'ai'}
                    />
                    <h3>Upper Section</h3>
                    {upperCats.map(cat => (
                        <ScoreRow
                            key={cat}
                            label={CATEGORY_LABELS[cat]}
                            userScore={userScores[cat]}
                            aiScore={aiScores[cat]}
                            possibleScore={possibleScores[cat]}
                            onSelect={() => onSelectCategory(cat)}
                            isUserTurn={isUserTurn}
                            isActive={isActiveTurn}
                            isLastUserSelection={lastSelections?.user === cat}
                            isLastAiSelection={lastSelections?.ai === cat}
                        />
                    ))}

                    <div className="score-row summary-row">
                        <span className="label">Subtotal</span>
                        <span className="score-cell user-cell">{userTotals.upperSum} / 63</span>
                        <span className="score-cell ai-cell">{aiTotals.upperSum} / 63</span>
                    </div>
                    <div className="score-row summary-row bonus">
                        <span className="label">Bonus</span>
                        <span className={`score-cell user-cell ${userTotals.upperBonus > 0 ? 'earned' : ''}`}>+{userTotals.upperBonus}</span>
                        <span className={`score-cell ai-cell ${aiTotals.upperBonus > 0 ? 'earned' : ''}`}>+{aiTotals.upperBonus}</span>
                    </div>
                    <SectionHeader title="Upper Total" userScore={userTotals.upperTotal} aiScore={aiTotals.upperTotal} />
                </div>

                <div className="section lower-section">
                    <ScoreCardHeader
                        userTotal={userTotals.grandTotal}
                        aiTotal={aiTotals.grandTotal}
                        userLabel={userLabel}
                        aiLabel={aiLabel}
                        currentPlayer={isUserTurn ? 'user' : 'ai'}
                    />
                    <h3>Lower Section</h3>
                    {lowerCats.map(cat => {
                        let uScore = userScores[cat];
                        let aScore = aiScores[cat];

                        // Merge Bonus into Yahtzee Score for display
                        if (cat === CATEGORIES.YAHTZEE) {
                            if (uScore !== undefined && userYahtzeeBonus > 0) {
                                uScore += userYahtzeeBonus;
                            }
                            if (aScore !== undefined && aiYahtzeeBonus > 0) {
                                aScore += aiYahtzeeBonus;
                            }
                        }

                        return (
                            <ScoreRow
                                key={cat}
                                label={CATEGORY_LABELS[cat]}
                                userScore={uScore}
                                aiScore={aScore}
                                possibleScore={possibleScores[cat]}
                                onSelect={() => onSelectCategory(cat)}
                                isUserTurn={isUserTurn}
                                isActive={isActiveTurn}
                                isLastUserSelection={lastSelections?.user === cat}
                                isLastAiSelection={lastSelections?.ai === cat}
                            />
                        );
                    })}


                    <SectionHeader title="Lower Total" userScore={userTotals.lowerTotal} aiScore={aiTotals.lowerTotal} />
                </div>
            </div>

            <div className="grand-total-row">
                <span className="label">GRAND TOTAL</span>
                <span className="score-cell user-cell">{userTotals.grandTotal}</span>
                <span className="score-cell ai-cell">{aiTotals.grandTotal}</span>
            </div>
        </div>
    );
};

export default ScoreCard;

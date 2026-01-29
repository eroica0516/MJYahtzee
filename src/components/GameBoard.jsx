import React, { useState, useEffect, useRef } from 'react';
import Dice from './Dice';
import ScoreCard from './ScoreCard';
import EndGameScoring from './EndGameScoring';
import NameInput from './NameInput';
import GameLog from './GameLog';
import {
    calculatePossibleScores,
    calculateScore,
} from '../utils/scoring';
import {
    MAX_ROLLS,
    INITIAL_GAME_STATE,
    CATEGORIES
} from '../utils/gameRules';
import { getRandomAIName, getBestHold, getBestCategory } from '../utils/aiLogic';
import './GameBoard.css';

const GameBoard = () => {
    // --- State ---
    const [gameStarted, setGameStarted] = useState(false);
    const [playerNames, setPlayerNames] = useState({ user: 'You', ai: 'Computer' });
    const [currentPlayer, setCurrentPlayer] = useState('user');

    const [dice, setDice] = useState(Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })));
    const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS);
    const [userScores, setUserScores] = useState({});
    const [aiScores, setAiScores] = useState({});
    // New State for Bonus
    const [userYahtzeeBonus, setUserYahtzeeBonus] = useState(0);
    const [aiYahtzeeBonus, setAiYahtzeeBonus] = useState(0);

    const [possibleScores, setPossibleScores] = useState({});
    const [lastSelections, setLastSelections] = useState({ user: null, ai: null });

    const [rolling, setRolling] = useState(false);
    const [message, setMessage] = useState('New Game! Roll to start.');
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameLog, setGameLog] = useState([]);

    // AI State
    const [aiProcessing, setAiProcessing] = useState(false);

    // --- Helpers ---
    const addToLog = (player, isUser, category, score, diceValues) => {
        setGameLog(prev => [{
            player,
            isUser,
            category,
            score,
            dice: [...diceValues] // Copy
        }, ...prev]);
    };

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const checkYahtzeeBonus = (diceValues, currentScores) => {
        const counts = {};
        diceValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const hasYahtzee = Object.values(counts).includes(5);
        // Bonus only if we have a Yahtzee AND we already scored 50 in the Yahtzee box
        // Rule: "You get a 100 bonus points in the Yahtzee box" (if 50)
        // If 0 in Yahtzee box, NO bonus.
        return hasYahtzee && currentScores[CATEGORIES.YAHTZEE] === 50;
    };

    const isJokerActive = (diceValues, currentScores) => {
        const counts = {};
        diceValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const hasYahtzee = Object.values(counts).includes(5);
        // Joker active if Yahtzee and Yahtzee box filled (0 or 50)
        const yahtzeeFilled = currentScores[CATEGORIES.YAHTZEE] !== undefined && currentScores[CATEGORIES.YAHTZEE] !== null;
        return hasYahtzee && yahtzeeFilled;
    };

    // --- Effects ---

    // 1. Calculate Possible Scores (User only)
    useEffect(() => {
        if (currentPlayer === 'user' && !rolling && rollsLeft < MAX_ROLLS && !isGameOver) {
            setPossibleScores(calculatePossibleScores(dice.map(d => d.value), userScores));
        } else {
            setPossibleScores({});
        }
    }, [dice, rolling, rollsLeft, currentPlayer, isGameOver, userScores]);

    // 2. Game Over Check
    useEffect(() => {
        const totalCats = Object.keys(CATEGORIES).length;
        // Check if all categories are filled
        if (Object.keys(userScores).length === totalCats &&
            Object.keys(aiScores).length === totalCats) {
            setIsGameOver(true);
            setMessage('Game Over! Final Scores...');
        }
    }, [userScores, aiScores]);

    // 3. AI Turn Execution
    useEffect(() => {
        if (currentPlayer === 'ai' && !isGameOver && !aiProcessing) {
            startAITurn();
        }
    }, [currentPlayer, isGameOver]);

    // --- Logic ---

    const startAITurn = async () => {
        setAiProcessing(true);
        setMessage(`${playerNames.ai}'s turn...`);

        await wait(1000);

        // AI Logic Loop
        let currentDice = [...dice]; // Start with current (fresh) dice
        let currentRolls = 3;

        // Loop for up to 3 rolls
        while (currentRolls > 0) {
            // 1. Roll
            setMessage(`${playerNames.ai} is rolling...`);
            setRolling(true);

            // Animation delay
            await wait(600);

            // Calculate new dice values (ensure holding logic respects AI holds)
            // Correction: For AI turn, 'held' property in dice state needs to be respected.
            // On first roll, none are held (guaranteed by switchTurn).

            const newDiceValues = currentDice.map(d => {
                if (d.held) return d;
                return { ...d, value: Math.ceil(Math.random() * 6) };
            });

            // Update State (Visual)
            setDice(newDiceValues);
            setRolling(false);
            currentDice = newDiceValues; // Update local ref
            currentRolls--;
            setRollsLeft(currentRolls);

            await wait(800); // Wait for user to see result

            // 2. Decide: Hold or Score?
            // If no rolls left, break to score
            if (currentRolls === 0) break;

            // Decision Logic
            const holdIds = getBestHold(currentDice, aiScores, currentRolls);

            // If we are holding all dice, we might as well score (unless we want to reroll all? unlikely for simple bot)
            if (holdIds.length === 5 && currentRolls < 3) {
                // Already full house or Yahtzee? Step out to score.
                break;
            }

            // Apply Holds
            const heldDice = currentDice.map(d => ({
                ...d,
                held: holdIds.includes(d.id)
            }));

            setDice(heldDice);
            currentDice = heldDice; // Update local ref

            // Optional: Message about holding
            setMessage(`${playerNames.ai} is thinking...`);
            await wait(800);
        }

        // 3. Final Scoring
        setMessage(`${playerNames.ai} is scoring...`);
        const diceVals = currentDice.map(d => d.value);
        const possible = calculatePossibleScores(diceVals, aiScores); // Use new signature
        const bestCat = getBestCategory(possible, aiScores);

        if (bestCat) {
            const score = possible[bestCat];
            setAiScores(prev => ({ ...prev, [bestCat]: score }));

            // AI Bonus Check
            if (checkYahtzeeBonus(diceVals, aiScores)) {
                setAiYahtzeeBonus(prev => prev + 100);
                setMessage(`${playerNames.ai} scored ${score} in ${bestCat} + 100 Bonus!`);
            } else {
                setMessage(`${playerNames.ai} scored ${score} in ${bestCat}!`);
            }

            setLastSelections(prev => ({ ...prev, ai: bestCat }));
            addToLog(playerNames.ai, false, bestCat, score, diceVals);
        } else {
            // Fallback if something weird happens (e.g. no valid categories, unlikely)
            console.warn("AI found no best category, picking first available.");
            // Pick first key from possible check
            const firstCat = Object.keys(possible)[0];
            if (firstCat) {
                setAiScores(prev => ({ ...prev, [firstCat]: possible[firstCat] }));
                setLastSelections(prev => ({ ...prev, ai: firstCat }));
                addToLog(playerNames.ai, false, firstCat, possible[firstCat], diceVals);
            }
        }

        await wait(1500);

        // Switch back to User
        switchTurn('user');
        setAiProcessing(false);
    };

    const switchTurn = (nextPlayer) => {
        setCurrentPlayer(nextPlayer);
        setRollsLeft(MAX_ROLLS);
        // Reset dice state completely for next player
        setDice(Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })));
        setMessage(nextPlayer === 'user' ? `${playerNames.user}'s turn!` : `${playerNames.ai}'s turn!`);
    };

    const handleStartGame = (userName) => {
        setPlayerNames({
            user: userName,
            ai: getRandomAIName()
        });
        setGameStarted(true);
        // Ensure dice are reset
        setDice(Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })));
        setMessage(`Game Started! ${userName}'s turn.`);
    };

    const rollDice = () => {
        if (rollsLeft <= 0 || rolling || isGameOver || currentPlayer !== 'user') return;

        setRolling(true);
        setTimeout(() => {
            setDice(prev => prev.map(d => {
                if (d.held) return d;
                return { ...d, value: Math.ceil(Math.random() * 6) };
            }));
            setRollsLeft(prev => prev - 1);
            setRolling(false);
            setMessage('Select dice to hold or pick a score!');
        }, 600);
    };

    const toggleHold = (id) => {
        if (rollsLeft === MAX_ROLLS && !isGameOver) return; // Cannot hold before first roll? Rules say yes?
        // Actually standard Yahtzee: roll first, then hold.
        // My previous code had this check.
        if (rollsLeft === MAX_ROLLS) return;

        // Allow hold for user only during user turn
        if (currentPlayer !== 'user') return;

        setDice(prev => prev.map(d => d.id === id ? { ...d, held: !d.held } : d));
    };

    const handleCategorySelect = (category) => {
        if (currentPlayer !== 'user' || isGameOver) return;
        if (userScores[category] !== undefined) return;
        if (rollsLeft === MAX_ROLLS) return;

        // Score it
        const score = possibleScores[category];
        setUserScores(prev => ({ ...prev, [category]: score }));
        setLastSelections(prev => ({ ...prev, user: category }));
        addToLog(playerNames.user, true, category, score, dice.map(d => d.value));

        // Check Bonus
        const values = dice.map(d => d.value);
        if (checkYahtzeeBonus(values, userScores)) {
            setUserYahtzeeBonus(prev => prev + 100);
            setMessage(`Bonus! +100 Points!`);
        }

        // Switch to AI
        switchTurn('ai');
    };

    const handleReset = () => {
        // Full Reset
        setGameStarted(false); // Go back to name input
        setIsGameOver(false);
        setUserScores({});
        setAiScores({});
        setUserYahtzeeBonus(0);
        setAiYahtzeeBonus(0);
        setLastSelections({ user: null, ai: null });
        setPlayerNames({ user: 'You', ai: 'Computer' });
        setCurrentPlayer('user');
        setRollsLeft(MAX_ROLLS);
        setDice(Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })));
        setMessage('New Game!');
        setAiProcessing(false);
        setGameLog([]);
    };

    const handlePlayAgain = () => {
        // Soft Reset - Keep names, restart game
        setIsGameOver(false);
        setUserScores({});
        setAiScores({});
        setUserYahtzeeBonus(0);
        setAiYahtzeeBonus(0);
        setCurrentPlayer('user');
        setRollsLeft(MAX_ROLLS);
        setDice(Array.from({ length: 5 }, (_, i) => ({ id: i, value: 1, held: false })));
        setMessage(`Game Restarted! ${playerNames.user}'s turn.`);
        setAiProcessing(false);
        setGameLog([]);
    };

    // --- Render ---

    if (!gameStarted) {
        return <NameInput onStartGame={handleStartGame} />;
    }

    const heldDice = dice.filter(d => d.held);
    const unheldDice = dice.filter(d => !d.held);

    // Determine Joker Cursor
    const showJokerCursor = currentPlayer === 'user' && !rolling && isJokerActive(dice.map(d => d.value), userScores);

    return (
        <div className={`game-board ${showJokerCursor ? 'joker-cursor' : ''}`}>
            <div className="game-left-section">
                <div className="held-container">
                    <h3>Held Dice</h3>
                    <div className="held-dice-column">
                        {heldDice.length === 0 && <div className="placeholder">Select dice to keep</div>}
                        {heldDice.map(d => (
                            <Dice
                                key={d.id}
                                {...d}
                                onClick={toggleHold}
                                rolling={false} // Held dice do not animate roll
                            />
                        ))}
                    </div>
                </div>

                <div className="center-panel">
                    <div className="title-area">
                        <h1 className="title">Yahtzee</h1>
                        <div className="message">{message}</div>
                    </div>

                    <div className="rolling-area">
                        {unheldDice.map(d => (
                            <Dice
                                key={d.id}
                                {...d}
                                onClick={toggleHold}
                                rolling={rolling}
                            />
                        ))}
                    </div>

                    <div className="controls">
                        <button
                            className={`btn-roll ${currentPlayer !== 'user' ? 'disabled' : ''}`}
                            onClick={rollDice}
                            disabled={rollsLeft === 0 || rolling || isGameOver || currentPlayer !== 'user'}
                        >
                            {rollsLeft === MAX_ROLLS ? 'Roll Dice' : `Roll (${rollsLeft} Left)`}
                        </button>
                        {isGameOver && (
                            <button className="btn-reset" onClick={handleReset}>New Game</button>
                        )}
                    </div>

                    <GameLog log={gameLog} />
                </div>
            </div>

            <div className="right-panel">
                <ScoreCard
                    userScores={userScores}
                    aiScores={aiScores}
                    lastSelections={lastSelections}
                    possibleScores={possibleScores}
                    onSelectCategory={handleCategorySelect}
                    isUserTurn={!isGameOver && currentPlayer === 'user' && rollsLeft < MAX_ROLLS}
                    isActiveTurn={!isGameOver}
                    userLabel={playerNames.user}
                    aiLabel={playerNames.ai}
                />
            </div>

            {isGameOver && (
                <EndGameScoring
                    userScores={userScores}
                    aiScores={aiScores}
                    playerNames={playerNames}
                    onPlayAgain={handlePlayAgain}
                    userYahtzeeBonus={userYahtzeeBonus}
                    aiYahtzeeBonus={aiYahtzeeBonus}
                />
            )}
        </div>
    );
};

export default GameBoard;

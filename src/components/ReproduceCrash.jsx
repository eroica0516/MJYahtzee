import React from 'react';
import EndGameScoring from './EndGameScoring';
import { CATEGORIES } from '../utils/gameRules';

const ReproduceCrash = () => {
    // Construct dummy scores using the actual keys from CATEGORIES to ensure match
    const dummyScores = {};
    Object.values(CATEGORIES).forEach(cat => {
        dummyScores[cat] = 10;
    });

    const playerNames = { user: 'TestUser', ai: 'TestBot' };

    return (
        <div style={{ paddingTop: '50px' }}>
            <h1>Crash Reproduction</h1>
            <EndGameScoring
                userScores={dummyScores}
                aiScores={dummyScores}
                playerNames={playerNames}
                onPlayAgain={() => console.log('Play Again')}
            />
        </div>
    );
};

export default ReproduceCrash;

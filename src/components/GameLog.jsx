import React from 'react';
import './GameLog.css';
import { CATEGORY_LABELS } from '../utils/gameRules';

const MiniDie = ({ value }) => {
    // Simple dot rendering for mini dice
    // 1: Center
    // 2: Top-Left, Bottom-Right
    // 3: Top-Left, Center, Bottom-Right
    // ...actually for 16px, just a number might be clearer? 
    // Or just a simplified dot pattern. 
    // Let's stick to standard dots but strictly simplified.

    // Actually, just rendering the number is much more legible at 16px than trying to draw 6 tiny dots.
    if (true) {
        return (
            <div className={`mini-die val-${value}`}>
                <span style={{ color: 'black', fontSize: '10px', fontWeight: 'bold' }}>{value}</span>
            </div>
        );
    }
};

const GameLog = ({ log }) => {
    return (
        <div className="game-log">
            <h3>Game Log</h3>
            <ul className="log-list">
                {log.length === 0 && <li style={{ padding: '10px', textAlign: 'center', color: '#888' }}>No moves yet</li>}
                {log.map((entry, index) => (
                    <li key={index} className="log-entry">
                        <div className="log-info">
                            <span className={`log-player-name ${entry.isUser ? 'user' : 'ai'}`}>
                                <span style={{ color: '#888', marginRight: '5px', fontSize: '0.75rem' }}>#{entry.turnNumber}</span>
                                {entry.player}
                            </span>
                            <span className="log-action">
                                {CATEGORY_LABELS[entry.category] || entry.category}:
                                <span className="log-score">+{entry.score}</span>
                            </span>
                        </div>
                        <div className="log-dice">
                            {entry.dice.slice().sort((a, b) => a - b).map((val, i) => (
                                <MiniDie key={i} value={val} />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GameLog;

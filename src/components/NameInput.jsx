import React, { useState } from 'react';
import './NameInput.css';

const NameInput = ({ onStartGame }) => {
    const [name, setName] = useState('You');

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalName = name.trim() || 'You';
        onStartGame(finalName);
    };

    return (
        <div className="name-input-overlay">
            <div className="name-input-dialog">
                <h2>Welcome to Yahtzee!</h2>
                <p>Please enter your name to begin:</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        autoFocus
                        maxLength={12}
                    />
                    <button type="submit" className="btn-start">Start Game</button>
                </form>
            </div>
        </div>
    );
};

export default NameInput;

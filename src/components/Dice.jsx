import React from 'react';
import './Dice.css';

const Dice = ({ id, value, held, onClick, rolling }) => {
    // Generate random animation values
    // We use standard React useRef would be better to keep stable across renders, 
    // but for this simple implementation, re-calculating on render when NOT rolling is fine.
    // However, to keep them stable during the 'rolling' phase, we need them to be constant.
    // Actually, simply using random values in inline style *every render* might cause jitter if re-rendered.
    // But 'rolling' state controls the class.
    // Let's use CSS variables for randomness that we update ONLY when 'rolling' prop changes to true?
    // A simpler way: The 'rolling' prop comes from parent. When it's true, we want chaos.
    // We can just set random variables once. 
    // To ensure they differ per die and per roll, we can use a key or purely random in style.
    // Let's use a Memo to hold the random stats for the duration of a roll.

    // Actually simpler: Just generate random vars. If they change, the animation jumps.
    // We need stable random values for the duration of the animation.
    const style = rolling ? {
        '--rx': `${Math.random() * 720 - 360}deg`,
        '--ry': `${Math.random() * 720 - 360}deg`,
        '--rz': `${Math.random() * 720 - 360}deg`,
        '--tx': `${Math.random() * 100 - 50}px`,
        '--ty': `${Math.random() * 100 - 50}px`,
        '--speed': `${0.4 + Math.random() * 0.4}s`
    } : {};

    return (
        <div
            className={`die die-${value} ${held ? 'held' : ''} ${rolling ? 'rolling' : ''}`}
            onClick={() => onClick(id)}
            style={style}
        >
            <div className="face front">
                {Array.from({ length: value }).map((_, i) => (
                    <span key={i} className="dot"></span>
                ))}
            </div>
        </div>
    );
};

export default Dice;

import React, { useState, useEffect } from 'react';
import styles from './GameScreen.module.css';
import heartRed from '../../public/images/heart.png';
import heartGray from '../../public/images/heart_gray.png';

const GameScreen = () => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [timer, setTimer] = useState("00:00");
    const [level, setLevel] = useState(1);

    useEffect(() => {
        // Ensure the code only runs on the client side
        if (typeof window !== "undefined") {
            // These functions will be called from the WinForms application
            window.updateScore = (newScore) => {
                setScore(parseInt(newScore, 10));
            };

            window.updateLives = (newLives) => {
                setLives(parseInt(newLives, 10));
            };

            window.updateTimer = (newTimer) => {
                setTimer(newTimer);
            };

            window.updateLevel = (newLevel) => {
                setLevel(parseInt(newLevel, 10));
            };
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    const renderLives = () => {
        return Array.from({ length: 5 }, (_, i) => (
            <img
                key={i}
                src={i < lives ? heartRed.src : heartGray.src}
                alt="Life"
                className={styles.lifeImage}
            />
        ));
    };
    
    return (
        <div className={styles.body}>
            <div className={styles.fullScreenContainer}>
                <div className={styles.gameName}>My Awesome Game</div>

                <div className={styles.livesContainer}>
                    {renderLives()}
                </div>

                <div className={styles.scoreContainer}>
                    <div className={styles.scoreValue}>{score}</div>
                </div>

                <div className={styles.levelContainer}>
                    <div className={styles.statusTitle}>Level</div>
                    <div className={styles.statusValue}>{level}</div>
                </div>

                <div className={styles.timerContainer}>
                    <div className={styles.statusTitle}>Timer</div>
                    <div className={styles.statusValue}>{timer}</div>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;

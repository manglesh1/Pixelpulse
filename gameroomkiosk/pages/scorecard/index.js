import React, { useState, useEffect } from 'react';
import styles from './GameScreen.module.css';
import heartRed from '../../public/images/heart.png';
import heartGray from '../../public/images/heart_gray.png';

const GameScreen = () => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [timer, setTimer] = useState(0); // Timer in milliseconds
    const [level, setLevel] = useState(1);
	const [hideTimer, setHideTimer] = useState(false);
	
    useEffect(() => {
        console.log('useEffect running');
        
        // Functions to be called from the WinForms application
        window.updateScore = function (newScore) {
            console.log('Received new score from WinForms:', newScore);                
            setScore(parseInt(newScore, 10));
        };

        window.updateLives = function (newLives) {
            console.log('Received new lives from WinForms:', newLives);        
            setLives(parseInt(newLives, 10));
        };

        window.updateTimer = function (newTimer) {
            console.log('Received new timer from WinForms:', newTimer);
            setTimer(parseInt(newTimer, 10));
        };

        window.updateLevel = function (newLevel) {
            setLevel(parseInt(newLevel, 10));
        };
		
		
		window.hideTimer = function (message) {
		  console.log("Received message from WPF:", message);
		  // if the game has no relation to timer, just hide timer
		  setHideTimer(true);
		};

        // Timer countdown logic
        const interval = setInterval(() => {
            setTimer(prevTimer => {
                if (prevTimer > 0) {
                    return prevTimer - 1000; // Decrease by 1000 ms (1 second)
                } else {
                    clearInterval(interval);
                    return 0;
                }
            });
        }, 1000);

        // Cleanup the interval on component unmount
        return () => {
            clearInterval(interval);
            delete window.updateScore;
            delete window.updateLives;
            delete window.updateTimer;
            delete window.updateLevel;
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Convert milliseconds to "MM:SS" format
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

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
    
    return hideTimer ? (
		<div className={styles.body}>
            <div className={styles.fullScreenContainer}>
                <div className={styles.gameName}>Pixelpulse</div>

                <div className={styles.livesContainer}>
                    {renderLives()}
                </div>

                <div className={styles.rowContainer}>
                    <div className={styles.scoreContainer}>
                        <div className={styles.scoreValue}>{score}</div>
                    </div>

                    <div className={styles.levelContainer}>
                        <div className={styles.statusTitle}>Level</div>
                        <div className={styles.statusValue}>{level}</div>
                    </div>
                </div>
            </div>
        </div>
	) : (
		<div className={styles.body}>
            <div className={styles.fullScreenContainer}>
                <div className={styles.gameName}>Pixelpulse</div>

                <div className={styles.livesContainer}>
                    {renderLives()}
                </div>

                <div className={styles.rowContainer}>
                    <div className={styles.scoreContainer}>
                        <div className={styles.scoreValue}>{score}</div>
                    </div>

                    <div className={styles.levelContainer}>
                        <div className={styles.statusTitle}>Level</div>
                        <div className={styles.statusValue}>{level}</div>
                    </div>
                </div>

                <div className={styles.timerContainer}>
                    <div className={styles.statusTitle}>Timer</div>
                    <div className={styles.statusValue}>{formatTime(timer)}</div>
                </div>
            </div>
        </div>
	);
};

export default GameScreen;
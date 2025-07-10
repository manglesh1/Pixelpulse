import React, { useState, useEffect } from 'react';
import styles from './GameScreen.module.css';
import CompScoreCardScreen from '../../components/scoreCard/CompScoreCardScreen';
import MultiScoreCardScreen from '../../components/scoreCard/MuntiScoreCardScreen';

const GameScreen = () => {
    const [score, setScore] = useState(0);
    const [scores, setScores] = useState([0,0,0,0,0]);
    const [players, setPlayers] = useState(['Player 1','Player 2','Player 3','Player 4','Player 5']);
    const [lives, setLives] = useState(5);
    const [timer, setTimer] = useState(0); // Timer in milliseconds
    const [level, setLevel] = useState(1);
    const [gameType, setGameType] = useState('multi'); // comp or multi
	const [hideTimer, setHideTimer] = useState(false);
	
    useEffect(() => {
        console.log('useEffect running');
        
        window.updateScores = (newScores) => {
            setScores([...newScores]);
        };

        window.updatePlayers = (newPlayers) => {
            setPlayers([...newPlayers]);
        };
 
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
            console.log('Received new level from WinForms:', newLevel);
            setLevel(parseInt(newLevel, 10));
        };
		
        window.updateGameType = (newType) => {
            console.log('Received new gameType from WinForms:', newType)
            setGameType(newType);
        };
		
		window.hideTimer = function (message) {
		  console.log("Received message from WPF:", message);
		  message==='hide' ? setHideTimer(true) : setHideTimer(false);
		};

        // Cleanup the interval on component unmount
        return () => {
            delete window.updateScore;
            delete window.updateLives;
            delete window.updateTimer;
            delete window.updateLevel;
            delete window.hideTimer;
            delete window.updateGameType;
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    

    return (
        <>
            {
                gameType === 'comp' 
                && (
                    <CompScoreCardScreen 
                        styles={styles} 
                        score={score} 
                        lives={lives} 
                        level={level} 
                        timer={timer} 
                        hideTimer={hideTimer}
                    />
                )
            }
            {
                gameType === 'multi' 
                && (
                    <MultiScoreCardScreen 
                        styles={styles} 
                        players={players}
                        scores={scores} 
                        lives={lives} 
                        level={level} 
                        timer={timer} 
                        hideTimer={hideTimer}
                    />
                )
            }
        </>
	);
}
export default GameScreen;
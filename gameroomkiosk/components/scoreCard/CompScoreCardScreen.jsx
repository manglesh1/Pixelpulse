import React from 'react'
import heartRed from '../../public/images/heart.png';
import heartGray from '../../public/images/heart_gray.png';

const CompScoreCardScreen = ({styles, score, lives, level, timer, hideTimer}) => {

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

    return (
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

                {!hideTimer && (<div className={styles.timerContainer}>
                    <div className={styles.statusTitle}>Timer</div>
                    <div className={styles.statusValue}>{formatTime(timer)}</div>
                </div>)} 
            </div>
        </div>
    )
}

export default CompScoreCardScreen

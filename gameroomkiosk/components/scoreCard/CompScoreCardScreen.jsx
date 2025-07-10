import React from 'react'
import heartRed from '../../public/images/heart.png';
import heartGray from '../../public/images/heart_gray.png';
import LivesSection from './sections/LivesSection';
import TitleSection from './sections/TitleSection';
import LevelSection from './sections/LevelSection';
import TimerSection from './sections/TimerSection';

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
            <div className={styles.wrapper}>
                <div className={styles.fullScreenContainer}>
                    <TitleSection styles={styles} title={"Pixelpulse"} />
                    <LivesSection styles={styles} renderLives={renderLives} />

                    <div className={styles.rowContainer}>
                        <div className={styles.scoreContainer}>
                            <div className={styles.scoreValue}>{score}</div>
                        </div>

                        <LevelSection styles={styles} level={level} />
                    </div>

                    {!hideTimer && (
                        <TimerSection styles={styles} time={formatTime(timer)} />
                    )} 
                </div>
            </div>
        </div>
    )
}

export default CompScoreCardScreen

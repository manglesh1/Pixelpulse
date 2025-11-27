import React from 'react';
import heartRed from '../../public/images/heart.png';
import heartGray from '../../public/images/heart_gray.png';
import PlayerDetailsSection from './sections/PlayerDetailsSection';
import LivesSection from './sections/LivesSection';
import TitleSection from './sections/TitleSection';
import LevelSection from './sections/LevelSection';
import TimerSection from './sections/TimerSection';

const MultiScoreCardScreen = ({styles, scores, players, lives, level, timer, hideTimer}) => {

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
                className={styles.smallLifeImage}
            />
        ));
    };

    return (
        <div className={styles.body}>
            <div className={styles.wrapper}>
                <div className={styles.fullScreenContainer}>
                    <TitleSection styles={styles} title={"Pixelpulse"} />

                    <PlayerDetailsSection styles={styles} players={players} scores={scores} />

                    <div className={styles.rowContainer}>
                        <LivesSection styles={styles} renderLives={renderLives} />
                        <LevelSection styles={styles} level={level} />
                    </div>

                    {/* Timer section */}
                    {!hideTimer && (
                        <TimerSection styles={styles} time={formatTime(timer)} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiScoreCardScreen;

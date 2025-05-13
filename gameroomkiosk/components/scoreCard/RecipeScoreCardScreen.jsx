import React, { useEffect, useState } from 'react';
import styles from '../../styles/RecipeScoreCard.module.css';
import PlateCard from './PlateCard';

const RecipeScoreCardScreen = () => {
  const [plates, setPlates] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [fire, setFire] = useState(false);
  const [roundTime, setRoundTime] = useState(null);

  useEffect(() => {
    window.updatePlates = (incomingPlates) => setPlates(incomingPlates);
    window.setRecipeName = (name) => setRecipeName(name);
    window.setRoundTimeRemaining = (ms) => setRoundTime(ms);
    window.triggerFire = () => { setFire(true); setPlates([]); };
    window.clearFire = () => setFire(false);

    return () => {
      delete window.updatePlates;
      delete window.setRecipeName;
      delete window.setRoundTimeRemaining;
      delete window.triggerFire;
      delete window.clearFire;
    };
  }, []);

  return (
    <div className={styles.screenContainer}>
      {fire ? (
        <div className={styles.fireOverlay}>🔥 FIRE! EXTINGUISH NOW! 🔥</div>
      ) : (
        <>
          <h1 className={styles.header}>Making: {recipeName || '...'}</h1>
          {roundTime !== null && (
            <div className={styles.roundTimer}>
              Time Left: {Math.floor(roundTime / 1000)}s
            </div>
          )}
          <div className={styles.plateGrid}>
            {plates.map((plate, idx) => (
              <PlateCard key={idx} plate={plate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RecipeScoreCardScreen;

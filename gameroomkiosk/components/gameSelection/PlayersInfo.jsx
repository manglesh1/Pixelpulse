import React, { useEffect, useState } from 'react';
import time from '../../tools/timeConverter';

const PlayersInfo = ({ styles, playersData, selectedVariant }) => {
  // const [highScores, setHighScores] = useState([]);

  // useEffect(() => {
  //   const fetchScores = async () => {
  //     if (!playersData.length || !selectedVariant){
  //       setHighScores([]);
  //       return;
  //     }

  //     const scores = await Promise.all(
  //       playersData.map(async (playerInfo) => {
  //         const score = await fetchHighScore(selectedVariant.ID, playerInfo.player.PlayerID);
  //         console.log(score);
  //         return score ? score : 0;
  //       })
  //     );
  //     setHighScores(scores);
  //     console.log(highScores);
  //   };

  //   fetchScores();
  // }, [playersData, selectedVariant]);

  // const fetchHighScore = async (variantId, playerId) => {
  //   if (!variantId || !playerId) return 0;

  //   const score = await fetchHighScoresApiForPlayerByGameVariantId(variantId, playerId);
  //   return score ? score.Points ?? 0 : 0;
  // };

  return (
    <div className={styles.scoreTable}>
      <div className={styles.tableRowTitle}>
        <div className={styles.cellName}>Player Name</div>
        <div className={styles.cellTime}>Time Left</div>
        <div className={styles.cellScore}>Total Score</div>
        <div className={styles.cellReward}>Team Reward</div>
      </div>

      {Array.from({ length: 5 }).map((_, index) => {
        const playerInfo = playersData[index];
        const playerName = playerInfo ? `${playerInfo.player.FirstName} ${playerInfo.player.LastName}` : '';
        const timeLeft = playerInfo?.remaining ?? '';
        const {years, months, days, hours, minutes} = timeLeft ? time(timeLeft) : '';        
        const reward = playerInfo?.reward ?? '';
        const score = playerInfo?.totalScore ?? '';

        return (
          <div key={index} className={styles.tableRow}>
            <div className={`${styles.cellName} ${styles.cellBase}`}>{playerName || <div className={styles.placeholder}></div>}</div>
            <div className={`${styles.cellTime} ${styles.cellBase}`}>
              {
                `${years > 0 ? years+' y ' : ''}${months > 0 ? months+' m ' : ''}${days > 0 ? days+' d ' : ''}${hours > 0 ? hours+' h ' : ''}${minutes > 0 ? minutes+' m ' : ''}`
                || 
                <div className={styles.placeholder}></div>
              }
            </div>
            <div className={`${styles.cellScore} ${styles.cellBase}`}>{score || <div className={styles.placeholder}></div>}</div>
            <div className={`${styles.cellReward} ${styles.cellBase}`}>{reward || <div className={styles.placeholder}></div>}</div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayersInfo;

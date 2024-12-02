import React, { useEffect, useState } from 'react';
import { fetchHighScoresApiForPlayerByGameVariantId } from '../../services/api';

const PlayersInfo = ({ styles, playersData, selectedVariant }) => {
  const [highScores, setHighScores] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!playersData.length || !selectedVariant) return;

      // Fetch all scores concurrently
      const scores = await Promise.all(
        playersData.map(async (playerInfo) => {
          const score = await fetchHighScore(selectedVariant.ID, playerInfo.player.PlayerID);
          return score; // Returns Points or 0 if no score
        })
      );

      // Update highScores state once all scores are fetched
      setHighScores(scores);
    };

    fetchScores();
  }, [playersData, selectedVariant]);

  const fetchHighScore = async (variantId, playerId) => {
    if (!variantId || !playerId) return 0;

    const score = await fetchHighScoresApiForPlayerByGameVariantId(variantId, playerId);
    return score ? score.Points ?? 0 : 0;
  };

  return (
    <div className={styles.scoreTable}>
      <div className={styles.tableRow}>
        <div>Player Name</div>
        <div>Time Left</div>
        <div>High Score</div>
        <div>Team Reward</div>
      </div>
      {playersData.map((playerInfo, index) => (
        <div key={index} className={styles.tableRow}>
          <div>{playerInfo.player.FirstName} {playerInfo.player.LastName}</div>
          <div>{playerInfo.timeleft}</div>
          <div>{highScores[index] ?? 'Loading...'}</div>
          <div>{playerInfo.reward}</div>
        </div>
      ))}
    </div>
  );
};

export default PlayersInfo;

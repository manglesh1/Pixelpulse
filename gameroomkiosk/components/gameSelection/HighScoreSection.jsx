import React from 'react';

const HighScoreSection = ({ styles, score }) => {
  const { topDailyScore, topMonthlyScore, topAllTimeScore } = score || {};

  console.log(score);

  if (!score) return <div>Loading...</div>;

  return (
    <div className={styles.highScoreContainer}>
      <div className={styles.highScoreTitle}>High Scores:</div>
      <div className={styles.highScoreItem}>Daily: {topDailyScore?.Points ?? '-'}</div>
      <div className={styles.highScoreItem}>Monthly: {topMonthlyScore?.Points ?? '-'}</div>
      <div className={styles.highScoreItem}>All Time: {topAllTimeScore?.Points ?? '-'}</div>
    </div>

  );
};

export default HighScoreSection;

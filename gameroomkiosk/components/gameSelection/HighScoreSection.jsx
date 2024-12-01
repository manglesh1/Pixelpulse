import React from 'react';

const HighScoreSection = ({ styles, score }) => {
  const { topDailyScore, topMonthlyScore, topAllTimeScore } = score;

  return (
    <div className={styles.slideHeaderItem}>
      <div className={styles.highScoreTitle}>High Scores</div>
      <table className={styles.highScoreTable}>
        <thead>
          <tr>
            <th></th>
            <th>Player</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>All Time</td>
            <td className={styles.highScoreName}>
              {topAllTimeScore.Players.FirstName} {topAllTimeScore.Players.LastName}
            </td>
            <td className={styles.highScorePoints}>{topAllTimeScore.Points}</td>
          </tr>
          <tr>
            <td>Monthly</td>
            <td className={styles.highScoreName}>
              {topMonthlyScore.Players.FirstName} {topMonthlyScore.Players.LastName}
            </td>
            <td className={styles.highScorePoints}>{topMonthlyScore.Points}</td>
          </tr>
          <tr>
            <td>Daily</td>
            <td className={styles.highScoreName}>
              {topDailyScore.Players.FirstName} {topDailyScore.Players.LastName}
            </td>
            <td className={styles.highScorePoints}>{topDailyScore.Points}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default HighScoreSection;

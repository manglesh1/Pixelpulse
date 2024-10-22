import React from 'react';

const PlayerDetailsSection = ({ styles, players, scores }) => {
  const colors = ['red', 'green', 'blue', 'white', 'yellow']; // Colors to represent each player

  return (
    <div className={styles.playersContainer}>
      {players.map((player, index) => (
        <div key={index} className={styles.playerColumn}>
          <div
            className={styles.colorCircle}
            style={{ backgroundColor: colors[index % colors.length] }}
          ></div>
          <div className={styles.playerName}>Player {index}</div>
          <div className={styles.playerScore}>{scores[index]}</div>
        </div>
      ))}
    </div>
  );
};

export default PlayerDetailsSection;

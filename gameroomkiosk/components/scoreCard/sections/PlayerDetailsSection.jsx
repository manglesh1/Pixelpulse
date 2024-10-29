import React from 'react';

const PlayerDetailsSection = ({ styles, players, scores }) => {
  const colors = ['red', 'green', 'blue', 'white', 'yellow']; // Colors to represent each player

  return (
    <div className={styles.playersContainer}>
      {players.map((player, index) => (
        <div key={index} className={styles.playerColumn}>
          <div className={styles.playerName}>{player.name ? "name" : `Player ${index+1}`}</div>
          <div className={styles.playerScore} style={{ color:colors[index % colors.length] }}>{scores[index]}</div>
        </div>
      ))}
    </div>
  );
};

export default PlayerDetailsSection;

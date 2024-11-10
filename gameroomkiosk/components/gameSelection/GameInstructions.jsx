import React from 'react';

const GameInstructions = ({ styles, instruction }) => {
  return (
    <div className={styles.instructionsSection}>
      <div className={styles.instructionsContent} dangerouslySetInnerHTML={{ __html: instruction }} />
    </div>
  );
};

export default GameInstructions;

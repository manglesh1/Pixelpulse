import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import HighScoreSection from './HighScoreSection';
import { FaInfoCircle } from 'react-icons/fa';

const GameImage = ({ styles, variant, highScores }) => {
  const [selectedVariantInstructions, setSelectedVariantInstructions] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleIconClick = (instructions) => {
    setSelectedVariantInstructions(instructions);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const getHighScore = (variantId) => {
    return highScores.find(score => score.variantID === variantId);
  };

  const dialog = dialogOpen ? (
    <div className={styles.dialogOverlay} onClick={handleCloseDialog}>
      <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.dialogTitle}>Game Instructions</h2>
        <p className={styles.dialogContent} dangerouslySetInnerHTML={{ __html: selectedVariantInstructions }} />
        <button className={styles.dialogCloseButton} onClick={handleCloseDialog}>
          Close
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={styles.slide}>
        <div 
          className={styles.variantBackground} 
          style={{ backgroundImage: `url(/images/gameImages/${variant.name.split(' ').join('')}.jpg)` }}
        >
          <div className={styles.slideHeader}>
            <HighScoreSection 
              styles={styles} 
              score={getHighScore(variant.ID)} 
            />
            <div 
              className={styles.slideHeaderItem} 
              onClick={() => handleIconClick(variant.instructions)}
              style={{ cursor: 'pointer' }}
            >
              <FaInfoCircle size={30} />
            </div>
          </div>
          <div className={styles.slideDescription}>
            <span>{variant.name}</span>
            <p>{variant.variantDescription}</p>
          </div>
        </div>
      </div>
      {/* Render dialog at the root of the DOM */}
      {ReactDOM.createPortal(dialog, document.body)}
    </>
  );
};

export default GameImage;

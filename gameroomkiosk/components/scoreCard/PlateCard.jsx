import React from 'react';
import styles from '../../styles/RecipeScoreCard.module.css';

const PlateCard = ({ plate }) => {
  const {
    ingredients,
    // currentStepIndex,
    steps,
    outlineColor,
    description
  } = plate;
  const step = steps || null;
  //const stepName = step?.name || `Step ${currentStepIndex + 1}`;
  const stepName = step?.name;
  const stepDesc = description || step?.description || '';
  const borderColor = outlineColor || '#29b6f6';

  if(step === null) 
  {
    return (
      <div className={styles.plateCard} style={{ borderColor }}>
        <div className={styles.ingredientIcon}>
          {ingredients.join(' + ')}
        </div>
        <div className={styles.ingredientRequest}>Get {ingredients[0]} from the pantry.</div>
      </div>
    );
  }
  return (
    <div className={styles.plateCard} style={{ borderColor }}>
      <div className={styles.ingredientIcon}>
        {ingredients.join(' + ')}
      </div>

      <div className={styles.stepName}>{stepName}</div>
      <div className={styles.stepDescription}>{stepDesc}</div>

      {step?.requiredChopCount && (
        <div className={styles.chopInfo}>
          🔪 Chop: {step.chopCount || 0} / {step.requiredChopCount}
        </div>
      )}

      {step?.requiredCookTime && (
        <div className={styles.cookInfo}>
          🍳 Cook: {Math.floor((step.cookTimeElapsed || 0) / 1000)}s / {Math.floor(step.requiredCookTime / 1000)}s
        </div>
      )}

      {step?.isBakeStep && (
        <div className={styles.bakeInfo}>
          {step.bakeTimeElapsed != null ? (
            <>🍞 Bake: {Math.floor(step.bakeTimeElapsed / 1000)}s / {Math.floor(step.requiredBakeTime / 1000)}s</>
          ) : (
            <>🔔 Place in oven!</>
          )}
        </div>
      )}

      {/* <div className={styles.stepCounter}>
        Step {currentStepIndex + 1} of {steps.length}
      </div> */}
    </div>
  );
};

export default PlateCard;

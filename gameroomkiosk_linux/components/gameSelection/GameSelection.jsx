import React from "react";

const GameSelection = ({
  styles,
  gameData,
  selectedVariant,
  handleVariantClick,
}) => {
  const comp = [];
  const multi = [];

  // Split variants by type
  gameData.variants.forEach((variant) => {
    if (variant.GameType === "comp") comp.push(variant);
    else multi.push(variant);
  });

  return (
    <div className={styles.gameOptions}>
      {/* Alliance Mode */}
      <div>
        <h2 className={styles.selectionSectionTitle}>Alliance Mode</h2>

        {comp.map((variant) =>
          variant.IsActive ? (
            <div
              key={variant.ID}
              className={`${styles.gameOption} ${
                selectedVariant?.ID === variant.ID ? styles.selected : ""
              }`}
              onClick={() => handleVariantClick(variant)}
            >
              {variant.name}
            </div>
          ) : null
        )}
      </div>

      {/* Competitive Mode */}
      <div>
        <h2 className={styles.selectionSectionTitle}>Competitive Circuit</h2>

        {multi.map((variant) =>
          variant.IsActive ? (
            <div
              key={variant.ID}
              className={`${styles.gameOption} ${
                selectedVariant?.ID === variant.ID ? styles.selected : ""
              }`}
              onClick={() => handleVariantClick(variant)}
            >
              {variant.name}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default GameSelection;

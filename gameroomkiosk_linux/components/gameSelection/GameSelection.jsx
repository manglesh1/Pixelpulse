import React from 'react'

const GameSelection = ({styles, gameData, selectedVariant, handleVariantClick}) => {
  const comp = []
  const multi = []
  const recipe = []
  gameData.variants.forEach((variant)=>{
    if (variant.GameType === 'comp') comp.push(variant)
    else if (variant.GameType === 'recipe') recipe.push(variant)
    else multi.push(variant)
  })

  const renderVariants = (list) => list.map((variant) =>
    variant.IsActive ? (
      <div
        key={variant.ID}
        className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
        onClick={() => handleVariantClick(variant)}
      >
        {variant.name}
      </div>
    ) : null
  )

  return (
    <div className={styles.gameOptions}>
        {comp.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Alliance Mode</h2>
            {renderVariants(comp)}
          </div>
        )}

        {multi.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Competitive Circuit</h2>
            {renderVariants(multi)}
          </div>
        )}

        {recipe.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Recipe Challenge</h2>
            {renderVariants(recipe)}
          </div>
        )}
    </div>
  )
}

export default GameSelection

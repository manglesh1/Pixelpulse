import React from 'react'

const GameSelection = ({styles, gameData, selectedVariant, handleVariantClick}) => {
  const isProjectionPlay = gameData.gameCode === 'ProjectionPlay'
  const comp = []
  const multi = []
  const recipe = []
  gameData.variants.forEach((variant)=>{
    if (variant.GameType === 'comp') comp.push(variant)
    else if (variant.GameType === 'recipe') recipe.push(variant)
    else multi.push(variant)
  })

  const displayVariantName = (variant) => {
    if (!isProjectionPlay) return variant.name
    return variant.name.replace(/^Projection\s+/i, '')
  }

  const renderVariants = (list) => list.map((variant) =>
    variant.IsActive ? (
      <div
        key={variant.ID}
        className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
        onClick={() => handleVariantClick(variant)}
      >
        {displayVariantName(variant)}
      </div>
    ) : null
  )

  return (
    <div className={`${styles.gameOptions} ${isProjectionPlay ? styles.projectionGameOptions : ''}`}>
        {comp.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Alliance Mode</h2>
            <div className={isProjectionPlay ? styles.projectionVariantGrid : ''}>
              {renderVariants(comp)}
            </div>
          </div>
        )}

        {multi.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Competitive Circuit</h2>
            <div className={isProjectionPlay ? styles.projectionVariantGrid : ''}>
              {renderVariants(multi)}
            </div>
          </div>
        )}

        {recipe.length > 0 && (
          <div>
            <h2 className={styles.selectionSectionTitle}>Recipe Challenge</h2>
            <div className={isProjectionPlay ? styles.projectionVariantGrid : ''}>
              {renderVariants(recipe)}
            </div>
          </div>
        )}
    </div>
  )
}

export default GameSelection

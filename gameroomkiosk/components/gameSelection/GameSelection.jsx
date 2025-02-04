import React from 'react'

const GameSelection = ({styles, gameData, selectedVariant, handleVariantClick}) => {
  const comp = []
  const multi = []
  gameData.variants.map((variant)=>{
    variant.GameType==='comp' ? comp.push(variant) : multi.push(variant)
  })
  return (
    <div className={styles.gameOptions}>
        <div>
          <h2 className={styles.selectionSectionTitle}>Alliance Mode</h2>
          {comp.map((variant) => {
            return variant.IsActive ? (
              <div
                key={variant.ID}
                className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
                onClick={() => handleVariantClick(variant)}
              >
                  {variant.name}
              </div>
            ):null
          })}
        </div>
        
        <div>
          <h2 className={styles.selectionSectionTitle}>Competitive Circuit</h2>
          {multi.map((variant) => {
            return variant.IsActive ? (
              <div
                key={variant.ID}
                className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
                onClick={() => handleVariantClick(variant)}
              >
                  {variant.name}
              </div>
            ):null
          })}
        </div>
    </div>
  )
}

export default GameSelection

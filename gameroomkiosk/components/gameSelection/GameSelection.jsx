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
          <h2 className={styles.selectionSectionTitle}>Compititive</h2>
          {comp.map((variant) => (
            <div
                key={variant.ID}
                className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
                onClick={() => handleVariantClick(variant)}
            >
                {variant.name}
            </div>
          ))}
        </div>
        
        <div>
          <h2 className={styles.selectionSectionTitle}>Multiplayer</h2>
          {multi.map((variant) => (
            <div
                key={variant.ID}
                className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
                onClick={() => handleVariantClick(variant)}
            >
                {variant.name}
            </div>
          ))}
        </div>
    </div>
  )
}

export default GameSelection

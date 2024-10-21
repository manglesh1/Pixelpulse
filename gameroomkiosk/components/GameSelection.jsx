import React from 'react'

const GameSelection = ({styles, gameData, selectedVariant, handleVariantClick}) => {
  return (
    <div className={styles.gameOptions}>
        {gameData.variants.map((variant) => (
        <div
            key={variant.ID}
            className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
            onClick={() => handleVariantClick(variant)}
        >
            {variant.name}
        </div>
        ))}
    </div>
  )
}

export default GameSelection

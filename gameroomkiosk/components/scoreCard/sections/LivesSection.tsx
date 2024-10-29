import React from 'react'

const LivesSection = ({styles, renderLives, }) => {
    return (
        <div className={styles.livesContainer}>
            {renderLives()}
        </div>
    )
}

export default LivesSection

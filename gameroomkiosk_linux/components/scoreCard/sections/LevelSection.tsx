import React from 'react'

const LevelSection = ({styles, level}) => {
    return (
        <div className={styles.levelContainer}>
            <div className={styles.statusTitle}>Level</div>
            <div className={styles.statusValue}>{level}</div>
        </div>
    )
}

export default LevelSection

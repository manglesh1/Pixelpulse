import React from 'react'

const HighScores = ({styles, highScores}) => {
  return (
    <div className={styles.highScores}>
        <h3>High Scores</h3>
        <div className={styles.scoreCategories}>
        <div className={styles.scoreBox}>
            <div className={styles.scoreTitle}>Today</div>
            <div className={styles.scoreValue}>{highScores.today}</div>
        </div>
        <div className={styles.scoreBox}>
            <div className={styles.scoreTitle}>90 Days</div>
            <div className={styles.scoreValue}>{highScores.last90Days}</div>
        </div>
        <div className={styles.scoreBox}>
            <div className={styles.scoreTitle}>360 Days</div>
            <div className={styles.scoreValue}>{highScores.last360Days}</div>
        </div>
        </div>
    </div>
  )
}

export default HighScores

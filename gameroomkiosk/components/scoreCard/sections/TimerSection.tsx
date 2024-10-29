import React from 'react'

const TimerSection = ({styles, time}) => {
    return (
        <div className={styles.timerContainer}>
            <div className={styles.statusTitle}>Timer</div>
            <div className={styles.statusValue}>{time}</div>
        </div>
    )
}

export default TimerSection

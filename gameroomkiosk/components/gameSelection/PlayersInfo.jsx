import React from 'react'

const PlayersInfo = ({styles, playersData}) => {
    return (
        <div className={styles.scoreTable}>
            <div className={styles.tableRow}>
            <div>Player Name</div>
            <div>Time Left</div>
            <div>High Score</div>
            <div>Team Reward</div>
            </div>
            {playersData.map((playerInfo, index) => (
            <div key={index} className={styles.tableRow}>
                <div>{playerInfo.player.FirstName} {playerInfo.player.LastName}</div>
                <div>{playerInfo.timeleft}</div>
                <div>{playerInfo.totalScore}</div>
                <div>{playerInfo.reward}</div>
            </div>
            ))}
        </div>
    )
}

export default PlayersInfo

import React from 'react'

const GameStarting = ({styles, doorCloseTime}) => {
  return (
    <div className={styles.GameStarting}>
        <p>
            The Game Is Starting.
        </p>
        <p>
            Please Enter the room before the door locks.
        </p>
        <p>
            Door closing in <span>{doorCloseTime}</span>
        </p>
    </div>
  )
}

export default GameStarting
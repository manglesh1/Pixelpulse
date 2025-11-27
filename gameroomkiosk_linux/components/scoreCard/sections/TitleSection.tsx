import React from 'react'

const TitleSection = ({styles, title}) => {
    return (
        <div className={styles.gameName}>{title}</div>
    )
}

export default TitleSection

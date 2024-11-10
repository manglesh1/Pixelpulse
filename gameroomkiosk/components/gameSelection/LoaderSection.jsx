import React from 'react';

const LoaderSection = ({ playersData, selectedVariant, styles }) => {

    if(playersData.length===0 || playersData===undefined) return (
        <div className={styles.imageSection}>
            <div className={styles.sectionTitle}>
                Please Scan your WristBand!
            </div>
            <div className={styles.scan}>
                <div></div>
                <div></div>
            </div>
        </div>
    );

    if(selectedVariant===undefined || selectedVariant===null) return (
        <div className={styles.imageSection}>
            <div className={styles.sectionTitle}>
                Please select the game!
            </div>
        </div>
    );
};

export default LoaderSection;

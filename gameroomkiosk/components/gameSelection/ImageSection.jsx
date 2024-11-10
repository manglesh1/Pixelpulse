import React from 'react';

const ImageSection = ({ styles, imageUrl, altText }) => {
  return (
    <div className={styles.imageSection}>
      <img src={imageUrl} alt={altText} className={styles.gameImage} />
    </div>
  );
};

export default ImageSection;

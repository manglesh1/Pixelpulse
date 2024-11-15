import React from 'react';

const ModalDialog = ({ styles, closeModal, selectedVariant }) => {
    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={closeModal}>X</button>
                {selectedVariant.imageUrl && (
                    <img src={selectedVariant.imageUrl} alt={selectedVariant.name} className={styles.modalImage} />
                )}
                <h2>{selectedVariant.name}</h2>
                <div dangerouslySetInnerHTML={{ __html: selectedVariant.instructions }} />
            </div>
        </div>
    );
};

export default ModalDialog;

import React from 'react'

const StartAndResetButtons = ({styles, gameStatus, selectedVariant, isStartButtonEnabled, setIsStartButtonEnabled, playersData}) => {
    const handleCancel = () => {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage("refresh");
        } else {
            console.log('WebView2 is not available');
        }
    };

    const handleStartButtonClick = () => {
        if (window.chrome && window.chrome.webview) {
            const message = `start:${selectedVariant.name}:${playersData.length}:${selectedVariant.GameType}`;
            window.chrome.webview.postMessage(message);
            handleCancel();
        } else {
            console.log('WebView2 is not available');
        }
        setIsStartButtonEnabled(false); // Disable the start button
    };
    return (
        <div className={styles.scanButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}>
                Reset
            </button>
            <button
                className={styles.startButton}
                onClick={handleStartButtonClick}
                disabled={gameStatus.toLowerCase().startsWith('running') || !selectedVariant || isStartButtonEnabled}
            >
                {selectedVariant ? "Start" : "Please Select the Game"}
            </button>
        </div>
    )
}

export default StartAndResetButtons
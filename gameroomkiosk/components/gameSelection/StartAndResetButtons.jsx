import React from 'react'

const StartAndResetButtons = ({styles, gameStatus, selectedVariant, isStartButtonEnabled, setIsStartButtonEnabled, playersData, setStarting, setDoorCloseTime}) => {
    const handleCancel = () => {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage("refresh");
        } else {
            console.log('WebView2 is not available');
        }
    };

    const setPlayerNames = (playersData) => {
    const MAX_LEN = 10;

    const playerNames = playersData.map(({ player: { FirstName = '', LastName = '' } }, idx) => {
        let name;
        if (FirstName || LastName) {
        const lastInitial = LastName.charAt(0);
        name = lastInitial
            ? `${FirstName} ${lastInitial}`
            : FirstName;
        } else {
            name = `Player: ${idx}`;
        }

        if (name.length > MAX_LEN) {
            return `${name.slice(0, MAX_LEN - 3)}...`;
        }
        return name;
    });

    if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage(`setPlayerNames:${playerNames.join(',')}`);
    } else {
        console.log('WebView2 is not available');
    }
    };


    const handleStartButtonClick = () => {
        //console.log(playersData);
        setIsStartButtonEnabled(false);
        setStarting(true);
        setDoorCloseTime(10);

        let remainingTime = 10;
        let countdownInterval; // ✅ Declare before using it in setInterval

        countdownInterval = setInterval(() => {
            remainingTime -= 1;
            setDoorCloseTime(remainingTime);

            if (remainingTime <= 0) {
            clearInterval(countdownInterval); // ✅ Now this works
            }
        }, 1000);

        if (window.chrome && window.chrome.webview) {
            const message = `start:${selectedVariant.name}:${playersData.length}:${selectedVariant.GameType}`;
            window.chrome.webview.postMessage(message);
            setPlayerNames(playersData);

            setTimeout(() => {
            setStarting(false);
            handleCancel();
            }, 10000);
        } else {
            console.log('WebView2 is not available');
            // Optionally re-enable start button if needed
        }
        };


    return (
        <div className={styles.scanButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}>
                Reset
            </button>
            <button
              className={styles.startButton}
              onClick={handleStartButtonClick}
              disabled={gameStatus.toLowerCase().startsWith('running') || playersData.length <= 0}
            >
              {playersData.length <= 0
                ? 'Please Scan Your Wristbands'
                : gameStatus.toLowerCase().startsWith('running')
                ? 'Game is still running. Please wait...'
                : 'Start'}
            </button>
        </div>
    )
}

export default StartAndResetButtons
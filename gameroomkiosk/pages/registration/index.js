import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from '../../styles/Players.module.css';
import {createPlayer, fetchPlayerbyId, fetchPlayersByEmail, updatePlayer} from '../../services/api';

const Players = () => {
  const [email, setEmail] = useState('');
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ FirstName: '', LastName: '', DateOfBirth: '', PhoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Steps: 1: Enter Email, 2: Choose Waiver or Add, 3: Enter Info, 4: Sign Waiver, 5: Scanning Wristband, 6: Confirmation
  const [isEmailFound, setIsEmailFound] = useState(false);
  const [signingFor, setSigningFor] = useState(''); // 'self', 'selfAndKids', 'existingWaiver', 'existingWaiverAddKids'
  const [newKidsForms, setNewKidsForms] = useState([]);
  const [nfcScanResult, setNfcScanResult] = useState('');
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const sigCanvas = useRef();

  const fetchPlayerByEmail = async (email) => {
    setLoading(true);
    setError('');
    try {
      const playersList = await fetchPlayersByEmail(email);

      if (playersList.length > 0) {
        setPlayers(playersList);
        setIsEmailFound(true);
        setStep(2);
      } else {
        setIsEmailFound(false);
        setStep(2);
      }
    } catch (err) {
      setError('Failed to fetch player data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrimaryPlayer = async () => {
    setError('');
    if (playersList.length > 0) {
      const id = playersList[0].PlayerID;
      console.log(id);
      try{
        setPrimaryPlayer(await fetchPlayerbyId(id));
      } catch(err) {
        setError('Problem finding Primary Player!');
      }
    } else {
      setIsEmailFound(false);
      setStep(2);
    }
  }

  const createPrimaryPlayer = async () => {
    setLoading(true);
    setError('');
    const player = {
      "FirstName": form.FirstName,
      "LastName": form.LastName,
      "DateOfBirth": form.DateOfBirth,
      "email": email,
      "Signature": sigCanvas.current.toDataURL(),
      "DateSigned": Date.now(),
    };
  
    try {
      const res = await createPlayer(player);
      if (res.status >= 300) {
        setError('Failed to create Primary Player due to internal error');
        return null; // Return null or handle error
      }
      const updatedPlayer = { ...res, "SigneeID": res.PlayerID };
      await updatePlayer(res.PlayerID, updatedPlayer);
      return updatedPlayer;
    } catch (err) {
      setError('Failed to create Primary Player', err);
      return null; // Return null or handle error
    } finally {
      setLoading(false);
    }
  };
  
  const createKids = async (player) => {
    setLoading(true);
    setError('');
    const kidsList = newKidsForms.map(kid => ({
      "FirstName": kid.FirstName,
      "LastName": kid.LastName,
      "DateOfBirth": kid.DateOfBirth,
      "email": email,
      "Signature": player.Signature,
      "DateSigned": Date.now(),
      "SigneeID": player.SigneeID,
    }));
  
    try {
      await Promise.all(kidsList.map(async kid => {
        const response = await createPlayer(kid);
        if (response.status >= 300) {
          throw new Error('Failed to create Kid Player');
        }
      }));
    } catch (err) {
      setError('Failed to create Kids Players', err);
    } finally {
      setLoading(false);
    }
  };
  
  const createPlayers = async () => {
    setLoading(true);
    setError('');
  
    try {
      const player = await createPrimaryPlayer();
      if (player && newKidsForms.length > 0) {
        await createKids(player);
      }
      fetchPlayerByEmail(email); // Refresh players list
    } catch (err) {
      setError('Failed to create Players', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    fetchPlayerByEmail(email);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSigningOption = (option) => {
    setSigningFor(option);
    if (option === 'self' || option === 'selfAndKids' || option === 'existingWaiverAddKids') {
      setStep(3);
    }
  };

  const handleAddKid = () => {
    setNewKidsForms([...newKidsForms, { FirstName: '', LastName: '', DateOfBirth: '' }]);
  };

  const handleKidChange = (index, field, value) => {
    const updatedForms = [...newKidsForms];
    updatedForms[index][field] = value;
    setNewKidsForms(updatedForms);
  };

  const handleNewInfoSubmit = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    // const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    // console.log(sigDataUrl); // Here you can handle the signature data as needed
  };

  const handleWaiverAccept = async () => {
    // Proceed to confirmation step
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage('show_video;playerid');
    } else {
      console.error('WebView2 object not found');
    }
    await createPlayers();
    setStep(2);
  };

  const handleWaiverSelection = (waiver) => {
    setSelectedWaiver(waiver);
    setStep(5);
  };

  const handleNFCScan = () => {
    if (window.NFC) {
      window.NFC.scan().then(result => {
        setNfcScanResult(result);
      }).catch(err => {
        setError('NFC scan failed');
      });
    } else {
      setLoading(true);
      setTimeout('', 2000);
      setNfcScanResult(true);
      setLoading(false);
      //setError('NFC scanning not supported on this device');
    }
  };

  const confirmNFCScan = () => {
    if (nfcScanResult) {
      // Proceed to confirmation step
      setStep(6);
    } else {
      setError('Please scan your wristband first');
    }
  };

  return (
    <div className={styles.pageBackground}>
      {step === 1 && (
        <div className={styles.formContainer}>
          <h1>Enter Your Email</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              name="email"
              className={styles.input}
              placeholder="Email"
              onChange={handleEmailChange}
              required
            />
            <button type="submit" className={styles.button} disabled={loading}>Submit</button>
          </form>
        </div>
      )}

      {step === 2 && isEmailFound && (
        <div className={styles.optionContainer}>
          <h2>We Found following waivers for this email, please choose one who want to play or add one</h2>
          <ul>
            {players.map(player => (
              <li key={player.PlayerID} className={styles.playerItem}>
                <span className={styles.playerName}>{player.FirstName} {player.LastName}</span>
                <button onClick={() => handleWaiverSelection(player)} className={styles.button}>Select</button>
              </li>            
            ))}
          </ul>
          <button onClick={() => handleSigningOption('existingWaiverAddKids')} className={styles.button}>Add New Waiver</button>
        </div>
      )}

      {step === 2 && !isEmailFound && (
        <div className={styles.optionContainer}>
          <h2>Who would you like to sign a waiver for?</h2>
          <button onClick={() => handleSigningOption('self')} className={styles.button}>Myself</button>
          <button onClick={() => handleSigningOption('selfAndKids')} className={styles.button}>Myself and Kids</button>
        </div>
      )}

      {step === 3 && signingFor === 'self' && (
        <div className={styles.formContainer}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>First Name:</label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Last Name:</label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Date of Birth:</label>
              <input
                type="date"
                value={form.DateOfBirth}
                onChange={(e) => setForm({ ...form, DateOfBirth: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Phone Number:</label>
              <input 
                type="tel"
                value={form.PhoneNumber}
                onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'selfAndKids' && (
        <div className={styles.formContainer}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>First Name:</label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Last Name:</label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Date of Birth:</label>
              <input
                type="date"
                value={form.DateOfBirth}
                onChange={(e) => setForm({ ...form, DateOfBirth: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Phone Number:</label>
              <input
                type="tel"
                value={form.PhoneNumber}
                onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <h2>Children's Information</h2>
            {newKidsForms.map((kid, index) => (
              <div key={index} className={styles.newKidForm}>
                <h3 className={styles.kidFormHeading}>Child {index + 1} Information</h3>
                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>First Name:</label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) => handleKidChange(index, 'FirstName', e.target.value)}
                    className={styles.formRowInput}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>Last Name:</label>
                  <input
                    type="text"
                    value={kid.LastName}
                    onChange={(e) => handleKidChange(index, 'LastName', e.target.value)}
                    className={styles.formRowInput}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>Date of Birth:</label>
                  <input
                    type="date"
                    value={kid.DateOfBirth}
                    onChange={(e) => handleKidChange(index, 'DateOfBirth', e.target.value)}
                    className={styles.formRowInput}
                    required
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddKid} className={styles.button}>Add Child</button>
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className={styles.waiverContainer}>
          <h1>Waiver Agreement</h1>
          <p className={styles.waiverText}>Please read and accept the waiver agreement to proceed:</p>
          <textarea
            readOnly
            value="This is the waiver agreement text. Please read carefully before proceeding..."
            rows="10"
            className={styles.textarea}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <h2>Sign Below:</h2>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: styles.sigCanvas }}
            onEnd={saveSignature}
          />
          <div className={styles.signatureButtons}>
            <button onClick={clearSignature} className={styles.button} disabled={loading}>Clear Signature</button>
            <button onClick={handleWaiverAccept} className={styles.button} disabled={loading}>Submit</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={styles.nfcContainer}>
          <h1>Scan Your Wristband</h1>
          <p>To complete your registration, please scan your wristband with NFC.</p>
          <button onClick={handleNFCScan} className={styles.button} disabled={loading}>
            Start NFC Scan
          </button>
          {nfcScanResult && (
            <div className={styles.nfcResult}>
              <p>NFC Scan Result: {nfcScanResult}</p>
              <button onClick={confirmNFCScan} className={styles.button} disabled={loading}>
                Confirm
              </button>
            </div>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}


      {step === 6 && (
        <div className={styles.thankYouContainer}>
          <h1>Thank You!</h1>
          {selectedWaiver ? (
            <p>You have selected an existing waiver. Have a great time!</p>
          ) : (
            <p>Your registration and waiver have been successfully submitted. Have a great time!</p>
          )}
          <a href=""> <button className={styles.button} disabled={loading}>Start Over</button></a>
        </div>
      )}
    </div>
  );
};

export default Players;

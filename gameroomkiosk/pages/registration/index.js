import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from '../../styles/Players.module.css';
import { createPlayer, fetchPlayersByEmail, getRequirePlayer, updatePlayer, validatePlayer } from '../../services/api';
import { eligilbeDate, kidDate, minDate } from '../../tools/date';

const Players = () => {
  const [requireWaiver, setRequireWaiver] = useState(false); // Default to true, set to false to skip waiver
  const [email, setEmail] = useState('');
  const [players, setPlayers] = useState([]);
  // const [form, setForm] = useState({ FirstName: '', LastName: '', DateOfBirth: '', PhoneNumber: '' });
    const [form, setForm] = useState({ FirstName: '', LastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Steps: 1: Enter Email, 2: Choose Waiver or Add, 3: Enter Info, 4: Sign Waiver, 5: Scanning Wristband, 6: Confirmation
  const [isEmailFound, setIsEmailFound] = useState(false);
  const [signingFor, setSigningFor] = useState(''); // 'self', 'selfAndKids', 'existingWaiver', 'existingWaiverAddKids'
  const [newKidsForms, setNewKidsForms] = useState([]);
  const [waiverForm, setWaiverForm] = useState({
    safetyVideo: false,
    legalRights: false,
    risks: false,
    assumptionOfRisks: false,
    readAndAgree: false,
    rulesAcknowledgement: false,
  });
  const [nfcScanResult, setNfcScanResult] = useState('');
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const [scanningNFC, setScanningNFC] = useState(false);
  const [disabledButtons, setDisabledButtons] = useState({});

  const sigCanvas = useRef();
  
  useEffect(() => {
    window.receiveMessageFromWPF = (message) => {
      console.log("Received message from WPF:", message);
      setLoading(false);
      setScanningNFC(false);
      setNfcScanResult(message);
      //window.chrome.webview.postMessage("No");
      if (typeof window !== "undefined" && window.stopScan) {
        window.stopScan();
      }      
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.startScan = (playerId) => {
        const message = `ScanCard:${playerId}`;
        
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          // If running in WebView
          window.ReactNativeWebView.postMessage(message);
        } else {
          // Running in MAUI app, simulate navigation
          window.location.href = `https://mauiapp/ScanCard/${playerId}`;
        }
      };
  
      window.stopScan = () => {
        const message = 'StopScan';
        
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        } else {
          window.location.href = `https://mauiapp/StopScan`;
        }
      };
    }
  }, []);  
  

  useEffect(() => {
    const fetchRequireWaiver = async () => {
      const res = await getRequirePlayer();
      setRequireWaiver(res);
    };
  
    fetchRequireWaiver();
  }, []);  

  useEffect(() => {
    const checkWristbands = async () => {
      const newDisabledButtons = {};
      for (let player of players) {
        const result = await handlePlayerSelectButtonDisable(player.PlayerID);
        newDisabledButtons[player.PlayerID] = result;
      }
      setDisabledButtons(newDisabledButtons);
    };
    
    checkWristbands();
  }, [players]);

  // New useEffect to handle step 6 auto-refresh
  useEffect(() => {
    if (step === 6) {
      const timer = setTimeout(() => {
        window.location.reload(); // Refresh the page after 5 seconds
      }, 5000);
      return () => clearTimeout(timer); // Clear timeout if component unmounts or step changes
    }
  }, [step]);

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

  const fetchPrimaryPlayer = () => {
    setError('');
    if (players.length > 0) {
      const primaryPlayer = players.find(player => player.PlayerID === player.SigneeID);
      if (primaryPlayer) {
        console.log(primaryPlayer.PlayerID, primaryPlayer.SigneeID, primaryPlayer.PlayerID === primaryPlayer.SigneeID);
        return primaryPlayer;
      } else {
        console.error("Primary player not found");
      }
    } else {
      setIsEmailFound(false);
      setStep(2);
    }
  }

  const createPrimaryPlayer = async () => {
    setLoading(true);
    setError('');
    const signature = requireWaiver ? sigCanvas.current.toDataURL() : ''; // Set signature to empty if waiver is not required
    const player = {
      "FirstName": form.FirstName,
      "LastName": form.LastName,
      // "DateOfBirth": form.DateOfBirth,
      "email": email,
      "Signature": signature, // Assign empty signature if waiver is not required
      "DateSigned": Date.now(),
    };
  
    try {
      const res = await createPlayer(player);
      if (res.status >= 300) {
        setError('Failed to create Primary Player due to internal error');
        return null;
      }
      const updatedPlayer = { ...res, "SigneeID": res.PlayerID };
      await updatePlayer(res.PlayerID, updatedPlayer);
      return updatedPlayer;
    } catch (err) {
      setError('Failed to create Primary Player', err);
      return null;
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
      "Signature": requireWaiver ? player.Signature : '', // Assign empty signature if waiver is not required
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
      const player = players.length > 0 ? fetchPrimaryPlayer(): await createPrimaryPlayer();
      console.log(player);
      if (player && newKidsForms.length > 0) {
        await createKids(player);
      }
      fetchPlayerByEmail(email); // Refresh players list
    } catch (err) {
      console.error('Failed to create Players', err);
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
    //setNewKidsForms([...newKidsForms, { FirstName: '', LastName: '', DateOfBirth: '' }]);
    setNewKidsForms([...newKidsForms, { FirstName: '', LastName: ''}]);
  };

  const handleKidChange = (index, field, value) => {
    const updatedForms = [...newKidsForms];
    updatedForms[index][field] = value;
    setError('');
    setNewKidsForms(updatedForms);
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
  
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };  

  const handleNewInfoSubmit = async (e) => {
    e.preventDefault();
    if (signingFor === "existingWaiverAddKids") {
      await createPlayers();
      setNewKidsForms([]);
      setStep(2);
      return;
    }
  
    // Skip waiver if it's not required
    if (!requireWaiver) {
      await createPlayers();
      setStep(5); // Skip to wristband scanning
      return;
    }
  
    setError("");
    setStep(4); // Proceed to waiver if required
  };
  

  const handleWaiverCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setWaiverForm((prevForm) => ({
      ...prevForm,
      [name]: checked,
    }));
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    // const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    // console.log(sigDataUrl); // Here you can handle the signature data as needed
  };

  const handleWaiverAccept = async () => {
    setError('');
    if(!waiverForm.safetyVideo || !waiverForm.legalRights || !waiverForm.risks || !waiverForm.assumptionOfRisks || !waiverForm.readAndAgree || !waiverForm.rulesAcknowledgement){
      setError('To accept the form, all the checkboxes should be checked');
      return;
    }
    await createPlayers();
    setStep(2);
  };

  const handleWaiverSelection = async (waiver) => {
    setSelectedWaiver(waiver);
    setStep(5);
    setLoading(true);
    setScanningNFC(true);
    // if (window.chrome && window.chrome.webview) {
    //   await window.chrome.webview.postMessage(`ScanCard:${waiver.PlayerID}`);
    // }
    if (typeof window !== "undefined" && window.startScan) {
      window.startScan(waiver.PlayerID);
    }    
  };

  const handlePlayerSelectButtonDisable = async (PID) => {
    try {
      const isWristbandValid = await validatePlayer(PID);
      return isWristbandValid;
    } catch (error) {
      console.error("Error validating player:", error);
      return false; // Disable button in case of an error
    }
  };  

  const resetFormState = () => {
    setEmail('');
    setPlayers([]);
    //setForm({ FirstName: '', LastName: '', DateOfBirth: '', PhoneNumber: '' });
    setForm({ FirstName: '', LastName: ''});
    setLoading(false);
    setError('');
    setStep(1); // Start from the beginning
    setIsEmailFound(false);
    setSigningFor('');
    setNewKidsForms([]);
    setWaiverForm({
      safetyVideo: false,
      legalRights: false,
      risks: false,
      assumptionOfRisks: false,
      readAndAgree: false,
      rulesAcknowledgement: false,
    });
    setNfcScanResult('');
    setSelectedWaiver(null);
    setScanningNFC(false);
  };  

  const handleCancel = () => {
    if (step === 2) {
      resetFormState();
      setStep(1); // Reloads the page for a fresh start
    } else if (step > 2) {
      setStep(2); // Go back to the user selection screen
      setSelectedWaiver(null);
      setScanningNFC(false);
      setLoading(false);
      setNfcScanResult('');
    }
  };
  

  const confirmNFCScan = () => {
    setNfcScanResult(false);
    if (nfcScanResult) {
      // Proceed to confirmation step
      setStep(6);
    } else {
      setError('Please scan your wristband first');
    }
  };

  const scanAnother = () => {
    setNfcScanResult(false);
    fetchPlayerByEmail(email);
    setStep(2);
  };

  const handleRemoveKid = (index) => {
    const updatedForms = [...newKidsForms];
    updatedForms.splice(index, 1);  
    setNewKidsForms(updatedForms);
  }

  return (
    <div className={styles.pageBackground}>
      {step === 1 && (
        <div className={styles.container}>
          <h1>Enter Email</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              name="email"
              className={styles.input}
              placeholder="johndoe@example.com"
              onChange={handleEmailChange}
              required
            />
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
          </form>
        </div>
      )}

      {step === 2 && isEmailFound && (
        <div className={styles.container}>
        <h2>
          Select a Player to Assign a Wristband
        </h2>
          <ul>
            {players.map(player => {
              const isValid = disabledButtons[player.PlayerID];
              return (
                <li key={player.PlayerID} className={styles.playerItem}>
                  <span className={styles.playerName}>
                    {player.FirstName} {player.LastName}
                  </span>
                  <button
                    onClick={() => handleWaiverSelection(player)}
                    className={styles.button}
                    disabled={isValid}
                  >
                    {isValid ? 'Active' : 'Select'}
                  </button>
                </li>
              );
            })}
          </ul>
          <button onClick={() => handleSigningOption('existingWaiverAddKids')} className={styles.button}>Add New Waiver</button>
          <button type="button" onClick={handleCancel} className={styles.button} disabled={loading}>Cancel</button>
        </div>
      )}

      {step === 2 && !isEmailFound && (
        <div className={styles.container}>
          <h2>Who would you like to sign a waiver for?</h2>
          <button onClick={() => handleSigningOption('self')} className={styles.button}>Myself</button>
          <button onClick={() => handleSigningOption('selfAndKids')} className={styles.button}>Myself and Kids</button>
          <button type="button" onClick={handleCancel} className={styles.button} disabled={loading}>Cancel</button>
        </div>
      )}

      {step === 3 && signingFor === 'self' && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>First Name<span className={styles.required}>*</span></label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Last Name<span className={styles.required}>*</span></label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
            <button type="button" onClick={handleCancel} className={styles.button} disabled={loading}>Cancel</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'selfAndKids' && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>First Name<span className={styles.required}>*</span></label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>Last Name<span className={styles.required}>*</span></label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                className={styles.formRowInput}
                required
              />
            </div>

            <h2>Enter Children Information</h2>
              {newKidsForms.map((kid, index) => (
                <div key={index} className={styles.newKidForm}>             
                <div className={styles.kidFormHeader}>
                  <h3 className={styles.kidFormHeading}>Child {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveKid(index)}
                    className={`${styles.button} ${styles.removeKidButton}`}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>First Name<span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={kid.FirstName}
                      onChange={(e) => handleKidChange(index, 'FirstName', e.target.value)}
                      className={styles.formRowInput}
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>Last Name<span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={kid.LastName}
                      onChange={(e) => handleKidChange(index, 'LastName', e.target.value)}
                      className={styles.formRowInput}
                      required
                    />
                  </div>
                </div>
              ))}
            <button type="button" onClick={handleAddKid} className={styles.button}>New Child</button>
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
            <button type="button" onClick={handleCancel} className={styles.button} disabled={loading}>Cancel</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'existingWaiverAddKids' && (
        <div className={styles.container}>
          <form onSubmit={handleNewInfoSubmit}>
            <h2>Enter Children Information</h2>

            {newKidsForms.map((kid, index) => (
              <div key={index} className={styles.newKidForm}>
                <div className={styles.kidFormHeader}>
                  <h3 className={styles.kidFormHeading}>Child {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveKid(index)}
                    className={`${styles.button} ${styles.removeKidButton}`}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>First Name<span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) => handleKidChange(index, 'FirstName', e.target.value)}
                    className={styles.formRowInput}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>Last Name<span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={kid.LastName}
                    onChange={(e) => handleKidChange(index, 'LastName', e.target.value)}
                    className={styles.formRowInput}
                    required
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={handleAddKid} className={styles.button}>
              New Child
            </button>
            <button type="submit" className={styles.button} disabled={loading}>
              Next
            </button>
            <button type="button" onClick={handleCancel} className={styles.button} disabled={loading}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {!requireWaiver && step===4 && setStep(5)}

      {requireWaiver && step === 4 && (
        <div className={styles.container}>
          <h2>RELEASE OF LIABILITY, WAIVER OF CLAIMS AND AGREEMENT NOT TO SUE</h2>
          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>I HAVE WATCHED THE AEROSPORTS TRAMPOLINE PARKS SAFETY VIDEO AND FULLY UNDERSTAND ITS CONTENT. FOR ANY INDIVIDUAL THAT I AM THE PARENT OR LEGAL GUARDIAN OF AND FOR WHOM I HAVE COMPLETED A WAIVER FOR, I CONFIRM THAT I HAVE VIEWED THE VIDEO WITH THEM AND/OR EXPLAINED THE CONTENT REGARDING THE RULES, REGULATIONS AND POTENTIAL RISKS OUTLINED WITHIN THE SAFETY VIDEO. YOU CAN WATCH THE VIDEO IN THE PARK OR ON THE WEBSITE AT <a href="http://www.aerosportsparks.ca" target="_blank">WWW.AEROSPORTSPARKS.CA</a> UNDER THE SAFETY TAB.</p>
              <input
                type="checkbox"
                id="safetyVideo"
                name="safetyVideo"
                checked={waiverForm.safetyVideo}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>BY COMPLETING THIS CONTRACT YOU WILL GIVE UP ALL LEGAL RIGHTS INCLUDING THE RIGHT OF YOU AND YOUR CHILD(REN)/WARD TO SUE OR CLAIM COMPENSATION FOLLOWING AN ACCIDENT HOWEVER CAUSED.</p>
              <input
                type="checkbox"
                id="legalRights"
                name="legalRights"
                checked={waiverForm.legalRights}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                PLEASE READ CAREFULLY!
                <br />
                RISKS
                <br />
                I acknowledge on behalf of myself and/or my child(ren)/ward that participation in AEROSPORTS ST. CATHARINES activities involves known and unanticipated risks that could result in physical or emotional injury, paralysis, death, or damage to me and/or my child(ren)/ward, or other people, and/or damage to my property. I understand that such risks cannot be eliminated without jeopardizing the essential qualities of the activity.
                <br />
                Participants may fall off equipment, sprain or break wrists, ankles and legs, and can suffer more serious injuries such as brain injury, spinal injury, or even death. Traveling to and from trampoline locations raises the possibility of any manner of transportation accidents. Participants often fall on each other or bump into each other resulting in broken bones and other serious injuries. Double bouncing (more than one person per trampoline) can create a rebound effect causing serious injury. Flipping and running and bouncing off the walls is dangerous and can cause serious injury. These activities are prohibited and if done by you they are being done at your own risk. If you or your child(ren)/ward is injured, and require medical assistance then this is at your own expense.
                <br />
                Furthermore, AEROSPORTS employees have difficult jobs to perform. They seek safety, but they are not infallible. They might be unaware of a participant's health or abilities. They may give incomplete warnings or instructions, and make other mistakes that might result in injury to you and your child(ren)/ward. The equipment being used might malfunction or be unsafe for any reason.
              </p>
              <input
                type="checkbox"
                id="risks"
                name="risks"
                checked={waiverForm.risks}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I AM ASSUMING ON BEHALF OF MYSELF AND/OR MY CHILD(REN)/WARD, ALL RISK OF PERSONAL INJURY, DEATH, OR DISABILITY OR PROPERTY DAMAGE OR LOSS TO MYSELF AND/OR MY CHILD(REN)/WARD, OR ANY OTHER PERSON THAT MAY RESULT FROM PARTICIPATION IN THESE ACTIVITIES, HOWEVER CAUSED, INCLUDING INJURY, LOSS, OR DAMAGE ARISING FROM NEGLIGENCE OR FAULT ON THE PART OF AEROSPORTS ST. CATHARINES, 2483848 Ontario Limited., ITS DIRECTORS, OFFICERS, AGENTS, ITS EMPLOYEES, VOLUNTEERS, OR OTHER PARTICIPANTS.
              </p>
              <input
                type="checkbox"
                id="assumptionOfRisks"
                name="assumptionOfRisks"
                checked={waiverForm.assumptionOfRisks}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I HAVE READ THIS AND AGREE TO ASSUME ON BEHALF OF MYSELF OR MY CHILD(REN)/WARD ALL RISKS AND AGREE TO GIVE UP THE RIGHT TO SUE OR CLAIM COMPENSATION ON BEHALF OF MYSELF OR MY CHILD(REN)/WARD
              </p>
              <input
                type="checkbox"
                id="readAndAgree"
                name="readAndAgree"
                checked={waiverForm.readAndAgree}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I ACKNOWLEDGE THAT I HAVE READ THESE RULES AND ALSO CERTIFY THAT I HAVE EXPLAINED THE RULES TO MY CHILD(REN)/WARD LISTED IN THIS CONTRACT. I UNDERSTAND RELEASE OF LIABILITY, WAIVER OF CLAIMS AND INDEMNITY AGREEMENT
              </p>
              <input
                type="checkbox"
                id="rulesAcknowledgement"
                name="rulesAcknowledgement"
                checked={waiverForm.rulesAcknowledgement}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I HAVE READ THIS AND AGREE TO GIVE UP THE RIGHT TO SUE OR CLAIM COMPENSATION ON MY BEHALF AND/OR MY CHILD(REN)/WARD
              </p>
              <input
                type="checkbox"
                id="rightToSue"
                name="rightToSue"
                checked={waiverForm.rightToSue}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I HAVE READ THE RELEASE AGREEMENT AND I AGREE THAT I OR MY CHILD(REN)/WARD TO BE BOUND BY ITS TERMS.
              </p>
              <input
                type="checkbox"
                id="boundByTerms"
                name="boundByTerms"
                checked={waiverForm.boundByTerms}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <h2 className={styles.waiverLabel}>Sign Below:</h2>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: styles.sigCanvas }}
            onEnd={saveSignature}
          />
          <p className={styles.waiverLabel}>{error}</p>
          <div className={styles.signatureButtons}>
            <button onClick={clearSignature} className={styles.button} disabled={loading}>Clear Signature</button>
            <button onClick={handleWaiverAccept} className={styles.button} disabled={loading}>Accept</button>
            <button type="button" onClick={handleCancel} className={styles.button}>Decline</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={styles.container}>
          <h1>Wristband Scanner</h1>
          {!nfcScanResult && scanningNFC && (
            <div className={styles.nfcResult}>
              <p>Hi {selectedWaiver.FirstName} {selectedWaiver.LastName}, Please scan your wristband...</p>
              <div className={styles.loader}>
                    <div></div>
                    <div></div>
                </div>
              <button type="button" onClick={handleCancel} className={styles.button}>
                Cancel
              </button>
            </div>
          )}
          {nfcScanResult && !scanningNFC && (
            <div className={styles.nfcResult}>
              <p>Scanned Successfully!</p>
              <button onClick={confirmNFCScan} className={styles.button}>
                I'm done
              </button>
              <button type="button" onClick={scanAnother} className={styles.button} disabled={loading}>
                Scan Another
              </button>
            </div>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}


      {step === 6 && (
        <div className={styles.container}>
          <h1>Thank You!</h1>
          {selectedWaiver ? (
            <p>Thank you for returning. Have a great time!</p>
          ) : (
            <p>Your registration and waiver has been successfully submitted. Have a great time!</p>
          )}
          <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Start Over</button>
        </div>
      )}
    </div>
  );
};

export default Players;

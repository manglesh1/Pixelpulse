import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from '../../styles/Players.module.css';
import {createPlayer, fetchPlayersByEmail, updatePlayer} from '../../services/api';

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
  const [waiverForm, setWaiverForm] = useState({
    safetyVideo: false,
    legalRights: false,
    risks: false,
  });
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
    setNewKidsForms([...newKidsForms, { FirstName: '', LastName: '', DateOfBirth: '' }]);
  };

  const handleKidChange = (index, field, value) => {
    const updatedForms = [...newKidsForms];
    updatedForms[index][field] = value;
    setNewKidsForms(updatedForms);
  };

  const handleNewInfoSubmit = async (e) => {
    e.preventDefault();
    if(signingFor==="existingWaiverAddKids") {
      await createPlayers();
      setNewKidsForms([]);
      setStep(2);
      return;
    }
    setStep(4);
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
    console.log(waiverForm.safetyVideo, waiverForm.legalRights, waiverForm.risks);
    if(!waiverForm.safetyVideo || !waiverForm.legalRights || !waiverForm.risks){
      setError('To accept the form, all the checkboxes should be checked');
      return;
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
        <div className={styles.container}>
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
        <div className={styles.container}>
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
          <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Cancel</button>
        </div>
      )}

      {step === 2 && !isEmailFound && (
        <div className={styles.container}>
          <h2>Who would you like to sign a waiver for?</h2>
          <button onClick={() => handleSigningOption('self')} className={styles.button}>Myself</button>
          <button onClick={() => handleSigningOption('selfAndKids')} className={styles.button}>Myself and Kids</button>
          <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Cancel</button>
        </div>
      )}

      {step === 3 && signingFor === 'self' && (
        <div className={styles.container}>
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
            <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Cancel</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'selfAndKids' && (
        <div className={styles.container}>
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
            <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Cancel</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'existingWaiverAddKids' && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
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
            <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Cancel</button>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className={styles.container}>
          <h2>RELEASE OF LIABILITY, WAIVER OF CLAIMS AND AGREEMENT NOT TO SUE</h2>
          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>I HAVE WATCHED THE AEROSPORTS TRAMPOLINE PARKS SAFETY VIDEO AND FULLY UNDERSTAND ITS CONTENT. FOR ANY INDIVIDUAL THAT I AM THE PARENT OR LEGAL GUARDIAN OF AND FOR WHOM I HAVE COMPLETED A WAIVER FOR, I CONFIRM THAT I HAVE VIEWED THE VIDEO WITH THEM AND/OR EXPLAINED THE CONTENT REGARDING THE RULES, REGULATIONS AND POTENTIAL RISKS OUTLINED WITHIN THE SAFETY VIDEO.YOU CAN WATCH THE VIDEO IN THE PARK OR ON THE WEBSITE AT <a href="http://www.aerosportsparks.ca" target="_blank">WWW.AEROSPORTSPARKS.CA</a> UNDER THE SAFETY TAB.</p>
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
                I acknowledge on behalf of myself and/or my child(ren)/ward that participation in
                AEROSPORTS ST. CATHARINES activities involves known and unanticipated risks that could result in physical or emotional injury, paralysis, death, or damage to me and/or my child(ren)/ward, or other people, and/or damage to my property. I understand that such risks cannot be eliminated without jeopardizing the essential qualities of the activity.
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
            <button type="button" onClick={() => window.location.href = '/registration'} className={styles.button} disabled={loading}>Decline</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={styles.container}>
          <h1>Wristband Scanner</h1>
          {!nfcScanResult && (
              <>
                <p>Please scan your wristband.</p>
                <button onClick={handleNFCScan} className={styles.button} disabled={loading}>
                  Start Scanning
                </button>
              </>
            )
          }
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
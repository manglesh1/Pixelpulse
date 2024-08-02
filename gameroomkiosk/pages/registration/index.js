import { useState, useRef } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import styles from '../../styles/Players.module.css';

const Players = () => {
  const [email, setEmail] = useState('');
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ FirstName: '', LastName: '', DateOfBirth: '', PhoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Steps: 1: Enter Email, 2: Choose Waiver or Add, 3: Enter Info, 4: Sign Waiver, 5: Confirmation
  const [isEmailFound, setIsEmailFound] = useState(false);
  const [signingFor, setSigningFor] = useState(''); // 'self', 'selfAndKids', or 'existingWaiver'
  const [newKidsForms, setNewKidsForms] = useState([]);
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const sigCanvas = useRef({});

  const API_BASE_URL = 'http://localhost:3000/api/player/';

  const fetchPlayerByEmail = async (email) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}findAll/?email=${email}`);
      console.log(res);
      const playersList = res.data;

      if (playersList.length > 0) {
        setPlayers(playersList);
        setIsEmailFound(true);
        setStep(2);
      } else {
        setIsEmailFound(false);
        setStep(2);
      }
    } catch (err) {
      setError('Failed to fetch player data');
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
    if (option === 'self' || option === 'selfAndKids') {
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
    // Proceed to waiver signing step
    setStep(4);
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    console.log(sigDataUrl); // Here you can handle the signature data as needed
  };

  const handleWaiverAccept = () => {
    // Proceed to confirmation step
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage('show_video;playerid');
    } else {
      console.error('WebView2 object not found');
    }
    setStep(5);
  };

  const handleWaiverSelection = (waiver) => {
    setSelectedWaiver(waiver);
    setStep(5);
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
          <h1>We Found following waivers for this email, please choose one who want to play or add one</h1>
          <ul>
            {players.map(player => (
              <li key={player.PlayerID}>
                {player.FirstName} {player.LastName} - Date Signed: {new Date(player.DateSigned).toLocaleDateString()}
                <button onClick={() => handleWaiverSelection(player)} className={styles.button}>Select</button>
              </li>
            ))}
          </ul>
          <button onClick={() => handleSigningOption('selfAndKids')} className={styles.button}>Add New Waiver</button>
        </div>
      )}

      {step === 2 && !isEmailFound && (
        <div className={styles.optionContainer}>
          <h1>Would you like to sign a waiver for yourself or yourself and kids?</h1>
          <button onClick={() => handleSigningOption('self')} className={styles.button}>Myself</button>
          <button onClick={() => handleSigningOption('selfAndKids')} className={styles.button}>Myself and Kids</button>
        </div>
      )}

      {step === 3 && signingFor === 'self' && (
        <div className={styles.formContainer}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <label>First Name:</label>
            <input
              type="text"
              value={form.FirstName}
              onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
              className={styles.input}
              required
            />
            <label>Last Name:</label>
            <input
              type="text"
              value={form.LastName}
              onChange={(e) => setForm({ ...form, LastName: e.target.value })}
              className={styles.input}
              required
            />
            <label>Date of Birth:</label>
            <input
              type="date"
              value={form.DateOfBirth}
              onChange={(e) => setForm({ ...form, DateOfBirth: e.target.value })}
              className={styles.input}
              required
            />
            <label>Phone Number:</label>
            <input
              type="tel"
              value={form.PhoneNumber}
              onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.button} disabled={loading}>Next</button>
          </form>
        </div>
      )}

      {step === 3 && signingFor === 'selfAndKids' && (
        <div className={styles.formContainer}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
            <label>First Name:</label>
            <input
              type="text"
              value={form.FirstName}
              onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
              className={styles.input}
              required
            />
            <label>Last Name:</label>
            <input
              type="text"
              value={form.LastName}
              onChange={(e) => setForm({ ...form, LastName: e.target.value })}
              className={styles.input}
              required
            />
            <label>Date of Birth:</label>
            <input
              type="date"
              value={form.DateOfBirth}
              onChange={(e) => setForm({ ...form, DateOfBirth: e.target.value })}
              className={styles.input}
              required
            />
            <label>Phone Number:</label>
            <input
              type="tel"
              value={form.PhoneNumber}
              onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })}
              className={styles.input}
              required
            />
            <h2>Kids Information</h2>
            {newKidsForms.map((kid, index) => (
              <div key={index} className={styles.newKidForm}>
                <label>First Name:</label>
                <input
                  type="text"
                  value={kid.FirstName}
                  onChange={(e) => handleKidChange(index, 'FirstName', e.target.value)}
                  required
                  className={styles.input}
                />
                <label>Last Name:</label>
                <input
                  type="text"
                  value={kid.LastName}
                  onChange={(e) => handleKidChange(index, 'LastName', e.target.value)}
                  required
                  className={styles.input}
                />
                <label>Date of Birth:</label>
                <input
                  type="date"
                  value={kid.DateOfBirth}
                  onChange={(e) => handleKidChange(index, 'DateOfBirth', e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
            ))}
            <button type="button" onClick={handleAddKid} className={styles.button}>Add Kid</button>
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

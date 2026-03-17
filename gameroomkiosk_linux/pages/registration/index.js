import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import SignatureCanvas from "react-signature-canvas";
import "react-simple-keyboard/build/css/index.css";
import styles from "../../styles/Players.module.css";
import {
  fetchPlayersByEmail,
  validatePlayer,
  findOrCreatePlayer,
  findOrCreateChildPlayer,
} from "../../services/api";

const Keyboard = dynamic(() => import("react-simple-keyboard"), {
  ssr: false,
});

const Players = () => {
  const [email, setEmail] = useState("");
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ FirstName: "", LastName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [isEmailFound, setIsEmailFound] = useState(false);
  const [signingFor, setSigningFor] = useState("");
  const [newKidsForms, setNewKidsForms] = useState([]);
  const [waiverForm, setWaiverForm] = useState({
    safetyRules: false,
    specialEffects: false,
    legalRights: false,
    risks: false,
    assumptionOfRisks: false,
    readAndAgree: false,
    rulesAcknowledgement: false,
    rightToSue: false,
    boundByTerms: false,
  });
  const [nfcScanResult, setNfcScanResult] = useState("");
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const [scanningNFC, setScanningNFC] = useState(false);
  const [disabledButtons, setDisabledButtons] = useState({});
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [keyboardLayoutName, setKeyboardLayoutName] = useState("default");
  const isInteractingWithKeyboard = useRef(false);

  const sigCanvas = useRef();
  const keyboardRef = useRef(null);

  const emailSuffixes = [
    "@gmail.com",
    "@hotmail.com",
    "@outlook.com",
    "@yahoo.com",
  ];

  useEffect(() => {
    const notifyHost = (type, extra = {}) => {
      if (window.chrome?.webview?.postMessage) {
        window.chrome.webview.postMessage({ type, ...extra });
      }
    };

    window.receiveMessageFromWPF = (message) => {
      setLoading(false);
      setScanningNFC(false);
      setNfcScanResult(message);

      if (typeof window !== "undefined" && window.stopScan) {
        window.stopScan();
      }
    };

    window.startScan = (playerId) => {
      notifyHost("ScanCard", { playerId });
    };

    window.stopScan = () => {
      notifyHost("StopScan");
    };

    return () => {
      delete window.receiveMessageFromWPF;
      delete window.startScan;
      delete window.stopScan;
    };
  }, []);

  useEffect(() => {
    const checkWristbands = async () => {
      const newDisabledButtons = {};

      for (const player of players) {
        const result = await handlePlayerSelectButtonDisable(player.PlayerID);
        newDisabledButtons[player.PlayerID] = result;
      }

      setDisabledButtons(newDisabledButtons);
    };

    if (players.length > 0) {
      checkWristbands();
    } else {
      setDisabledButtons({});
    }
  }, [players]);

  useEffect(() => {
    if (step === 6) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const getKidFieldValue = (index, field) => {
    return newKidsForms[index]?.[field] || "";
  };

  const getValueForField = (field) => {
    if (!field) return "";

    if (field === "email") return email;
    if (field === "firstName") return form.FirstName;
    if (field === "lastName") return form.LastName;

    if (field.startsWith("kid-")) {
      const [, index, kidField] = field.split("-");
      return getKidFieldValue(Number(index), kidField);
    }

    return "";
  };

  useEffect(() => {
    if (showKeyboard && keyboardRef.current && focusedField) {
      keyboardRef.current.setInput(getValueForField(focusedField));
    }
  }, [showKeyboard, focusedField]);

  useEffect(() => {
    if (!keyboardRef.current || !focusedField) return;
    keyboardRef.current.setInput(getValueForField(focusedField));
  }, [email, form, newKidsForms, focusedField]);

  const hideKeyboard = () => {
    if (keyboardRef.current) {
      try {
        keyboardRef.current.clearInput();
      } catch (err) {
        console.warn("Failed to clear keyboard input", err);
      }
    }

    setShowKeyboard(false);
    setFocusedField(null);
    setKeyboardLayoutName("default");
  };

  const handleInputFocus = (field) => {
    setFocusedField(field);
    setShowKeyboard(true);
    setKeyboardLayoutName("default");

    setTimeout(() => {
      if (keyboardRef.current) {
        keyboardRef.current.setInput(getValueForField(field));
      }
    }, 0);
  };

const handleInputBlur = (e) => {
  const nextFocused = e.relatedTarget;

  const movingToKeyboard =
    nextFocused?.closest?.(`.${styles.sharedKeyboardWrap}`) ||
    nextFocused?.closest?.(".simple-keyboard");

  const movingToInput =
    nextFocused?.tagName === "INPUT" ||
    nextFocused?.tagName === "TEXTAREA";

  if (movingToKeyboard || movingToInput || isInteractingWithKeyboard.current) {
    return;
  }

  setTimeout(() => {
    if (isInteractingWithKeyboard.current) return;

    const active = document.activeElement;

    const insideKeyboard =
      active?.closest?.(`.${styles.sharedKeyboardWrap}`) ||
      active?.closest?.(".simple-keyboard");

    const insideInput =
      active?.tagName === "INPUT" || active?.tagName === "TEXTAREA";

    if (!insideKeyboard && !insideInput) {
      hideKeyboard();
    }
  }, 80);
};

  const handleShift = () => {
    setKeyboardLayoutName((prev) =>
      prev === "default" ? "shift" : "default",
    );
  };

  const handleKeyboardChange = (input) => {
    if (!focusedField) return;

    setError("");

    if (focusedField === "email") {
      setEmail(input);
      return;
    }

    if (focusedField === "firstName") {
      setForm((prev) => ({ ...prev, FirstName: input }));
      return;
    }

    if (focusedField === "lastName") {
      setForm((prev) => ({ ...prev, LastName: input }));
      return;
    }

    if (focusedField.startsWith("kid-")) {
      const [, index, field] = focusedField.split("-");
      handleKidChange(Number(index), field, input);
    }
  };

  const handleKeyboardKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") {
      handleShift();
    }

    if (button === "{enter}") {
      hideKeyboard();
    }
  };

  const applyEmailSuffix = (suffix) => {
    const current = (email || "").trim();

    if (!current) return;

    let updatedEmail = "";

    if (current.includes("@")) {
      const localPart = current.split("@")[0];
      updatedEmail = `${localPart}${suffix}`;
    } else {
      updatedEmail = `${current}${suffix}`;
    }

    setEmail(updatedEmail);

    if (keyboardRef.current) {
      keyboardRef.current.setInput(updatedEmail);
    }
  };

  const fetchPlayerByEmail = async (emailValue) => {
    setLoading(true);
    setError("");

    try {
      const playersList = await fetchPlayersByEmail(emailValue);

      if (playersList.length > 0) {
        setPlayers(playersList);
        setIsEmailFound(true);
      } else {
        setPlayers([]);
        setIsEmailFound(false);
      }

      setStep(2);
      return playersList;
    } catch (err) {
      console.error("Failed to fetch player data", err);
      setError("Failed to fetch player data");
      setPlayers([]);
      setIsEmailFound(false);
      setStep(2);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPrimaryPlayer = () => {
    setError("");

    if (players.length > 0) {
      const primaryPlayer = players.find(
        (player) => player.PlayerID === player.SigneeID,
      );

      if (primaryPlayer) return primaryPlayer;

      console.error("Primary player not found");
      return null;
    }

    setIsEmailFound(false);
    setStep(2);
    return null;
  };

  const createPrimaryPlayer = async () => {
    setLoading(true);
    setError("");

    const signature = sigCanvas.current ? sigCanvas.current.toDataURL() : "";

    const playerPayload = {
      FirstName: form.FirstName.trim(),
      LastName: form.LastName.trim(),
      Email: email.trim(),
      Signature: signature,
      DateSigned: Date.now(),
    };

    try {
      const res = await findOrCreatePlayer(playerPayload);
      return res ?? null;
    } catch (err) {
      console.error("Failed to create/find primary player", err);
      setError("Failed to create primary player");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createKids = async (parentPlayer) => {
    if (!parentPlayer || newKidsForms.length === 0) return [];

    setLoading(true);
    setError("");

    const kidsList = newKidsForms
      .filter((kid) => kid.FirstName?.trim() && kid.LastName?.trim())
      .map((kid) => ({
        FirstName: kid.FirstName.trim(),
        LastName: kid.LastName.trim(),
        DateOfBirth: kid.DateOfBirth,
        Email: email.trim(),
        Signature: parentPlayer.Signature || "",
        DateSigned: Date.now(),
        SigneeID: parentPlayer.SigneeID || parentPlayer.PlayerID,
      }));

    try {
      const results = await Promise.all(
        kidsList.map((kid) => findOrCreateChildPlayer(kid)),
      );
      return results;
    } catch (err) {
      console.error("Failed to create/find kids", err);
      setError("Failed to create children");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createPlayers = async () => {
    setLoading(true);
    setError("");

    try {
      const player =
        players.length > 0 ? fetchPrimaryPlayer() : await createPrimaryPlayer();

      if (!player) return null;

      if (newKidsForms.length > 0) {
        await createKids(player);
      }

      await fetchPlayerByEmail(email);
      return player;
    } catch (err) {
      console.error("Failed to create players", err);
      setError("Failed to create players");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startScanForPlayer = (player) => {
    if (!player) return;

    hideKeyboard();
    setSelectedWaiver(player);
    setStep(5);
    setLoading(true);
    setScanningNFC(true);
    setNfcScanResult("");
    setError("");

    if (typeof window !== "undefined" && window.startScan) {
      window.startScan(player.PlayerID);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    hideKeyboard();
    await fetchPlayerByEmail(email);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSigningOption = (option) => {
    setSigningFor(option);

    if (
      option === "self" ||
      option === "selfAndKids" ||
      option === "existingWaiverAddKids"
    ) {
      setStep(3);
    }
  };

  const handleAddKid = () => {
    setNewKidsForms([...newKidsForms, { FirstName: "", LastName: "" }]);
  };

  const handleKidChange = (index, field, value) => {
    const updatedForms = [...newKidsForms];
    updatedForms[index][field] = value;
    setError("");
    setNewKidsForms(updatedForms);
  };

  const handleNewInfoSubmit = async (e) => {
    e.preventDefault();
    hideKeyboard();

    if (signingFor === "existingWaiverAddKids") {
      await createPlayers();
      setNewKidsForms([]);
      setStep(2);
      return;
    }

    setError("");
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
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {};

  const handleWaiverAccept = async () => {
    setError("");
    hideKeyboard();

    if (
      !waiverForm.safetyRules ||
      !waiverForm.specialEffects ||
      !waiverForm.legalRights ||
      !waiverForm.risks ||
      !waiverForm.assumptionOfRisks ||
      !waiverForm.readAndAgree ||
      !waiverForm.rulesAcknowledgement ||
      !waiverForm.rightToSue ||
      !waiverForm.boundByTerms
    ) {
      setError("To accept the form, all the checkboxes should be checked");
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      setError("Please provide your signature before accepting");
      return;
    }

    const player = await createPlayers();
    if (player) startScanForPlayer(player);
  };

  const handleWaiverSelection = async (waiver) => {
    startScanForPlayer(waiver);
  };

  const handlePlayerSelectButtonDisable = async (PID) => {
    try {
      const isWristbandValid = await validatePlayer(PID);
      return isWristbandValid;
    } catch (error) {
      console.error("Error validating player:", error);
      return false;
    }
  };

  const resetFormState = () => {
    setEmail("");
    setPlayers([]);
    setForm({ FirstName: "", LastName: "" });
    setLoading(false);
    setError("");
    setStep(1);
    setIsEmailFound(false);
    setSigningFor("");
    setNewKidsForms([]);
    setWaiverForm({
      safetyRules: false,
      specialEffects: false,
      legalRights: false,
      risks: false,
      assumptionOfRisks: false,
      readAndAgree: false,
      rulesAcknowledgement: false,
      rightToSue: false,
      boundByTerms: false,
    });
    setNfcScanResult("");
    setSelectedWaiver(null);
    setScanningNFC(false);
    hideKeyboard();
  };

  const handleCancel = () => {
    hideKeyboard();

    if (step === 2) {
      resetFormState();
      setStep(1);
    } else if (step > 2) {
      setStep(2);
      setSelectedWaiver(null);
      setScanningNFC(false);
      setLoading(false);
      setNfcScanResult("");
      setError("");
    }
  };

  const confirmNFCScan = () => {
    if (nfcScanResult) {
      setStep(6);
    } else {
      setError("Please scan your wristband first");
    }
  };

  const scanAnother = async () => {
    setNfcScanResult("");
    await fetchPlayerByEmail(email);
    setStep(2);
  };

  const handleRemoveKid = (index) => {
    const updatedForms = [...newKidsForms];
    updatedForms.splice(index, 1);
    setNewKidsForms(updatedForms);
  };

  const keyboardLayout = {
    default: [
      "1 2 3 4 5 6 7 8 9 0",
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {bksp}",
      "@ . - _ {space}",
      "{enter}",
    ],
    shift: [
      "! @ # $ % ^ & * ( )",
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {bksp}",
      "@ . - _ {space}",
      "{enter}",
    ],
  };

const renderSharedKeyboard = () => {
  if (!showKeyboard || !focusedField) return null;

  return (
    <div className={styles.sharedKeyboardOuter}>
      <div
        className={styles.sharedKeyboardWrap}
        onMouseDown={() => {
          isInteractingWithKeyboard.current = true;
        }}
        onMouseUp={() => {
          setTimeout(() => {
            isInteractingWithKeyboard.current = false;
          }, 0);
        }}
        onTouchStart={() => {
          isInteractingWithKeyboard.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isInteractingWithKeyboard.current = false;
          }, 0);
        }}
      >
        {focusedField === "email" && (
          <div className={styles.emailShortcutRow}>
            {emailSuffixes.map((suffix) => (
              <button
                key={suffix}
                type="button"
                className={styles.emailShortcutButton}
                onClick={() => applyEmailSuffix(suffix)}
              >
                {suffix}
              </button>
            ))}
          </div>
        )}

        <Keyboard
          key={`${showKeyboard}-${focusedField}-${keyboardLayoutName}`}
          keyboardRef={(r) => {
            keyboardRef.current = r;
          }}
          layoutName={keyboardLayoutName}
          layout={keyboardLayout}
          inputName={focusedField}
          syncInstanceInputs={false}
          onChange={handleKeyboardChange}
          onKeyPress={handleKeyboardKeyPress}
          display={{
            "{bksp}": "⌫",
            "{enter}": "Done",
            "{shift}": "Shift",
            "{space}": "Space",
          }}
        />
      </div>
    </div>
  );
};

  return (
    <div className={styles.pageBackground}>
      {step === 1 && (
        <div className={styles.container}>
          <h1>Enter Email</h1>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <form
            onSubmit={handleEmailSubmit}
            autoComplete="off"
            className={styles.formWithKeyboard}
          >
            <input
              type="email"
              value={email}
              name="guest_email_kiosk"
              className={styles.input}
              placeholder="johndoe@example.com"
              onChange={handleEmailChange}
              onFocus={() => handleInputFocus("email")}
              onBlur={handleInputBlur}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-form-type="other"
              inputMode="email"
              required
            />

            <button type="submit" className={styles.button} disabled={loading}>
              Next
            </button>

            {renderSharedKeyboard()}
          </form>
        </div>
      )}

      {step === 2 && isEmailFound && (
        <div className={styles.container}>
          <h2>Select a Player to Assign a Wristband</h2>
          <ul>
            {players.map((player) => {
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
                    {isValid ? "Active" : "Select"}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => handleSigningOption("existingWaiverAddKids")}
            className={styles.button}
          >
            Add New Waiver
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.button}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}

      {step === 2 && !isEmailFound && (
        <div className={styles.container}>
          <h2>Who would you like to sign a waiver for?</h2>
          <button
            onClick={() => handleSigningOption("self")}
            className={styles.button}
          >
            Myself
          </button>
          <button
            onClick={() => handleSigningOption("selfAndKids")}
            className={styles.button}
          >
            Myself and Kids
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.button}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}

      {step === 3 && signingFor === "self" && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form
            onSubmit={handleNewInfoSubmit}
            className={styles.formWithKeyboard}
          >
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>
                First Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) =>
                  setForm({ ...form, FirstName: e.target.value })
                }
                onFocus={() => handleInputFocus("firstName")}
                onBlur={handleInputBlur}
                className={styles.formRowInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>
                Last Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                onFocus={() => handleInputFocus("lastName")}
                onBlur={handleInputBlur}
                className={styles.formRowInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.button} disabled={loading}>
                Next
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.button}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            {renderSharedKeyboard()}
          </form>
        </div>
      )}

      {step === 3 && signingFor === "selfAndKids" && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form
            onSubmit={handleNewInfoSubmit}
            className={styles.formWithKeyboard}
          >
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>
                First Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) =>
                  setForm({ ...form, FirstName: e.target.value })
                }
                onFocus={() => handleInputFocus("firstName")}
                onBlur={handleInputBlur}
                className={styles.formRowInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formRowLabel}>
                Last Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                onFocus={() => handleInputFocus("lastName")}
                onBlur={handleInputBlur}
                className={styles.formRowInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
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
                  <label className={styles.formRowLabel}>
                    First Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) =>
                      handleKidChange(index, "FirstName", e.target.value)
                    }
                    onFocus={() => handleInputFocus(`kid-${index}-FirstName`)}
                    onBlur={handleInputBlur}
                    className={styles.formRowInput}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>
                    Last Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.LastName}
                    onChange={(e) =>
                      handleKidChange(index, "LastName", e.target.value)
                    }
                    onFocus={() => handleInputFocus(`kid-${index}-LastName`)}
                    onBlur={handleInputBlur}
                    className={styles.formRowInput}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddKid}
              className={styles.button}
            >
              New Child
            </button>
            <div className={styles.formActions}>
              <button type="submit" className={styles.button} disabled={loading}>
                Next
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.button}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {renderSharedKeyboard()}
          </form>
        </div>
      )}

      {step === 3 && signingFor === "existingWaiverAddKids" && (
        <div className={styles.container}>
          <form
            onSubmit={handleNewInfoSubmit}
            className={styles.formWithKeyboard}
          >
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
                  <label className={styles.formRowLabel}>
                    First Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) =>
                      handleKidChange(index, "FirstName", e.target.value)
                    }
                    onFocus={() => handleInputFocus(`kid-${index}-FirstName`)}
                    onBlur={handleInputBlur}
                    className={styles.formRowInput}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formRowLabel}>
                    Last Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.LastName}
                    onChange={(e) =>
                      handleKidChange(index, "LastName", e.target.value)
                    }
                    onFocus={() => handleInputFocus(`kid-${index}-LastName`)}
                    onBlur={handleInputBlur}
                    className={styles.formRowInput}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddKid}
              className={styles.button}
            >
              New Child
            </button>
            <div className={styles.formActions}>
              <button type="submit" className={styles.button} disabled={loading}>
                Next
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.button}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {renderSharedKeyboard()}
          </form>
        </div>
      )}

      {step === 4 && (
        <div className={styles.container}>
          <h2>
            RELEASE OF LIABILITY, WAIVER OF CLAIMS AND AGREEMENT NOT TO SUE
          </h2>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I CONFIRM THAT I HAVE READ AND UNDERSTAND THE PIXELPULSE
                SAFETY RULES, GAME INSTRUCTIONS, AND FACILITY POLICIES. FOR ANY
                INDIVIDUAL THAT I AM THE PARENT OR LEGAL GUARDIAN OF AND FOR
                WHOM I HAVE COMPLETED A WAIVER, I CONFIRM THAT I HAVE EXPLAINED
                THE SAFETY RULES, GAME INSTRUCTIONS, FACILITY POLICIES, AND
                POTENTIAL RISKS OF PARTICIPATION TO THEM.
              </p>
              <input
                type="checkbox"
                id="safetyRules"
                name="safetyRules"
                checked={waiverForm.safetyRules}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I ACKNOWLEDGE THAT PIXELPULSE GAME ROOMS MAY INCLUDE SPECIAL
                EFFECTS SUCH AS FLASHING LIGHTS, STROBE LIGHTING, LASERS, BRIGHT
                LED DISPLAYS, RAPID LIGHT CHANGES, LOUD MUSIC OR SOUND EFFECTS,
                AND THEATRICAL HAZE OR FOG EFFECTS. THESE EFFECTS MAY CAUSE
                DISCOMFORT OR MAY TRIGGER OR WORSEN MEDICAL CONDITIONS INCLUDING
                BUT NOT LIMITED TO PHOTOSENSITIVE EPILEPSY, SEIZURE DISORDERS,
                ASTHMA, RESPIRATORY CONDITIONS, MIGRAINES, ANXIETY, VERTIGO, OR
                OTHER CONDITIONS. I CONFIRM THAT I AND/OR MY CHILD(REN)/WARD DO
                NOT HAVE ANY MEDICAL CONDITION THAT WOULD MAKE PARTICIPATION
                UNSAFE, OR THAT I AM VOLUNTARILY CHOOSING TO PARTICIPATE AND
                ASSUME ALL RISKS ASSOCIATED WITH SUCH PARTICIPATION.
              </p>
              <input
                type="checkbox"
                id="specialEffects"
                name="specialEffects"
                checked={waiverForm.specialEffects}
                onChange={handleWaiverCheckboxChange}
                className={styles.checkbox}
              />
            </label>
          </div>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                BY COMPLETING THIS CONTRACT, I UNDERSTAND THAT I AM GIVING UP
                IMPORTANT LEGAL RIGHTS, INCLUDING THE RIGHT OF MYSELF AND MY
                CHILD(REN)/WARD TO SUE OR CLAIM COMPENSATION FOLLOWING AN
                ACCIDENT, INCIDENT, INJURY, LOSS, OR DAMAGE, HOWEVER CAUSED,
                INCLUDING WHERE CAUSED OR CONTRIBUTED TO BY NEGLIGENCE TO THE
                FULLEST EXTENT PERMITTED BY LAW.
              </p>
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
                <br />I acknowledge on behalf of myself and/or my child(ren)/ward
                that participation in PIXELPULSE VAUGHAN activities involves
                known and unknown, anticipated and unanticipated risks that
                could result in physical or emotional injury, illness,
                paralysis, permanent disability, death, or damage to me and/or
                my child(ren)/ward, to other people, and/or to property.
                <br />
                Participants may run, stop suddenly, jump, crouch, crawl, dodge,
                reach, stretch, balance, climb stairs, open or pass through
                doors, move through dark or confined areas, interact with walls,
                floors, targets, sensors, props, buttons, beams, obstacles, and
                other participants. These activities may result in slips, trips,
                falls, collisions, overexertion, strains, sprains, bruises,
                broken bones, cuts, head injuries, or other serious injuries.
                <br />
                Participation may also involve exposure to flashing lights, loud
                noises, fog or haze, physical exertion, stress, crowding,
                competitive gameplay, equipment malfunction, human error, and
                the acts or omissions of other participants or staff.
                <br />I understand that staff seek to promote safety, but they
                are not infallible. Staff may misjudge a participant's
                condition, abilities, or actions; they may provide incomplete
                warnings or instructions; and equipment, game systems, doors,
                sensors, props, lights, lasers, or other facility elements may
                fail or malfunction.
                <br />I further understand that if I or my child(ren)/ward
                become injured or require medical treatment, transportation, or
                emergency services, any resulting cost may be my responsibility.
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
                I AM ASSUMING ON BEHALF OF MYSELF AND/OR MY CHILD(REN)/WARD ALL
                RISK OF PERSONAL INJURY, DEATH, DISABILITY, ILLNESS, PROPERTY
                DAMAGE, OR LOSS THAT MAY RESULT FROM PARTICIPATION IN PIXELPULSE
                ACTIVITIES, HOWEVER CAUSED, INCLUDING INJURY, LOSS, OR DAMAGE
                ARISING FROM THE NEGLIGENCE OR FAULT OF PIXELPULSE VAUGHAN, ITS
                OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, STAFF, CONTRACTORS,
                AGENTS, VOLUNTEERS, AFFILIATES, LANDLORDS, EQUIPMENT SUPPLIERS,
                OR OTHER PARTICIPANTS, TO THE FULLEST EXTENT PERMITTED BY LAW.
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
                I HAVE READ THIS AGREEMENT AND AGREE TO ASSUME ON BEHALF OF
                MYSELF AND/OR MY CHILD(REN)/WARD ALL RISKS OF PARTICIPATION,
                WHETHER KNOWN OR UNKNOWN, AND I AGREE TO GIVE UP THE RIGHT TO
                SUE OR CLAIM COMPENSATION ON BEHALF OF MYSELF AND/OR MY
                CHILD(REN)/WARD TO THE FULLEST EXTENT PERMITTED BY LAW.
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
                I ACKNOWLEDGE THAT I HAVE READ THESE RULES AND THIS RELEASE OF
                LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISKS, AND INDEMNITY
                AGREEMENT, AND, WHERE APPLICABLE, I CERTIFY THAT I HAVE
                EXPLAINED THEM TO MY CHILD(REN)/WARD LISTED IN THIS CONTRACT.
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
                I HAVE READ THIS AGREEMENT AND AGREE TO GIVE UP THE RIGHT TO
                SUE OR CLAIM COMPENSATION ON MY OWN BEHALF AND/OR ON BEHALF OF
                MY CHILD(REN)/WARD, TO THE FULLEST EXTENT PERMITTED BY LAW.
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
                I HAVE READ THE RELEASE AGREEMENT, UNDERSTAND IT, AND AGREE THAT
                I AND/OR MY CHILD(REN)/WARD ARE BOUND BY ITS TERMS. I UNDERSTAND
                THAT THIS AGREEMENT SHALL BE GOVERNED BY THE LAWS OF THE
                PROVINCE OF ONTARIO AND THE APPLICABLE LAWS OF CANADA.
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
            onBegin={hideKeyboard}
            onEnd={saveSignature}
          />
          <p className={styles.waiverLabel}>{error}</p>
          <div className={styles.signatureButtons}>
            <button
              type="button"
              onClick={clearSignature}
              className={styles.button}
              disabled={loading}
            >
              Clear Signature
            </button>
            <button
              type="button"
              onClick={handleWaiverAccept}
              className={styles.button}
              disabled={loading}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.button}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={styles.container}>
          <h1>Wristband Scanner</h1>
          {!nfcScanResult && scanningNFC && selectedWaiver && (
            <div className={styles.nfcResult}>
              <p>
                Hi {selectedWaiver.FirstName} {selectedWaiver.LastName}, Please
                scan your wristband...
              </p>
              <div className={styles.loader}>
                <div></div>
                <div></div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.button}
              >
                Cancel
              </button>
            </div>
          )}

          {nfcScanResult && !scanningNFC && (
            <div className={styles.nfcResult}>
              <p>Scanned Successfully!</p>
              <button onClick={confirmNFCScan} className={styles.button}>
                I&apos;m done
              </button>
              <button
                type="button"
                onClick={scanAnother}
                className={styles.button}
                disabled={loading}
              >
                Scan Another
              </button>
            </div>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}

      {step === 6 && (
        <div className={styles.container}>
          <h1>Thank You!</h1>
          {selectedWaiver ? (
            <p>Thank you for returning. Have a great time!</p>
          ) : (
            <p>
              Your registration and waiver has been successfully submitted. Have
              a great time!
            </p>
          )}
          <button
            type="button"
            onClick={() => (window.location.href = "/registration")}
            className={styles.button}
            disabled={loading}
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default Players;
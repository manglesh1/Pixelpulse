import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import styles from "../../styles/Players.module.css";
import {
  fetchPlayersByEmail,
  getRequirePlayer,
  validatePlayer,
  findOrCreatePlayer,
  findOrCreateChildPlayer,
} from "../../services/api";

const Players = () => {
  const [requireWaiver, setRequireWaiver] = useState(false);
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

  const sigCanvas = useRef();

  useEffect(() => {
    window.receiveMessageFromWPF = (message) => {
      console.log("Received message from WPF:", message);
      setLoading(false);
      setScanningNFC(false);
      setNfcScanResult(message);

      if (typeof window !== "undefined" && window.stopScan) {
        window.stopScan();
      }
    };

    window.startScan = (playerId) => {
      if (window.chrome?.webview?.postMessage) {
        window.chrome.webview.postMessage({
          type: "ScanCard",
          playerId,
        });
        return;
      }

      console.warn("WPF host bridge not available for startScan");
    };

    window.stopScan = () => {
      if (window.chrome?.webview?.postMessage) {
        window.chrome.webview.postMessage({
          type: "StopScan",
        });
        return;
      }

      console.warn("WPF host bridge not available for stopScan");
    };

    return () => {
      delete window.receiveMessageFromWPF;
      delete window.startScan;
      delete window.stopScan;
    };
  }, []);

  useEffect(() => {
    const fetchRequireWaiver = async () => {
      try {
        const res = await getRequirePlayer();
        setRequireWaiver(res);
      } catch (err) {
        console.error("Failed to fetch RequireWaiver setting", err);
      }
    };

    fetchRequireWaiver();
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

    const signature =
      requireWaiver && sigCanvas.current ? sigCanvas.current.toDataURL() : "";

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
        Signature: requireWaiver ? parentPlayer.Signature || "" : "",
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

    if (signingFor === "existingWaiverAddKids") {
      await createPlayers();
      setNewKidsForms([]);
      setStep(2);
      return;
    }

    if (!requireWaiver) {
      const player = await createPlayers();
      if (player) startScanForPlayer(player);
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
  };

  const handleCancel = () => {
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

  return (
    <div className={styles.pageBackground}>
      {step === 1 && (
        <div className={styles.container}>
          <h1>Enter Email</h1>
          {error && <p style={{ color: "red" }}>{error}</p>}
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
            <button type="submit" className={styles.button} disabled={loading}>
              Next
            </button>
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
          <form onSubmit={handleNewInfoSubmit}>
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
                className={styles.formRowInput}
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
                className={styles.formRowInput}
                required
              />
            </div>
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
          </form>
        </div>
      )}

      {step === 3 && signingFor === "selfAndKids" && (
        <div className={styles.container}>
          <h1>Enter Your Information</h1>
          <form onSubmit={handleNewInfoSubmit}>
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
                className={styles.formRowInput}
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
                  <label className={styles.formRowLabel}>
                    First Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) =>
                      handleKidChange(index, "FirstName", e.target.value)
                    }
                    className={styles.formRowInput}
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
                    className={styles.formRowInput}
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
          </form>
        </div>
      )}

      {step === 3 && signingFor === "existingWaiverAddKids" && (
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
                  <label className={styles.formRowLabel}>
                    First Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={kid.FirstName}
                    onChange={(e) =>
                      handleKidChange(index, "FirstName", e.target.value)
                    }
                    className={styles.formRowInput}
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
                    className={styles.formRowInput}
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
          </form>
        </div>
      )}

      {requireWaiver && step === 4 && (
        <div className={styles.container}>
          <h2>
            RELEASE OF LIABILITY, WAIVER OF CLAIMS AND AGREEMENT NOT TO SUE
          </h2>

          <div className={styles.waiverText}>
            <label className={styles.waiverLabel}>
              <p>
                I CONFIRM THAT I HAVE READ AND UNDERSTAND THE PIXELPULSE
                SAFETY RULES, GAME INSTRUCTIONS, AND FACILITY POLICIES. FOR
                ANY INDIVIDUAL THAT I AM THE PARENT OR LEGAL GUARDIAN OF AND
                FOR WHOM I HAVE COMPLETED A WAIVER, I CONFIRM THAT I HAVE
                EXPLAINED THE SAFETY RULES, GAME INSTRUCTIONS, FACILITY
                POLICIES, AND POTENTIAL RISKS OF PARTICIPATION TO THEM.
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
                EFFECTS SUCH AS FLASHING LIGHTS, STROBE LIGHTING, LASERS,
                BRIGHT LED DISPLAYS, RAPID LIGHT CHANGES, LOUD MUSIC OR SOUND
                EFFECTS, AND THEATRICAL HAZE OR FOG EFFECTS. THESE EFFECTS MAY
                CAUSE DISCOMFORT OR MAY TRIGGER OR WORSEN MEDICAL CONDITIONS
                INCLUDING BUT NOT LIMITED TO PHOTOSENSITIVE EPILEPSY, SEIZURE
                DISORDERS, ASTHMA, RESPIRATORY CONDITIONS, MIGRAINES, ANXIETY,
                VERTIGO, OR OTHER CONDITIONS. I CONFIRM THAT I AND/OR MY
                CHILD(REN)/WARD DO NOT HAVE ANY MEDICAL CONDITION THAT WOULD
                MAKE PARTICIPATION UNSAFE, OR THAT I AM VOLUNTARILY CHOOSING
                TO PARTICIPATE AND ASSUME ALL RISKS ASSOCIATED WITH SUCH
                PARTICIPATION.
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
                <br />
                I acknowledge on behalf of myself and/or my child(ren)/ward
                that participation in PIXELPULSE VAUGHAN activities involves
                known and unknown, anticipated and unanticipated risks that
                could result in physical or emotional injury, illness,
                paralysis, permanent disability, death, or damage to me and/or
                my child(ren)/ward, to other people, and/or to property.
                <br />
                Participants may run, stop suddenly, jump, crouch, crawl,
                dodge, reach, stretch, balance, climb stairs, open or pass
                through doors, move through dark or confined areas, interact
                with walls, floors, targets, sensors, props, buttons, beams,
                obstacles, and other participants. These activities may result
                in slips, trips, falls, collisions, overexertion, strains,
                sprains, bruises, broken bones, cuts, head injuries, or other
                serious injuries.
                <br />
                Participation may also involve exposure to flashing lights,
                loud noises, fog or haze, physical exertion, stress, crowding,
                competitive gameplay, equipment malfunction, human error, and
                the acts or omissions of other participants or staff.
                <br />
                I understand that staff seek to promote safety, but they are
                not infallible. Staff may misjudge a participant's condition,
                abilities, or actions; they may provide incomplete warnings or
                instructions; and equipment, game systems, doors, sensors,
                props, lights, lasers, or other facility elements may fail or
                malfunction.
                <br />
                I further understand that if I or my child(ren)/ward become
                injured or require medical treatment, transportation, or
                emergency services, any resulting cost may be my
                responsibility.
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
                I AM ASSUMING ON BEHALF OF MYSELF AND/OR MY CHILD(REN)/WARD
                ALL RISK OF PERSONAL INJURY, DEATH, DISABILITY, ILLNESS,
                PROPERTY DAMAGE, OR LOSS THAT MAY RESULT FROM PARTICIPATION IN
                PIXELPULSE ACTIVITIES, HOWEVER CAUSED, INCLUDING INJURY, LOSS,
                OR DAMAGE ARISING FROM THE NEGLIGENCE OR FAULT OF PIXELPULSE
                VAUGHAN, ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, STAFF,
                CONTRACTORS, AGENTS, VOLUNTEERS, AFFILIATES, LANDLORDS,
                EQUIPMENT SUPPLIERS, OR OTHER PARTICIPANTS, TO THE FULLEST
                EXTENT PERMITTED BY LAW.
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
                LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISKS, AND
                INDEMNITY AGREEMENT, AND, WHERE APPLICABLE, I CERTIFY THAT I
                HAVE EXPLAINED THEM TO MY CHILD(REN)/WARD LISTED IN THIS
                CONTRACT.
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
                I HAVE READ THE RELEASE AGREEMENT, UNDERSTAND IT, AND AGREE
                THAT I AND/OR MY CHILD(REN)/WARD ARE BOUND BY ITS TERMS. I
                UNDERSTAND THAT THIS AGREEMENT SHALL BE GOVERNED BY THE LAWS
                OF THE PROVINCE OF ONTARIO AND THE APPLICABLE LAWS OF CANADA.
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
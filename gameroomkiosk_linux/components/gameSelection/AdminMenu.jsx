const wrapper = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.65)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
};

const box = {
  background: "#111",
  padding: "30px",
  borderRadius: "12px",
  width: "450px",
  color: "white",
  textAlign: "center",
};

const btn = {
  width: "100%",
  padding: "12px",
  margin: "6px 0",
  fontSize: "18px",
  borderRadius: "6px",
  background: "#222",
  color: "#fff",
  border: "1px solid #555",
  cursor: "pointer",
};

const closeBtn = {
  ...btn,
  background: "#444",
  marginTop: "15px",
};

import {
  restartPc,
  restartApp,
  logout,
  updateSystem,
  closeApp,
  turnDoorOn,
  turnDoorOff,
  rescanControllers,
  testScanner,
  enterMaintenance,
  exitMaintenance,
} from "../../services/adminApi";

export default function AdminMenu({ onClose }) {
  return (
    <div style={wrapper}>
      <div style={box}>
        <h2 style={{ marginBottom: "20px" }}>Admin Menu</h2>

        <button style={btn} onClick={restartPc}>
          Restart PC
        </button>
        <button style={btn} onClick={restartApp}>
          Restart App
        </button>
        <button style={btn} onClick={testScanner}>
          Simulate Scan
        </button>
        <button style={btn} onClick={logout}>
          Logout Session
        </button>
        <button style={btn} onClick={updateSystem}>
          Update System
        </button>

        <hr style={{ margin: "20px 0" }} />

        <button style={btn} onClick={enterMaintenance}>
          Enter Maintenance Mode
        </button>
        <button style={btn} onClick={exitMaintenance}>
          Exit Maintenance Mode
        </button>

        <button style={btn} onClick={closeApp}>
          Close Game Selection
        </button>

        <hr style={{ margin: "20px 0" }} />

        <button style={btn} onClick={turnDoorOn}>
          Door → ON
        </button>
        <button style={btn} onClick={turnDoorOff}>
          Door → OFF
        </button>
        <button style={btn} onClick={rescanControllers}>
          Rescan Controllers
        </button>

        <button style={closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

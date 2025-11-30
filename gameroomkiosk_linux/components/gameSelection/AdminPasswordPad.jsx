import React, { useState } from "react";

export default function AdminPasswordPad({ onSuccess, onCancel }) {
  const [input, setInput] = useState("");

  const handlePress = (digit) => {
    const next = input + digit;

    // Limit length to 6 digits
    if (next.length <= 6) {
      setInput(next);

      // If reached 6 digits, validate
      if (next.length === 6) {
        if (next === "767676") {
          onSuccess();
        } else {
          setInput("");
        }
      }
    }
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div style={wrapper}>
      <div style={box}>
        <h2 style={{ marginBottom: 20 }}>Admin Login</h2>

        <div style={inputBox}>{input.replace(/./g, "•")}</div>

        <div style={grid}>
          {keypad.map((n) => (
            <button key={n} style={btn} onClick={() => handlePress(n)}>
              {n}
            </button>
          ))}
        </div>

        <button style={cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

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
  width: 350,
  padding: 25,
  borderRadius: 12,
  background: "#111",
  color: "white",
  textAlign: "center",
};

const inputBox = {
  height: 40,
  marginBottom: 20,
  background: "#222",
  borderRadius: 8,
  fontSize: 24,
  letterSpacing: 8,
  paddingTop: 5,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
};

const btn = {
  padding: 18,
  fontSize: 22,
  background: "#333",
  borderRadius: 8,
  color: "white",
  border: "1px solid #555",
  cursor: "pointer",
};

const cancelBtn = {
  ...btn,
  width: "100%",
  background: "#444",
  marginTop: 20,
};

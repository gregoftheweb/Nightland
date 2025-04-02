// nightland/src/components/Dialog.js
import React, { useEffect } from "react";
import "../styles/styles.css";

const Dialog = ({ message, onClose, showCloseButton = true }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Default 5 seconds, we’ll override for drop dialog

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="game-dialog fade-out8">
      {showCloseButton && (
        <button
          className="dialog-close-button"
          onClick={onClose}
          style={{ position: "absolute", top: "5px", right: "5px" }}
        >
          X
        </button>
      )}
      <p>{message}</p>
    </div>
  );
};

export default Dialog;
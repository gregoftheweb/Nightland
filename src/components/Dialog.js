// nightland/src/components/Dialog.js
import React, { useEffect } from "react";
import "../styles/styles.css";

const Dialog = ({ children, onClose, showCloseButton = true, duration = 5000 }) => {
  useEffect(() => {
    if (children && duration !== null) { // Allow null duration for no auto-close
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [children, onClose, duration]);

  if (!children) return null;

  return (
    <div className="game-dialog fade-out8">
      {showCloseButton && (
        <button
          className="dialog-close-button"
          onClick={onClose}
          style={{ position: "absolute", top: "5px", right: "5px",  color: "#8b0000" }}
        >
          X
        </button>
      )}
      <div>{children}</div> 
    </div>
  );
};

export default Dialog;
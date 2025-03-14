// nightland/src/components/Dialog.js
import React, { useEffect } from "react";
import "../styles/styles.css";

const Dialog = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="game-dialog fade-out8">
      <p>{message}</p>
    </div>
  );
};

export default Dialog;
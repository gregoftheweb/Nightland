// components/SplashOverlay.js
import React from 'react';

const SplashOverlay = ({ imageSrc, text, onClose }) => (
  <div className="splash-overlay">
    <img src={imageSrc} alt="Splash" className="splash-image" />
    <div className="splash-text">{text}</div>
    <button className="splash-button" onClick={onClose}>
      Continue
    </button>
  </div>
);

export default SplashOverlay;

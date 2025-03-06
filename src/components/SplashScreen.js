// nightland/src/components/SplashScreen.js
import React from 'react';
import * as text from '../assets/copy/textcontent.js'; // Keep this if in src/, or move to public/ later

const SplashScreen = ({ onStart }) => (
    <div id="splash">
        <img src="/assets/images/splashscreen.png" alt="Splash Screen" />
        <button id="splash-button" onClick={onStart}>
            {text.splashScreenButtonText}
        </button>
    </div>
);

export default SplashScreen;
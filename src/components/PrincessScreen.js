// nightland/src/components/PrincessScreen.js
import React from 'react';
import * as text from '../assets/copy/textcontent.js'; // Keep this if in src/, or move to public/ later

const PrincessScreen = ({ onNext }) => (
    <div id="princess-screen">
        <img src="/assets/images/sadprincess.png" alt="Princess Screen" />
        <div id="dialog" className="princess-dialog">
            {text.princessScreenText}
        </div>
        <button id="princess-button" onClick={onNext}>
            {text.princessScreenButtonText}
        </button>
    </div>
);

export default PrincessScreen;
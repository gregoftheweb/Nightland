// nightland/src/components/InfoBox.js
import React from 'react';

const InfoBox = ({ object }) => (
    <div id="info-box" style={{ display: object ? 'block' : 'none' }}>
        {object && `${object.name}<br>${object.description}`}
    </div>
);

export default InfoBox;
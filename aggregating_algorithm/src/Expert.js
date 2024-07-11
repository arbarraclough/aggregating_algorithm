import React, { useState } from 'react';

const Expert = ({ prefix }) => {
    const [numZeros, setNumZeros] = useState(0);
    const [numOnes, setNumOnes] = useState(0);

    const toString = () => {
        return `Expert "${prefix}"  - (${numZeros}, ${numOnes})`;
    };

    const predict = () => {
        if (numZeros + numOnes === 0) {
            return 0;
        }
        return numOnes / (numZeros + numOnes);
    };

    return (
        <div>
            <p>{toString()}</p>
            <p>Prediction: {predict()}</p>
            <button onClick={() => setNumZeros(numZeros + 1)}>Increment Zeros</button>
            <button onClick={() => setNumOnes(numOnes + 1)}>Increment Ones</button>
        </div>
    );
};

export default Expert;
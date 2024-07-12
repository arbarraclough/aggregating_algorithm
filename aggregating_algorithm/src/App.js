import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { aggregatingAlgorithm, Expert, generateExperts, getAwakeExperts, getAwakeExpertsWithConstantlyAwakeExperts, castLearnerPredictions, castExpertsPredictions } from './utils';

const MAX_PREFIX_LENGTH = 3;
const TEST_SEQUENCE = "0110101000110100110110101011110000110011010111110011110110011010000011101111101111100111100110101011011101101110001010110100011000010110011000000000000000001000111101011010100010100001000000100001110001001010100101110101101100100110001000001110110011001101010110100111010100111011001111011001111010011111101101000110111010001111000000000001000100010000111100111100100100010001101100011101010001010101011001000001010000011010110000001010110011101011101010110100100001011001000001010100001101111111100010101111111001000011000011110101000001000011001000001001001001011011110111110100100111100100000110000100001100001100100100000110101101110100101110000100001010000011000010001111011001110011110000010111101100100100110100100100010000011111101111111110101010110010011000100001110000010011100110111011011111100011110111011110100011000000101010011000110010111100101011111001000110111101001110110011101011110101110000000100101111011100110001000101111100111100101001100000001001010100100000110110001101001110";
// const MAX_SEQUENCE_LENGTH = 15;


function App() {
    let [experts, setExperts] = useState([]);
    let [learnerPredictions, setLearnerPredictions] = useState([]);
    let [gammas, setGammas] = useState([]);
    let [omegas, setOmegas] = useState([]);
    let [cumulativeLearnerLoss, setCumulativeLearnerLoss] = useState([]);
    let [cumulativeExpertsLosses, setCumulativeExpertsLosses] = useState([]);
    let [sequence, setSequence] = useState('');
    
    /** Generate Experts on Component Mount */
    useEffect(() => {
        // const generatedExperts = generateExperts(MAX_PREFIX_LENGTH);
        let newExperts = generateExperts(MAX_PREFIX_LENGTH)
        setExperts(newExperts);
        const AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * Math.log(generateExperts.length);
    }, [])

    const handleUserInput = (e) => {
        const sequence = e.target.value;
        // if (/^[01]*$/.test(sequence) && sequence.length <= MAX_SEQUENCE_LENGTH) {
        if (/^[01]*$/.test(sequence)) {
            setSequence(sequence);
            setOmegas(omegas => [...omegas, sequence.slice(-1)]);
            updateExpert(sequence);
        }

        let expertsPredictions = [];
        for (let i = 0; i < experts.length; i++) {
            expertsPredictions.push(experts[i].predict());
        }
        console.log(expertsPredictions);

        setGammas(gammas => [...gammas, expertsPredictions])
        console.log(gammas)
    };

    const handleReset = () => {
        setSequence('');
        setLearnerPredictions([]);
        setGammas([]);
        setOmegas([]);
        setCumulativeLearnerLoss([]);
        setCumulativeExpertsLosses([])
        experts.map(expert => expert.reset())
    };

    const updateExpert = (sequence) => {
        experts.map(expert => {
            try {
                let lastBit = sequence.slice(-1);

                /** If the expert was previously awake, increment the relevant counter. */
                if (expert.awake) {
                    if (lastBit === '0') {
                        expert.numZeros += 1;
                    } else if (lastBit === '1') {
                        expert.numOnes += 1;
                    }
                }
                /** Check if the expert is currently awake. */
                if (sequence.slice(-expert.prefix.length) === expert.prefix) {
                    expert.awake = true;
                } else {
                    expert.awake = false;
                }
            } catch (e) {
                console.error(e);
            }
        })
    }

    return (
        <>
        <div>
            <h1 className='App-header'>Binary Sequence Input</h1>
            <div className='columns'>
                <div className='column'>
                    <input
                        type="text"
                        value={sequence}
                        onChange={handleUserInput}
                        placeholder="Binary Sequence"
                        className="input-box"
                        // maxLength={MAX_SEQUENCE_LENGTH}
                    />
                </div>
                <div className='column counter'>
                    <b>LENGTH:</b>{sequence.length}
                </div>
                {/* <p>{sequence.length} / {MAX_SEQUENCE_LENGTH}</p> */}
                <div className='column reset'>
                    <button onClick={handleReset}><img className="photo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Refresh_font_awesome.svg/512px-Refresh_font_awesome.svg.png?20130126205514" alt="Reset!" /></button>
                </div>
            </div>
            <div>
                <p style={{textAlign: 'center'}}><b>Learner's Prediction:</b> -{}</p>
            </div>
            <div>
                <table>
                    <thead>
                    <tr>
                        <th>Expert</th>
                        <th>Awake?</th>
                        <th>Prediction</th>
                    </tr>
                    </thead>
                    <tbody>
                        {experts.map((expert, index) => (
                            <tr>
                                <td>{expert.toString()}</td>
                                <td>{expert.awake ? "Yes" : "No"}</td>
                                <td>{expert.predict()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
};

export default App;
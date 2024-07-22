import React, { useEffect, useState } from 'react';
import './App.css';
import { aggregatingAlgorithm, generateExperts } from './utils';

const MAX_PREFIX_LENGTH = 3;


function App() {
    let [experts, setExperts] = useState([]);
    let [learnerPrediction, setLearnerPrediction] = useState(0);
    let [learnerPredictions, setLearnerPredictions] = useState([]);
    let [gammas, setGammas] = useState([]);
    let [omegas, setOmegas] = useState([]);
    let [cumulativeLearnerLoss, setCumulativeLearnerLoss] = useState([]);
    let [cumulativeExpertsLosses, setCumulativeExpertsLosses] = useState([]);
    let [sequence, setSequence] = useState('');
    let [sequences, setSequences] = useState([]);
    
    /** Generate Experts on Component Mount */
    useEffect(() => {
        let newExperts = generateExperts(MAX_PREFIX_LENGTH)
        setExperts(newExperts);
        const AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * Math.log(generateExperts.length);
    }, [])

    const handleUserInput = (e) => {
        let sequence = e.target.value;
        // Check that the sequence is binary.
        if (/^[01]*$/.test(sequence)) {
            setSequence(sequence);
            setOmegas(omegas => [...omegas, sequence.slice(-1)]);
            updateExpert(sequence);
        }

        if (sequence.length === 10) {
            setSequences(sequences => [...sequences, sequence])
            setSequence('');
            e.target.value = '';
            console.log(sequences)
        }

        let expertsPredictions = [];
        for (let i = 0; i < experts.length; i++) {
            expertsPredictions.push(experts[i].predict());
        }

        let updatedGammas = [...gammas, expertsPredictions]
        setGammas(updatedGammas)

        let learnerPrediction = aggregatingAlgorithm(updatedGammas, omegas)
        setLearnerPrediction(learnerPrediction[1].slice(-1)[0].toFixed(4));
    };

    const handleSequencesUpdate = () => {

    };

    const handleReset = () => {
        setSequence('');
        setSequences([]);
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
            <h1 className='App-header header'>Aggregating Algorithm for Specialist Experts (AASE)</h1>
            <h2 className='header'>Binary Sequence Input</h2>
            <div className='columns'>
                <div className='column'>
                    <input
                        type="text"
                        value={sequence}
                        onChange={handleUserInput}
                        placeholder="Binary Sequence"
                        className="input-box"
                    />
                </div>
                <div className='column counter'>
                    <b>LENGTH:</b>{sequence.length}
                </div>
                <div className='column reset'>
                    <button onClick={handleReset}><img className="photo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Refresh_font_awesome.svg/512px-Refresh_font_awesome.svg.png?20130126205514" alt="Reset!" /></button>
                </div>
            </div>
            <p style={{textAlign: 'center'}}><b>Learner's Prediction:</b> {learnerPrediction} ({Math.round(learnerPrediction)})</p>
            <div className='sequences'>
                <p><b>Predicted:</b></p>
                <p><b>Actual:</b></p>
            </div>
            <hr/>
            <h2 className='header'>Previous Sequences & Predictions</h2>
            <ul>
                {[...sequences].reverse().map((sequence, index) => (
                    <li key={index}>Sequence #{sequences.length - index}: {sequence}</li>
                ))}
            </ul>
            <hr/>
            <h2 className='header'>Aggregating Algorithm</h2>
            <hr/>
            <h2 className='header'>Experts' Predictions</h2>
            <div>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <h3>Show Experts' Predictions?</h3>
                    <label class='switch'>
                        <input type='checkbox' />
                        <span class='slider round'></span>
                    </label>
                </div>
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
                            <tr key={index}>
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
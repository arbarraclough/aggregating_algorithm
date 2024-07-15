import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { aggregatingAlgorithm, Expert, generateExperts, getAwakeExperts, getAwakeExpertsWithConstantlyAwakeExperts, castLearnerPredictions, castExpertsPredictions } from './utils';

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
        // console.log("-- Experts' Predictions --")
        // console.log(expertsPredictions);

        // console.log("-- Omegas -- ")
        // console.log(omegas)

        let updatedGammas = [...gammas, expertsPredictions]
        setGammas(updatedGammas)
        // console.log("-- Gammas --")
        // console.log(gammas)

        let learnerPrediction = aggregatingAlgorithm(updatedGammas, omegas)
        setLearnerPrediction(learnerPrediction[1].slice(-1)[0].toFixed(4));
        // console.log("-- Leaner's Prediction --")
        // console.log(learnerPrediction[1].slice(-1)[0].toFixed(4))
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
                    />
                </div>
                <div className='column counter'>
                    <b>LENGTH:</b>{sequence.length}
                </div>
                <div className='column reset'>
                    <button onClick={handleReset}><img className="photo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Refresh_font_awesome.svg/512px-Refresh_font_awesome.svg.png?20130126205514" alt="Reset!" /></button>
                </div>
            </div>
            <div>
                <p style={{textAlign: 'center'}}><b>Learner's Prediction:</b> {learnerPrediction} ({Math.round(learnerPrediction)})</p>
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
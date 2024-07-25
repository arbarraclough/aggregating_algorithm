import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import './App.css';
import { aggregatingAlgorithm, generateExperts } from './utils';
import { BitTile } from './components/BitTile';

const MAX_PREFIX_LENGTH = 5;
const MAX_SEQUENCES_COUNT = 25;
const FIRST_PREDICTION = Math.random().toFixed(3);

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '75%',
        padding: '20px',
        textAlign: 'center',
        zIndex: '9999'
    }
};

function App() {
    let [experts, setExperts] = useState([]);
    let [rawPrediction, setRawPrediction] = useState(FIRST_PREDICTION);
    let [gammas, setGammas] = useState([]);
    let [omegas, setOmegas] = useState([]);
    let [sequence, setSequence] = useState('');
    let [sequences, setSequences] = useState([]);
    let [predictedSequence, setPredictedSequence] = useState([Math.round(FIRST_PREDICTION)])
    let [predictedSequences, setPredictedSequences] = useState([])
    let [showExpertsPredictions, setShowExpertsPredictions] = useState(true)
    let [finalResults, setFinalResults] = useState({})
    let [isModalOpen, setIsModalOpen] = useState(true);

    /** Generate Experts on Component Mount */
    useEffect(() => {
        let newExperts = generateExperts(MAX_PREFIX_LENGTH)
        setExperts(newExperts);
    }, [])

    /** Logic for Binary Sequence Input */
    const handleUserInput = (e) => {
        let sequence = e.target.value;

        if (sequences.length >= MAX_SEQUENCES_COUNT) {
            return;
        }

        // Check Input is Binary
        if (/^[01]*$/.test(sequence)) {
            setSequence(sequence);
            // Record Outcomes (Omegas)
            setOmegas(omegas => [...omegas, sequence.slice(-1)]);
            updateExpert(sequence);
        }

        // Reset Input and Predicted Sequence Once Sequence is 10-bits
        if (sequence.length === 10) {
            setSequences(sequences => [...sequences, sequence])
            setPredictedSequences(predictedSequences => [...predictedSequences, predictedSequence])
            setSequence('');
            setPredictedSequence('');
            e.target.value = '';
        }

        // Record Experts' Predictions (Gammas)
        let expertsPredictions = [];
        for (let i = 0; i < experts.length; i++) {
            expertsPredictions.push(experts[i].predict());
        }
        let updatedGammas = [...gammas, expertsPredictions]
        setGammas(updatedGammas)

        // Get Results from Aggregating Algorithm
        let results = aggregatingAlgorithm(updatedGammas, omegas)
        if (sequences.length === MAX_SEQUENCES_COUNT - 1 && sequence.length === 9) {
            setFinalResults(results)
        }
        let rawPrediction = results.learnerPredictions.slice(-1)[0].toFixed(3);

        setRawPrediction(rawPrediction);
        setPredictedSequence(predictedSequence => [...predictedSequence, Math.round(rawPrediction)]);
    };

    /** Prevent Default Backspace Behaviour */
    const handleKeyDown = (e) => {
        if (e.key !== '0' && e.key !== '1') {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /** Reset Program on Button Press */
    const handleReset = () => {
        setSequence('');
        setSequences([]);
        setGammas([]);
        setOmegas([]);
        experts.forEach(expert => expert.reset())
    };

    const handleDownload = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalResults));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "finalResults.json");
        document.body.appendChild(downloadAnchorNode); // required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleToggleChange = (e) => {
        setShowExpertsPredictions(e.target.checked);
    };

    /** Logic for Updating Experts */
    const updateExpert = (sequence) => {
        experts.map(expert => {
            try {
                let lastBit = sequence.slice(-1);

                // Increment Relevant Counter if Expert was Previously Awake
                if (expert.awake) {
                    if (lastBit === '0') {
                        expert.numZeros += 1;
                    } else if (lastBit === '1') {
                        expert.numOnes += 1;
                    }
                }

                // Check if Expert is Currently Awake
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
        <h1 className='heading'>Aggregating Algorithm for Specialist Experts (AASE)</h1>
            <p className='heading'><b><u>Instructions:</u></b></p>
            <ul style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <li>Type each 10-item sequence one by one. The sequence will stay on screen until completed and will be cleared before typing the next one.</li>
                <li>Work at your own pace, but try to avoid any predictable patterns and ensure your sequences are as random as possible.</li>
                <li>Backspace is disabled, so consider your input carefully before pressing the key.</li>
                <li>The application will attempt to predict your next input based on your previous sequences.</li>
                <li>You can reset the application at any time using the Reset Button on screen.</li>
                <li>After completing all of the sequences, please download and email the results to <i>Andrew.Barraclough.2018@live.rhul.ac.uk</i>.</li>
            </ul>
        <div className='row'>
            <div className='column'>
                <input
                    type="text"
                    value={sequence}
                    onChange={handleUserInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Binary Sequence"
                    disabled={sequences.length >= MAX_SEQUENCES_COUNT}
                />
            </div>
            <div className='column counter'>
                <b><u>Length</u></b>{sequence.length} / 10
            </div>
            <div className='column counter'>
                <b><u>Sequences</u></b>{sequences.length} / {MAX_SEQUENCES_COUNT}
            </div>
            <div className='column reset'>
                <button onClick={handleReset}><img className="photo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Refresh_font_awesome.svg/512px-Refresh_font_awesome.svg.png?20130126205514" alt="Reset!" /></button>
            </div>
        </div>


        <div>
            {sequences.length != MAX_SEQUENCES_COUNT && <div>
                <div className='learner-prediction'>
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Raw Prediction</th>
                                <th>Casted Prediction</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>Learner's Prediction</b></td>
                                <td>{rawPrediction}</td>
                                <td>{Math.round(rawPrediction)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className='sequences'>
                    <table>
                        <tbody>
                            <tr>
                                <td className='sequence-label'><b>Predicted:</b></td>
                                <td className='sequence-bits'>
                                    {predictedSequence.map((bit, index) => (
                                        <BitTile key={`predicted-${index}`} bit={bit} />
                                    ))}
                                </td>
                            </tr>
                            <tr>
                                <td className='sequence-label'><b>Actual:</b></td>
                                <td className='sequence-bits'>
                                    {sequence.split('').map((bit, index) =>(
                                        <BitTile key={`actual-${index}`} bit={bit} />
                                    ))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <hr/>
            </div>}

            {sequences.length === MAX_SEQUENCES_COUNT && (
                <div className='results-container'>
                    <div className='heading'>
                        <h2>Download Results:</h2>
                    </div>
                    <button className='download-button' onClick={handleDownload}>
                        <img
                            className="download-icon"
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Download_alt_font_awesome.svg/640px-Download_alt_font_awesome.svg.png"
                            alt="Download!"
                        />
                        Download
                    </button>
                    <div className='email-instructions'>
                        <p><i>Please download the results and email the file to <a href="mailto:Andrew.Barraclough.2018@live.rhul.ac.uk">Andrew.Barraclough.2018@live.rhul.ac.uk</a>.</i></p>
                    </div>
                </div>
            )}

            {/* Only Show After the First 10-bit Sequence */}
            {sequences.length > 0 && <div>
                <div className='past-sequences'>
                    <h2 className='heading'>Past Sequences</h2>
                    <div className='scrollable'>
                        <table>
                            <tbody>
                                {sequences.map((_, index) => (
                                    <React.Fragment key={index}>
                                        <tr>
                                            <td rowSpan='2'><b>Sequence #{sequences.length - index}</b></td>
                                            <td><b>Predicted:</b></td>
                                            <td>
                                                {predictedSequences[sequences.length - index - 1].map((bit, idx) => (
                                                    <BitTile key={`predicted-${index}-${idx}`} bit={bit} />
                                                ))}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>Actual:</b></td>
                                            <td>
                                                {sequences[sequences.length - index - 1].split('').map((bit, index) =>(
                                                    <BitTile key={`actual-${index}`} bit={bit} />
                                                ))}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <hr/>
            </div>}
            
            <div className='experts-predictions'>
                <h2 className='heading'>Experts' Predictions</h2>
                
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <h3>Show Experts' Predictions?</h3>
                    <label className='switch'>
                        <input
                            type='checkbox'
                            checked={showExpertsPredictions}
                            onChange={handleToggleChange}
                        />
                        <span className='slider round'></span>
                    </label>
                </div>
                
                <div className='scrollable'>
                    <table>
                        <thead>
                            <tr>
                                <th style={{backgroundColor:'#e0e0e0'}}>Experts</th>
                                <th style={{backgroundColor:'#e0e0e0'}}># '0'</th>
                                <th style={{backgroundColor:'#e0e0e0'}}># '1' </th>
                                <th style={{backgroundColor:'#e0e0e0'}}>Awake?</th>
                                <th style={{backgroundColor:'#e0e0e0'}}>Prediction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {experts.map((expert, index) => (
                                <tr key={index}>
                                    <td>{expert.toString()}</td>
                                    <td>{showExpertsPredictions ? expert.numZeros : "❓"}</td>
                                    <td>{showExpertsPredictions ? expert.numOnes : "❓"}</td>
                                    <td>{showExpertsPredictions ? expert.awake ? "✅" : "❌" : "❓"}</td>
                                    <td>{showExpertsPredictions ? expert.predict() : "❓"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Modal Component */}
        <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            style={customStyles}
            contentLabel="Instructions Modal"
        >
            <h2><u>Aggregating Algorithm for Specialist Experts</u></h2>
            <p><b>Thank you for participating in this experiment, I appreciate your time and this project wouldn't be possible without you.</b></p>
            
            <p>Your task is to create a table of sequences each consisting of 10 items, either 0 or 1.</p>
            <p>Imagine this table represents the results of a number of people, each tossing a fair coin 10 times; your goal is to mimic this randomness as closely as possible.</p>
            
            <p><b><u>Instructions:</u></b></p>
            <ul>
                <li>Type each 10-item sequence one by one. The sequence will stay on screen until completed and will be cleared before typing the next one.</li>
                <li>Work at your own pace, but try to avoid any predictable patterns and ensure your sequences are as random as possible.</li>
                <li>Backspace is disabled, so consider your input carefully before pressing the key.</li>
                <li>The application will attempt to predict your next input based on your previous sequences.</li>
                <li>You can reset the application at any time using the Reset Button on screen.</li>
                <li>After completing all of the sequences, please download and email the results to <i>Andrew.Barraclough.2018@live.rhul.ac.uk</i>.</li>
            </ul>

            <p><b>Thanks again for your contribution!</b></p>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
        </Modal>
        </>
    );
};

export default App;
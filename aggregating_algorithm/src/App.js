import React, { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import './App.css';
import { aggregatingAlgorithm, generateExperts } from './utils';
import { BitTile } from './components/BitTile';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';

const MAX_PREFIX_LENGTH = 4;
const MAX_SEQUENCES_COUNT = 25;

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
    zoomPlugin
);

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
    const [aggregatingAlgorithmBound, setAggregatingAlgorithmBound] = useState(0);
    const [experts, setExperts] = useState([]);
    const [rawPrediction, setRawPrediction] = useState();
    const [gammas, setGammas] = useState([]);
    const [omegas, setOmegas] = useState([]);
    const [sequence, setSequence] = useState('');
    const [sequences, setSequences] = useState([]);
    const [predictedSequence, setPredictedSequence] = useState(['-']);
    const [predictedSequences, setPredictedSequences] = useState([]);
    const [sequenceLosses, setSequenceLosses] = useState([]);
    const [finalResults, setFinalResults] = useState({});
    const [data, setData] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [isFinalResultsSet, setisFinalResultsSet] = useState(false);
    const [showExpertsPredictions, setShowExpertsPredictions] = useState(true);
    const [showPastSequences, setShowPastSequences] = useState(true);
    const [options, setOptions] = useState({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            zoom: {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'y',
                },
                pan: {
                    enabled: true,
                    mode: 'y',
                  },
            },
            legend: { display: false },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: 'black',
                        borderWidth: 2
                    },
                    line2: {
                        type: 'line',
                        yMin: aggregatingAlgorithmBound,
                        yMax: aggregatingAlgorithmBound,
                        borderColor: 'black',
                        borderWidth: 2,
                        borderDash: [10, 5]
                    }
                }
            },
            title: {
                display: true,
                text: 'Differences in Cumulative Losses Over Time',
                font: { size: 20, weight: 'bold' },
            }
        },
    });
    const predictedSequenceRef = useRef(null);
    const actualSequenceRef = useRef(null);
    const correctBits = predictedSequence.slice(1)
        .filter((bit, index) => bit === parseInt(sequence[index+1])).length;
    const incorrectBits = predictedSequence.length < 3 ? 0 : predictedSequence.length - correctBits - 2;
    
    useEffect(() => {
        const newExperts = generateExperts(MAX_PREFIX_LENGTH);
        setExperts(newExperts);
        setAggregatingAlgorithmBound(-(1.0 / 2.0) * Math.log(newExperts.length));
    }, [])

    useEffect(() => {
        if (finalResults.cumulativeLearnerLoss) {
            const learnerLoss = finalResults.cumulativeLearnerLoss.filter(loss => !isNaN(loss));
            const expertsLosses = transpose(finalResults.cumulativeExpertsLosses
                .map(losses => losses.filter(loss => !isNaN(loss)))
                .filter(losses => losses.length > 0));

            const datasets = expertsLosses.map((expertLoss, index) => ({
                label: `${experts[index].toString()} | ${Math.round(experts[index].predict())} (${experts[index].predict()})`,
                data: expertLoss.map((prediction, i) => prediction - learnerLoss[i]),
                backgroundColor: 'transparent',
                borderColor: `hsl(${(index * 360 / expertsLosses.length) % 360}, 70%, 50%, 0.5)`, // Colors for different experts
                borderDash: [8, 2],
                pointBorderColor: 'transparent',
                pointBorderWidth: 4,
                tension: 0.0
            }));

            setData({
                labels: finalResults.cumulativeLearnerLoss.map((_, index) => index + 1),
                datasets
            });
            
            const maxYValue = getMaxValue(datasets);
            setOptions(previousOptions => ({
                ...previousOptions,
                scales: {
                    x: {
                        grid: { display: true },
                        title: { display: true, text: 'Time', font: { size: 14, weight: 'bold' } }
                    },
                    y: {
                        max: Math.ceil(maxYValue),
                        min: Math.floor(aggregatingAlgorithmBound),
                        ticks: { stepSize: 0.1, },
                        grid: { borderDash: [10] },
                        title: {  display: true, text: 'Loss', font: { size: 14, weight: 'bold' } }
                    }
                }
            }));
        }
    }, [finalResults, aggregatingAlgorithmBound, experts]);
    
    useEffect(() => {
        if (Object.keys(finalResults).length > 0) {
            setisFinalResultsSet(true);
        }
    }, [finalResults]);

    useEffect(() => {
        if (predictedSequenceRef.current) {
            predictedSequenceRef.current.scrollLeft = predictedSequenceRef.current.scrollWidth;
        }
        if (actualSequenceRef.current) {
            actualSequenceRef.current.scrollLeft = actualSequenceRef.current.scrollWidth;
        }
    }, [predictedSequence, sequence]);

    const transpose = (array) => array[0].map((_, colIndex) => array.map(row => row[colIndex]));

    const handleUserInput = (e) => {
        let sequence = e.target.value;

        if (sequences.length >= MAX_SEQUENCES_COUNT) return;

        if (/^[01]*$/.test(sequence)) {
            setSequence(sequence);
            
            const updatedOmegas = [...omegas, sequence.slice(-1)];
            setOmegas(updatedOmegas);
            handleUpdateExpert(sequence);
            
            if (sequence.length % 10 === 0) {
                setSequences(sequences => [...sequences, sequence.slice(-10)]);
                setPredictedSequences(predictedSequences => [...predictedSequences, predictedSequence.slice(-10)]);
            }
            
            const expertsPredictions = experts.map(expert => expert.predict());
            const updatedGammas = [...gammas, expertsPredictions];
            setGammas(updatedGammas);
            const results = aggregatingAlgorithm(updatedGammas, updatedOmegas.slice(1));
            
            if (sequence.length % 10 === 0) {
                const loss = results.cumulativeLearnerLoss.slice(-11, -1);
                const sequenceLoss = loss[9] !== undefined ? (loss[9] - loss[0]) : (loss[8] - loss[0])
                setSequenceLosses(sequenceLosses => [...sequenceLosses, sequenceLoss])

                if (sequences.length === MAX_SEQUENCES_COUNT - 1) {
                    setFinalResults(results);
                    experts.map(expert => expert.awake = true);
                }
            }
            
            const rawPrediction = results.learnerPredictions.slice(-1)[0].toFixed(3);
            setRawPrediction(rawPrediction);
            setPredictedSequence(predictedSequence => [...predictedSequence, Math.round(rawPrediction)]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key !== '0' && e.key !== '1') {
            e.preventDefault();
        }
    }

    const handleReset = () => {
        setSequence('');
        setSequences([]);
        setPredictedSequence(['-']);
        setPredictedSequences([]);
        setGammas([]);
        setOmegas([]);
        experts.forEach(expert => expert.reset());
    };

    const handleDownload = () => {
        finalResults.sequences = sequences;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalResults));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "finalResults.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleShowExpertsPredictionsChange = (e) => setShowExpertsPredictions(e.target.checked);

    const handleShowPastSequencesChange = (e) => setShowPastSequences(e.target.checked);

    const handleUpdateExpert = (sequence) => {
        experts.forEach(expert => {
            try {
                const lastBit = sequence.slice(-1);

                if (expert.awake) {
                    if (lastBit === '0') {
                        expert.numZeros += 1;
                    } else if (lastBit === '1') {
                        expert.numOnes += 1;
                    }
                }

                expert.awake = sequence.slice(-expert.prefix.length) === expert.prefix;
            } catch (e) {
                console.error(e);
            }
        })
    }

    const getMaxValue = (datasets) => {
        return datasets.reduce((max, dataset) => Math.max(max, ...dataset.data), -Infinity);
    };

    return (
        <>
        <h1 className='heading'>Aggregating Algorithm for Specialist Experts (AASE)</h1>
        {sequences.length !== MAX_SEQUENCES_COUNT && <div>
            <p className='heading'><b><u>Instructions:</u></b></p>
            <ul className='instructions'>
                <li>Type each of your 10-item sequences in the input box provided.</li>
                <li>They will appear as one, long sequence since this is how the prediction algorithm works, but will be separated into 10-item sequences on-screen when applicable.</li>
                <li>Work at your own pace, but try to avoid any predictable patterns and ensure your sequences are as random as possible.</li>
                <li>Backspace is disabled, so consider your input carefully before pressing each key.</li>
                <li>The application will attempt to predict your next input based on your previous inputs.</li>
                <li>You can reset the application at any time using the Reset Button on screen.</li>
                <li>After completing all of the sequences, please download and email the results to <i>Andrew.Barraclough.2018@live.rhul.ac.uk</i>.</li>
            </ul>
            <div className='row'>
                <div className='column'>
                    <div className='input-container'>
                        <input
                            type="text"
                            value={sequence}
                            onChange={handleUserInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Binary Sequence"
                            disabled={sequences.length >= MAX_SEQUENCES_COUNT}
                        />
                    </div>
                </div>
                <div className='column counter'>
                    <b><u>Length</u></b>{sequence.length} / {MAX_SEQUENCES_COUNT * 10}
                </div>
                <div className='column counter'>
                    <b><u>Sequences</u></b>{sequences.length} / {MAX_SEQUENCES_COUNT}
                </div>
                <div className='column reset'>
                    <button onClick={handleReset}><img className="photo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Refresh_font_awesome.svg/512px-Refresh_font_awesome.svg.png?20130126205514" alt="Reset!" /></button>
                </div>
            </div>


            <div>
                <div>
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
                                    <td>{rawPrediction === null ? null : Math.round(rawPrediction)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='sequences'>
                        <div className='predictions'>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className='predictions-label'><b>Correct Bits:</b></td>
                                        <td className='predictions-value'><BitTile key='incorrect-bits' bit={correctBits}/></td>
                                    </tr>
                                    <tr>
                                        <td className='predictions-label'><b>Incorrect Bits:</b></td>
                                        <td className='predictions-value'><BitTile key='incorrect-bits' bit={incorrectBits}/></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td className='sequence-label'><b>Predicted:</b></td>
                                    <td className='sequence-bits-wrapper' ref={predictedSequenceRef}>
                                        <div className='sequence-bits'>
                                            {predictedSequence.map((bit, index) => (
                                                <BitTile key={`predicted-${index}`} bit={bit} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className='sequence-label'><b>Actual:</b></td>
                                    <td className='sequence-bits-wrapper' ref={actualSequenceRef}>
                                        <div className='sequence-bits'>
                                            {sequence.split('').map((bit, index) =>(
                                                <BitTile key={`actual-${index}`} bit={bit} />
                                            ))}
                                            <BitTile bit={'-'}/>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <hr/>
                </div>

                {sequences.length > 0 && <div>
                    <div className='past-sequences'>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <h2>Past Sequences</h2>
                            <label className='switch'>
                                <input
                                    type='checkbox'
                                    checked={showPastSequences}
                                    onChange={handleShowPastSequencesChange}
                                />
                                <span className='slider round'></span>
                            </label>
                        </div>
                        {showPastSequences && <div className='scrollable'>
                            <table>
                                <tbody>
                                    {sequences.map((_, index) => {
                                        const sequenceIndex = sequences.length - index - 1;
                                        const predictedSequence = predictedSequences[sequenceIndex]
                                        const actualSequence = sequences[sequenceIndex].split('');

                                        const correctBits = predictedSequence.filter((bit, idx) => bit === parseInt(actualSequence[idx])).length;
                                        const incorrectBits = predictedSequence.length - correctBits - (sequenceIndex === 0 ? 1 : 0)

                                        return (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td rowSpan='2'><b>Sequence #{sequences.length - index}</b><br/>Total Loss: {sequenceLosses[sequences.length - index - 1].toFixed(3)}</td>
                                                    <td><b>Predicted:</b></td>
                                                    <td>
                                                        {predictedSequences[sequences.length - index - 1].map((bit, idx) => (
                                                            <BitTile key={`predicted-${index}-${idx}`} bit={bit === null ? '-': bit} />
                                                        ))}
                                                    </td>
                                                    <td><b>Correct Bits:</b></td>
                                                    <td><BitTile bit={correctBits}/></td>
                                                </tr>
                                                <tr>
                                                    <td><b>Actual:</b></td>
                                                    <td>
                                                        {sequences[sequences.length - index - 1].split('').map((bit, index) =>(
                                                            <BitTile key={`actual-${index}`} bit={bit} />
                                                        ))}
                                                    </td>
                                                    <td><b>Incorrect Bits:</b></td>
                                                    <td><BitTile bit={incorrectBits}/></td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>}
                    </div>
                    <hr/>
                </div>}
                
                <div className='experts-predictions'>                    
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <h2>Show Experts' Predictions?</h2>
                        <label className='switch'>
                            <input
                                type='checkbox'
                                checked={showExpertsPredictions}
                                onChange={handleShowExpertsPredictionsChange}
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
                                    <th style={{backgroundColor:'#e0e0e0'}}>Previous Prediction</th>
                                    <th style={{backgroundColor:'#e0e0e0'}}>Current Prediction</th>
                                </tr>
                            </thead>
                            <tbody>
                                {experts.map((expert, index) => (
                                    <tr key={index}>
                                        <td>{expert.toString()}</td>
                                        <td>{showExpertsPredictions ? expert.numZeros : "❓"}</td>
                                        <td>{showExpertsPredictions ? expert.numOnes : "❓"}</td>
                                        <td>{showExpertsPredictions ? expert.awake ? "✅" : "❌" : "❓"}</td>
                                        <td>{showExpertsPredictions ? (expert.awake ? expert.previousPrediction : "-") : "❓"}</td>
                                        <td>{showExpertsPredictions ? (expert.awake ? expert.currentPrediction : "-") : "❓"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>}

        {sequences.length === MAX_SEQUENCES_COUNT && (
            <div className='results-container'>
                <hr/>
                <h1>Results</h1>
                <p>
                    <u><b>How to Read the Line Chart</b></u><br/>
                    • The line chart shows the differences between the Leaner's Loss and each Expert's Loss at each time step.<br/>
                    • The more lines you see below the x-axis, the more predictable your sequences were by that expert.<br/>
                    • Hover over the lines at each intersection to see which prefix you were the most <i>(below x-axis)</i> and least <i>(above x-axis)</i> predictable with.
                </p>
                {isFinalResultsSet && (
                    <div className='line-chart'>
                        <Line data={data} options={options}></Line>
                    </div>
                )}
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
                    <p><b><i>Please download the results and email the file to <a href="mailto:Andrew.Barraclough.2018@live.rhul.ac.uk">Andrew.Barraclough.2018@live.rhul.ac.uk</a>.</i></b></p>
                </div>
                <hr/>
                <div className='past-sequences'>
                    <h2 className='heading'>Past Sequences</h2>
                    <div className='scrollable'>
                    <table>
                                <tbody>
                                    {sequences.map((_, index) => {
                                        const sequenceIndex = sequences.length - index - 1;
                                        const predictedSequence = predictedSequences[sequenceIndex]
                                        const actualSequence = sequences[sequenceIndex].split('');

                                        const correctBits = predictedSequence.filter((bit, idx) => bit === parseInt(actualSequence[idx])).length;
                                        const incorrectBits = predictedSequence.length - correctBits - (sequenceIndex === 0 ? 1 : 0)

                                        return (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td rowSpan='2'><b>Sequence #{sequences.length - index}</b><br/>Total Loss: {sequenceLosses[sequences.length - index - 1].toFixed(3)}</td>
                                                    <td><b>Predicted:</b></td>
                                                    <td>
                                                        {predictedSequences[sequences.length - index - 1].map((bit, idx) => (
                                                            <BitTile key={`predicted-${index}-${idx}`} bit={bit === null ? '-': bit} />
                                                        ))}
                                                    </td>
                                                    <td><b>Correct Bits:</b></td>
                                                    <td><BitTile bit={correctBits}/></td>
                                                </tr>
                                                <tr>
                                                    <td><b>Actual:</b></td>
                                                    <td>
                                                        {sequences[sequences.length - index - 1].split('').map((bit, index) =>(
                                                            <BitTile key={`actual-${index}`} bit={bit} />
                                                        ))}
                                                    </td>
                                                    <td><b>Incorrect Bits:</b></td>
                                                    <td><BitTile bit={incorrectBits}/></td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                    </div>
                </div>
            </div>
        )}

        <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            style={customStyles}
            contentLabel="Instructions Modal"
        >
            <h2><u>Aggregating Algorithm for Specialist Experts</u></h2>
            <p><b>Thank you for participating in this experiment, I appreciate your time and this project wouldn't be possible without you.</b></p>
            
            <p>Your task is to create a table of sequences each consisting of 10 items, either 0 or 1.</p>
            <p>Imagine that several people have each tossed a fair coin 10 times and the results of their tosses are recorded in a table, with each row recording the outcomes of the 10 tosses by 1 person.</p>
            <p>Your goal is to produce this table in such a way that if compared with a table of the results of actual coin tosses, it would not be possible to distinguish which table represented the actual coin tosses with statistical tests and which didn't.</p>
            
            <p><b><u>Instructions:</u></b></p>
            <ul>
                <li>Type each of your 10-item sequences in the input box provided.</li>
                <li>They will appear as one, long sequence since this is how the prediction algorithm works, but will be separated into 10-item sequences on-screen when applicable.</li>
                <li>Work at your own pace, but try to avoid any predictable patterns and ensure your sequences are as random as possible.</li>
                <li>Backspace is disabled, so consider your input carefully before pressing each key.</li>
                <li>The application will attempt to predict your next input based on your previous inputs.</li>
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
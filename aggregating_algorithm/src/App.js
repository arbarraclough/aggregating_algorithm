import React, { useEffect, useState } from 'react';
import './App.css';
import { aggregatingAlgorithm, generateExperts, getAwakeExperts, getAwakeExpertsWithConstantlyAwakeExperts, castLearnerPredictions, castExpertsPredictions } from './utils';

const MAX_PREFIX_LENGTH = 3;
const TEST_SEQUENCE = "0110101000110100110110101011110000110011010111110011110110011010000011101111101111100111100110101011011101101110001010110100011000010110011000000000000000001000111101011010100010100001000000100001110001001010100101110101101100100110001000001110110011001101010110100111010100111011001111011001111010011111101101000110111010001111000000000001000100010000111100111100100100010001101100011101010001010101011001000001010000011010110000001010110011101011101010110100100001011001000001010100001101111111100010101111111001000011000011110101000001000011001000001001001001011011110111110100100111100100000110000100001100001100100100000110101101110100101110000100001010000011000010001111011001110011110000010111101100100100110100100100010000011111101111111110101010110010011000100001110000010011100110111011011111100011110111011110100011000000101010011000110010111100101011111001000110111101001110110011101011110101110000000100101111011100110001000101111100111100101001100000001001010100100000110110001101001110";
const MAX_SEQUENCE_LENGTH = 15;

const Expert = ({ prefix, binaryInput }) => {
  let [numZeros, setNumZeros] = useState(0.0);
  let [numOnes, setNumOnes] = useState(0.0);
  let [awake, setAwake] = useState(false)
  let lastBit = ''

  useEffect(() => {
      if (!binaryInput || binaryInput === '') {
        setAwake(false);
        return;
      }

      try {
        lastBit = binaryInput.binaryInput.slice(-1);
        console.log(`lastBit: ${lastBit}`);
        /** If the expert was previously awake, increment the relevant counter. */
        if (awake) {
          (lastBit == 0) ? setNumZeros(numZeros + 1) : setNumOnes(numOnes + 1);
        }

        /** Check if the expert is awake. */
        if (binaryInput.binaryInput.slice(-prefix.length) === prefix) {
          setAwake(true);
        } else {
          setAwake(false);
        }
      } catch (e) {
        console.error(e);
      }
  }, [binaryInput, prefix])

  const toString = () => {
      return `Expert "${prefix}" - (${numZeros}, ${numOnes})`;
  };

 const predict = () => {
    if (awake) {
      if (numZeros + numOnes === 0) {
        return 0;
      }
      return (numOnes / (numZeros + numOnes)).toFixed(4);
    } else {
      return '-';
    }
  };

  return (
      <tr>
          <td>{toString()}</td>
          <td>{awake ? "Yes" : "No"}</td>
          <td>{predict()}</td>
      </tr>
  );
};

function App() {
  // const [gammas, setGammas] = useState([]);
  let [omegas, setOmegas] = useState([]);
  const [expertsPredictions, setExpertsPredictions] = useState([]);
  // const [learnerPredictions, setLearnerPredictions] = useState([]);
  // const [cumulativeExpertsLosses, setCumulativeExpertsLosses] = useState([]);
  // const [cumulativeLearnerLoss, setCumulativeLearnerLoss] = useState([]);
  let [binaryInput, setBinaryInput] = useState('');
  let [experts, setExperts] = useState([]);
  
  React.useState(() => {
    const generatedExperts = generateExperts(MAX_PREFIX_LENGTH);
    setExperts(generatedExperts);
    const AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * Math.log(generateExperts.length);
  }, [])
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log(value);
    if (/^[01]*$/.test(value) && value.length <= MAX_SEQUENCE_LENGTH) {
      setBinaryInput(value);
      setOmegas(omegas => [...omegas, value.slice(-1)]);
    }
    console.log(omegas)
    let expertsPredictions = [];
    console.log(experts)
    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i];
      // expertsPredictions.push(expert.predict());
    }
    console.log(expertsPredictions)
  };
  
  const handleReset = () => {
    setBinaryInput('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Binary Sequence Input</h1>
      </header>
      <div className="columns">
        <div className="column">
          <input
            type="text"
            value={binaryInput}
            onChange={handleInputChange}
            placeholder="Binary Sequence"
            className="input-box"
            maxLength={MAX_SEQUENCE_LENGTH}
            />
        </div>
        <div className="column">
          <p className="counter">{binaryInput.length} / {MAX_SEQUENCE_LENGTH}</p>
        </div>
        <div className="column">
          <button onClick={handleReset} className="reset-button">Reset</button>
        </div>
      </div>
      <p><b>Learner's Prediction:</b> {}</p>
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
            <Expert key={index} prefix={expert.prefix} binaryInput={{binaryInput}} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;

// const AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * Math.log(4);
// const FILENAME = 'sleeping_expert_test.txt';

// const App = () => {
//   const [fileContent, setFileContent] = useState('');

//   useEffect(() => {
//     /** Asynchronous function to fetch data from a file. */
//     const fetchData = async () => {
//       try {
//         /** Make a GET request to fetch the file. */
//         const response = await axios.get(FILENAME);
//         const fileText = response.data;
//         setFileContent(fileText);
//         /** Split the file content into lines. */
//         const lines = fileText.split('\n');

//         const gammas = [];

//         lines.forEach(line => {
//           /** Split each line into columns based on whitespace. */
//           const columns = line.trim().split(/\s+/);
//           const values = columns.slice(3).filter((_, index) => index % 2 === 0).map(Number);
//           gammas.push(values)
//         });

//         setGammas(gammas);
//         setOmegas(new Array(lines.length).fill(1));
//       } catch (error) {
//         console.error('Error fetching the file:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (gammas.length > 0 && omegas.length > 0) {
//       const [
//         expertsPredictions,
//         learnerPredictions,
//         cumulativeExpertsLosses,
//         cumulativeLearnerLoss
//       ] = aggregatingAlgorithm(gammas, omegas);

//       /** Store the results from the Aggregating Algorithm in the state. */
//       setExpertsPredictions(expertsPredictions);
//       setLearnerPredictions(learnerPredictions);
//       setCumulativeExpertsLosses(cumulativeExpertsLosses);
//       setCumulativeLearnerLoss(cumulativeLearnerLoss);

//       setLoading(false);
//     }
//   }, [gammas, omegas]);

//   const renderTable = (data, headers) => (
//     <table>
//       <thead>
//         <tr>
//           {headers.map((header, index) => (
//             <th key={index}>{header}</th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((row, rowIndex) => (
//           <tr key={rowIndex}>
//             {row.map((cell, cellIndex) => (
//               <td key={cellIndex}>{cell.toFixed(4)}</td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );

//   return (
//     <div>
//       <h1>Aggregating Algorithm Output</h1>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         gammas.length > 0 && omegas.length > 0 && (
//           <>
//             <h2>Experts Predictions</h2>
//             {renderTable(expertsPredictions, gammas[0].map((_, index) => `Expert ${index + 1}`))}

//             <h2>Learner Predictions</h2>
//             {renderTable([learnerPredictions], gammas.map((_, index) => `${index + 1}`))}

//             <h2>Cumulative Experts Losses</h2>
//             {renderTable(cumulativeExpertsLosses, gammas[0].map((_, index) => `Expert ${index + 1}`))}

//             <h2>Cumulative Learner Loss</h2>
//             {renderTable([cumulativeLearnerLoss], gammas.map((_, index) => `${index + 1}`))}

            
//             <h2>Cumulative Losses vs. Time</h2>
//             <Line data = {dat}>
//             </Line>
//           </>
//         )
//       )}
//     </div>
//   )
// };
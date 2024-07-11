import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { aggregatingAlgorithm, generateExperts, getAwakeExperts, getAwakeExpertsWithConstantlyAwakeExperts, castLearnerPredictions, castExpertsPredictions } from './utils';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import axios from 'axios';
import Expert from './Expert.js';

const AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * Math.log(4);
const FILENAME = 'sleeping_expert_test.txt';

const App = () => {
  const [fileContent, setFileContent] = useState('');
  const [gammas, setGammas] = useState([]);
  const [omegas, setOmegas] = useState([]);
  const [expertsPredictions, setExpertsPredictions] = useState([]);
  const [learnerPredictions, setLearnerPredictions] = useState([]);
  const [cumulativeExpertsLosses, setCumulativeExpertsLosses] = useState([]);
  const [cumulativeLearnerLoss, setCumulativeLearnerLoss] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(FILENAME);
        const fileText = response.data;
        setFileContent(fileText);

        const lines = fileText.split('\n');
        const gammasData = [];

        lines.forEach(line => {
          const columns = line.trim().split(/\s+/);
          if (columns.length > 3) {
            const values = columns.slice(3).filter((_, index) => index % 2 === 0).map(Number);
            gammasData.push(values);
          }
        });

        setGammas(gammasData);
        setOmegas(new Array(gammasData.length).fill(1));

        const [
          expertsPreds,
          learnerPreds,
          cumulativeExpertsLosses,
          cumulativeLearnerLoss
        ] = aggregatingAlgorithm(gammasData, new Array(gammasData.length).fill(1));

        setExpertsPredictions(expertsPreds);
        setLearnerPredictions(learnerPreds);
        setCumulativeExpertsLosses(cumulativeExpertsLosses);
        setCumulativeLearnerLoss(cumulativeLearnerLoss);
      } catch (error) {
        console.error('Error fetching the file:', error);
      }
    };

    fetchData();
  }, []);
  
    const createLossChartData = () => {
      const labels = Array.from({ length: gammas.length + 1 }, (_, i) => i);
      const datasets = cumulativeExpertsLosses[0].map((_, i) => ({
        label: `Loss_E_${i + 1}(t)`,
        data: cumulativeExpertsLosses.map(loss => loss[i]),
        borderColor: `rgba(${(i * 50) % 255}, ${(i * 80) % 255}, ${(i * 110) % 255}, 0.7)`,
        fill: false
      }));
  
      datasets.push({
        label: 'Loss_L(t)',
        data: cumulativeLearnerLoss,
        borderColor: 'black',
        fill: false
      });
  
      return { labels, datasets };
    };
  
    const createDifferenceChartData = () => {
      const labels = Array.from({ length: gammas.length + 1 }, (_, i) => i);
      const datasets = cumulativeExpertsLosses[0].map((_, i) => ({
        label: `Loss_E_${i + 1}(t) - Loss_L(t)`,
        data: cumulativeExpertsLosses.map(loss => loss[i] - cumulativeLearnerLoss[loss.length - 1]),
        borderColor: `rgba(${(i * 50) % 255}, ${(i * 80) % 255}, ${(i * 110) % 255}, 0.7)`,
        fill: false
      }));
  
      datasets.push({
        label: 'Aggregating Algorithm Bound',
        data: Array(labels.length).fill(AGGREGATING_ALGORITHM_BOUND),
        borderColor: 'black',
        borderDash: [10, 5],
        fill: false
      });
  
      return { labels, datasets };
    };

  return (
    <div>
      <h1>Aggregating Algorithm Output</h1>
      <pre>{fileContent}</pre>

      {gammas.length > 0 && (
        <>
          <h2>Cumulative Losses vs. Time</h2>
          <Line data={createLossChartData()} />
        {/* 
          <h2>Differences of Cumulative Losses vs. Time</h2>
          <Line data={createDifferenceChartData()} />
        */}
        </>
      )}
    </div>
  )

//   return (
//     <div>
//       <h1>Aggregating Algorithm Output</h1>
//       {gammas.length > 0 && (
//         <>
//           <h2>Cumulative Losses vs. Time</h2>
//           <Line data={createLossChartData()} />

//           <h2>Differences of Cumulative Losses vs. Time</h2>
//           <Line data={createDifferenceChartData()} />
//         </>
//       )}
//     </div>
//   );
};

// function App() {
//   const maxLength = 10;
//   const [binaryInput, setBinaryInput] = useState('');

//   const gammas = [
//     [0.2, 0.4, 0.6],
//   ]

//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     if (/^[01]*$/.test(value) && value.length <= maxLength) {
//       setBinaryInput(value);
//     }
//   };

//   const handleReset = () => {
//     setBinaryInput('');
//   };

//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Binary Sequence Input</h1>
//       </header>
//       <div className="columns">
//         <div className="column">
//           <input
//             type="text"
//             value={binaryInput}
//             onChange={handleInputChange}
//             placeholder="10-digit Binary Sequence"
//             className="input-box"
//             maxLength={maxLength}
//           />
//         </div>
//         <div className="column">
//           <p className="counter">{binaryInput.length} / 10</p>
//         </div>
//         <div className="column">
//           <button onClick={handleReset} className="reset-button">Reset</button>
//         </div>
//       </div>
//     </div>
//   );
// };

export default App;

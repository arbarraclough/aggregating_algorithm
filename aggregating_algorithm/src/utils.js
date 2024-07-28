export const aggregatingAlgorithm = (
    gammas,
    omegas,
    eta = 2.0,
    C_eta = 1.0,
    weights = null
  ) => {
    const N = gammas[0].length;
    const T = gammas.length - 1;
    
    if (T === 0) {
      return {
        learnerPredictions: [parseFloat(gammas[0].find(item => item !== '-'))],
      }
    }

    const expertsPredictions = [];
    const learnerPredictions = [];
    let expertsLosses = [];
    const learnerLoss = new Array(T).fill(0);
    let cumulativeExpertsLosses = [];
    const cumulativeLearnerLoss = new Array(T).fill(0);
    
    /** Step 1: Initialise weights, w^i_0 = q_i, i = 1, 2, ..., N */
    if (!weights) {
      weights = new Array(N).fill(1 / N);
    }
  
    /** Step 2: Repeat for t \in T... */
    for (let t = 0; t < T; t++) {
      /** Step 3: Read the experts' predictions \gamma^n_t of awake experts */
      let gammas_t = gammas[t];
      expertsPredictions.push(gammas_t);

      /** Maintain a list of awake experts */
      const awakeExperts = gammas_t.map(g => !isNaN(g));
      /** If there aren't any awake experts for a timestep, skip the iteration */
      if (!awakeExperts.some(a => a)) {
        continue;
      }
      gammas_t = gammas_t.filter((_, j) => awakeExperts[j]);

      /** Step 4: Normalise the weights of awake experts */
      const normalisedWeights = weights
        .filter((_, i) => awakeExperts[i])
        .map(w => w / weights.filter((_, i) => awakeExperts[i]).reduce((a, b) => a + b, 0));

      /** Step 5: Solve the system (\omega \in \Omega) */
      let weightedPredictions_0 = [];
      for (let i = 0; i < gammas_t.length; i++) {
        let lambda = normalisedWeights[i] * Math.exp(-eta * Math.pow(gammas_t[i], 2));
        weightedPredictions_0.push(lambda);
      }
      let g0 = -(C_eta / eta) * Math.log(
        weightedPredictions_0
          .reduce((sum, val) => sum + val, 0)
      );

      let weightedPredictions_1 = [];
      for (let i = 0; i < gammas_t.length; i++) {
        let lambda = normalisedWeights[i] * Math.exp(-eta * Math.pow(1 - gammas_t[i], 2));
        weightedPredictions_1.push(lambda);
      }
      let g1 = -(C_eta / eta) * Math.log(
        weightedPredictions_1
          .reduce((sum, val) => sum + val, 0)
      );

      const generalisedPrediction = [g0, g1];
      
      /** Calculate the leaner's prediction */
      const gamma_t = (1 / 2) - ((generalisedPrediction[1] - generalisedPrediction[0]) / 2);
      learnerPredictions.push(gamma_t);
      
      /** Step 6: Observe the outcome \omega_t */
      const omega_t = omegas[t + 1];
      
      /** Calculate the awake experts' losses */
      const awakeLosses = gammas_t.map(g => Math.pow(omega_t - g, 2));

      /** Calculate the learner's and asleep experts' losses */
      const loss = Math.pow(omega_t - gamma_t, 2);
      const losses = awakeExperts.map((awake, i) => (awake ? awakeLosses.shift() : loss));
  
      expertsLosses.push(losses);
      learnerLoss[t] = loss;
      cumulativeExpertsLosses = expertsLosses.reduce((sum, val) => {
        sum.push(sum[sum.length - 1].map((sum, i) => sum + val[i]));
        return sum;
      }, [new Array(N).fill(0)]);
      cumulativeLearnerLoss[t + 1] = cumulativeLearnerLoss[t] + learnerLoss[t];
      
      weights = weights.map((w, i) =>
        awakeExperts[i] ?
          /** Step 7: Update the awake experts' weights w^n_t = w^n_{t-1} e^{-\eta \lambda(\gamma^n_t, \omega)} */
          w * Math.exp(-eta * losses[i]) :
          /** Step 8: Update the sleeping experts' weights w^n_t = w^n_{t-1} e^{\frac{-\eta\lambda(\gamma_t, \omega)}{C(\eta)}} */
          w * Math.exp((-eta * losses[i]) / C_eta)
      );

      /** Renormalise the updated experts' weights. */
      const weightSum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / weightSum);
    }
  
    return {
      outcomes: omegas,
      expertsPredictions: expertsPredictions,
      learnerPredictions: learnerPredictions,
      cumulativeExpertsLosses: cumulativeExpertsLosses,
      cumulativeLearnerLoss: cumulativeLearnerLoss
    };
  };
  
class Expert {
        constructor(prefix) {
            this.prefix = prefix
            this.numZeros = 0;
            this.numOnes = 0;
            this.awake = false;
            this.previousPrediction = '-';
            this.currentPrediction = '-';
        }
        
        toString() {
          return `Expert "${this.prefix}"`;
        }

        predict() {
          if (!this.awake) {
            return '-';
          } else {
            let prediction;
            if (this.numZeros + this.numOnes === 0) {
              prediction = Math.random().toFixed(3);
            } else {
              prediction = (this.numOnes / (this.numZeros + this.numOnes)).toFixed(3);
            }
            this.previousPrediction = this.currentPrediction;
            this.currentPrediction = prediction
            return prediction;
          }
        }

        reset() {
          this.numZeros = 0;
          this.numOnes = 0;
          this.awake = false;
          this.previousPrediction = '-';
          this.currentPrediction = '-';
        }
    }

  export const generateExperts = (length) => {
    const generate = (prefix, length) => {
      if (length === 0) {
        return [new Expert(prefix)];
      } else {
        return [
          ...generate(prefix + '0', length - 1),
          ...generate(prefix + '1', length - 1)
        ];
      }
    };

    if (length <= 0) {
      return [];
    } else {
      let experts = []
      for (let l = 1; l <= length; l++) {
        experts = experts.concat(generate("", l));
      }
      return experts;
    }
  };
  
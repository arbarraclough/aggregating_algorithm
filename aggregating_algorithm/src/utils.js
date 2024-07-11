// utils.js

export const aggregatingAlgorithm = (
    gammas,
    omegas,
    eta = 2.0,
    C_eta = 1.0,
    weights = null
  ) => {
    const N = gammas[0].length;
    const T = gammas.length;
  
    const expertsPredictions = [];
    const learnerPredictions = [];
    let expertsLosses = [new Array(N).fill(0)];
    const learnerLoss = new Array(T).fill(0);
    let cumulativeExpertsLosses = [new Array(N).fill(0)];
    const cumulativeLearnerLoss = new Array(T + 1).fill(0);
  
    if (!weights) {
      weights = new Array(N).fill(1 / N);
    }
  
    for (let t = 0; t < T; t++) {
      const gammas_t = gammas[t];
      expertsPredictions.push(gammas_t);
  
      const awakeExperts = gammas_t.map(g => !isNaN(g));
      if (!awakeExperts.some(a => a)) {
        continue;
      }
  
      const normalisedWeights = weights
        .filter((_, i) => awakeExperts[i])
        .map(w => w / weights.filter((_, i) => awakeExperts[i]).reduce((a, b) => a + b, 0));
  
      const generalisedPrediction = -(C_eta / eta) * Math.log(
        [0, 1].map(omega_t =>
          normalisedWeights.reduce((sum, w, i) =>
            sum + w * Math.exp(-eta * Math.pow(omega_t - gammas_t.filter((_, j) => awakeExperts[j])[i], 2))
          , 0)
        )
      );
  
      const gamma_t = (1 / 2) - ((generalisedPrediction[1] - generalisedPrediction[0]) / 2);
      learnerPredictions.push(gamma_t);
  
      const omega_t = omegas[t];
      const awakeLosses = gammas_t.filter((_, i) => awakeExperts[i]).map(g => Math.pow(omega_t - g, 2));
      const loss = Math.pow(omega_t - gamma_t, 2);
      const losses = awakeExperts.map((awake, i) => (awake ? awakeLosses.shift() : loss));
  
      expertsLosses.push(losses);
      learnerLoss[t] = loss;
      cumulativeExpertsLosses = expertsLosses.reduce((acc, cur) => {
        acc.push(acc[acc.length - 1].map((sum, i) => sum + cur[i]));
        return acc;
      }, [new Array(N).fill(0)]);
      cumulativeLearnerLoss[t + 1] = cumulativeLearnerLoss[t] + learnerLoss[t];
  
      weights = weights.map((w, i) =>
        awakeExperts[i] ?
          w * Math.exp(-eta * losses[i]) :
          w * Math.exp((-eta * losses[i]) / C_eta)
      );
      const weightSum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / weightSum);
    }
  
    return [
      expertsPredictions,
      learnerPredictions,
      cumulativeExpertsLosses,
      cumulativeLearnerLoss
    ];
  };
  
  export const generateExperts = (length) => {
    const generate = (prefix, length) => {
      if (length === 0) {
        return [{ prefix }];
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
      let experts = [];
      for (let l = 1; l <= length; l++) {
        experts = experts.concat(generate("", l));
      }
      return experts;
    }
  };
  
  export const getAwakeExperts = (sequence, experts) => {
    return experts.map(expert => sequence.endsWith(expert.prefix));
  };
  
  export const getAwakeExpertsWithConstantlyAwakeExperts = (sequence, experts) => {
    return experts.map(expert =>
      sequence.endsWith(expert.prefix) ||
      expert.prefix === 'Zero' ||
      expert.prefix === 'One'
    );
  };
  
  export const castLearnerPredictions = (predictions) => {
    return predictions.map(prediction => Math.round(prediction)).join('');
  };
  
  export const castExpertsPredictions = (predictions) => {
    return predictions[0].map((_, expertIndex) => {
      return predictions.map(prediction => {
        const p = prediction[expertIndex];
        return isNaN(p) ? '-' : Math.round(p).toString();
      }).join('');
    });
  };
  
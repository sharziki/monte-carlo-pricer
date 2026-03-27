// Standard Normal random number generator using Box-Muller transform
export function generateNormalRandom(): number {
  let u1: number, u2: number;
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 === 0);

  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// Generate a pair of antithetic normal randoms
export function generateAntitheticPair(): [number, number] {
  const z = generateNormalRandom();
  return [z, -z];
}

export interface SimulationConfig {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  numPaths: number;
  numSteps: number;
  optionType: 'call' | 'put';
  asianOption: boolean;
  useAntithetic: boolean;
  useControlVariate: boolean;
}

export interface SimulationPath {
  times: number[];
  prices: number[];
}

export interface SimulationResult {
  optionPrice: number;
  standardError: number;
  confidenceInterval95: [number, number];
  confidenceInterval99: [number, number];
  paths: SimulationPath[];
  terminalPrices: number[];
  payoffs: number[];
  convergenceData: { numPaths: number; price: number; stdError: number }[];
  blackScholesPrice: number;
}

// Black-Scholes for comparison
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export function blackScholesPrice(config: SimulationConfig): number {
  const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = config;

  if (timeToExpiry <= 0) {
    return optionType === 'call'
      ? Math.max(spotPrice - strikePrice, 0)
      : Math.max(strikePrice - spotPrice, 0);
  }

  const d1 = (Math.log(spotPrice / strikePrice) +
    (riskFreeRate + volatility * volatility / 2) * timeToExpiry) /
    (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);

  if (optionType === 'call') {
    return spotPrice * normalCDF(d1) - strikePrice * discountFactor * normalCDF(d2);
  } else {
    return strikePrice * discountFactor * normalCDF(-d2) - spotPrice * normalCDF(-d1);
  }
}

// Generate a single price path using Geometric Brownian Motion
export function generatePath(config: SimulationConfig): SimulationPath {
  const { spotPrice, timeToExpiry, riskFreeRate, volatility, numSteps } = config;
  const dt = timeToExpiry / numSteps;
  const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
  const diffusion = volatility * Math.sqrt(dt);

  const times: number[] = [0];
  const prices: number[] = [spotPrice];

  let currentPrice = spotPrice;

  for (let i = 1; i <= numSteps; i++) {
    const z = generateNormalRandom();
    currentPrice = currentPrice * Math.exp(drift + diffusion * z);
    times.push((i * timeToExpiry) / numSteps);
    prices.push(currentPrice);
  }

  return { times, prices };
}

// Generate antithetic path pair
function generateAntitheticPathPair(config: SimulationConfig): [SimulationPath, SimulationPath] {
  const { spotPrice, timeToExpiry, riskFreeRate, volatility, numSteps } = config;
  const dt = timeToExpiry / numSteps;
  const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
  const diffusion = volatility * Math.sqrt(dt);

  const times1: number[] = [0];
  const prices1: number[] = [spotPrice];
  const times2: number[] = [0];
  const prices2: number[] = [spotPrice];

  let price1 = spotPrice;
  let price2 = spotPrice;

  for (let i = 1; i <= numSteps; i++) {
    const z = generateNormalRandom();
    price1 = price1 * Math.exp(drift + diffusion * z);
    price2 = price2 * Math.exp(drift + diffusion * (-z)); // Antithetic

    const time = (i * timeToExpiry) / numSteps;
    times1.push(time);
    prices1.push(price1);
    times2.push(time);
    prices2.push(price2);
  }

  return [
    { times: times1, prices: prices1 },
    { times: times2, prices: prices2 }
  ];
}

// Calculate payoff for a path
function calculatePayoff(path: SimulationPath, config: SimulationConfig): number {
  const { strikePrice, optionType, asianOption } = config;

  let relevantPrice: number;

  if (asianOption) {
    // Asian option: use average price
    relevantPrice = path.prices.reduce((a, b) => a + b, 0) / path.prices.length;
  } else {
    // European option: use terminal price
    relevantPrice = path.prices[path.prices.length - 1];
  }

  if (optionType === 'call') {
    return Math.max(relevantPrice - strikePrice, 0);
  } else {
    return Math.max(strikePrice - relevantPrice, 0);
  }
}

// Main Monte Carlo simulation
export function runSimulation(
  config: SimulationConfig,
  onProgress?: (progress: number) => void
): SimulationResult {
  const { numPaths, riskFreeRate, timeToExpiry, useAntithetic, useControlVariate } = config;
  const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);

  const paths: SimulationPath[] = [];
  const payoffs: number[] = [];
  const terminalPrices: number[] = [];
  const convergenceData: { numPaths: number; price: number; stdError: number }[] = [];

  // For control variate
  const bsPrice = blackScholesPrice(config);
  const controlVariates: number[] = [];

  // How many paths to store for visualization (limit to 200)
  const maxDisplayPaths = Math.min(200, numPaths);
  const pathSampleRate = Math.max(1, Math.floor(numPaths / maxDisplayPaths));

  let runningSum = 0;
  let runningSumSquared = 0;

  const effectivePaths = useAntithetic ? Math.ceil(numPaths / 2) : numPaths;

  for (let i = 0; i < effectivePaths; i++) {
    if (useAntithetic) {
      const [path1, path2] = generateAntitheticPathPair(config);
      const payoff1 = calculatePayoff(path1, config);
      const payoff2 = calculatePayoff(path2, config);
      const avgPayoff = (payoff1 + payoff2) / 2;

      payoffs.push(payoff1, payoff2);
      terminalPrices.push(
        path1.prices[path1.prices.length - 1],
        path2.prices[path2.prices.length - 1]
      );

      if (i % pathSampleRate === 0 && paths.length < maxDisplayPaths) {
        paths.push(path1);
        if (paths.length < maxDisplayPaths) paths.push(path2);
      }

      // For control variate, use the terminal stock price
      if (useControlVariate) {
        const avgTerminal = (path1.prices[path1.prices.length - 1] +
                           path2.prices[path2.prices.length - 1]) / 2;
        controlVariates.push(avgTerminal);
      }

      runningSum += avgPayoff;
      runningSumSquared += avgPayoff * avgPayoff;
    } else {
      const path = generatePath(config);
      const payoff = calculatePayoff(path, config);

      payoffs.push(payoff);
      terminalPrices.push(path.prices[path.prices.length - 1]);

      if (i % pathSampleRate === 0 && paths.length < maxDisplayPaths) {
        paths.push(path);
      }

      if (useControlVariate) {
        controlVariates.push(path.prices[path.prices.length - 1]);
      }

      runningSum += payoff;
      runningSumSquared += payoff * payoff;
    }

    // Record convergence data at intervals
    const currentPaths = useAntithetic ? (i + 1) * 2 : i + 1;
    if (currentPaths % Math.max(1, Math.floor(numPaths / 50)) === 0 || i === effectivePaths - 1) {
      const mean = runningSum / (i + 1);
      const variance = (runningSumSquared / (i + 1)) - mean * mean;
      const stdError = Math.sqrt(variance / (i + 1));

      convergenceData.push({
        numPaths: currentPaths,
        price: mean * discountFactor,
        stdError: stdError * discountFactor
      });
    }

    if (onProgress && i % 100 === 0) {
      onProgress(i / effectivePaths);
    }
  }

  // Calculate final statistics
  let optionPrice: number;
  let standardError: number;

  if (useControlVariate && !config.asianOption) {
    // Control variate adjustment
    // E[S_T] under risk-neutral measure = S_0 * e^(rT)
    const expectedTerminal = config.spotPrice * Math.exp(riskFreeRate * timeToExpiry);

    // Calculate covariance and variance
    const n = payoffs.length;
    let sumPayoff = 0, sumControl = 0, sumProduct = 0, sumControlSq = 0;

    for (let i = 0; i < n; i++) {
      sumPayoff += payoffs[i];
      sumControl += controlVariates[i];
      sumProduct += payoffs[i] * controlVariates[i];
      sumControlSq += controlVariates[i] * controlVariates[i];
    }

    const meanPayoff = sumPayoff / n;
    const meanControl = sumControl / n;
    const covariance = (sumProduct / n) - meanPayoff * meanControl;
    const varControl = (sumControlSq / n) - meanControl * meanControl;

    // Optimal coefficient
    const c = varControl > 0 ? covariance / varControl : 0;

    // Adjusted payoffs
    const adjustedPayoffs = payoffs.map((p, i) =>
      p - c * (controlVariates[i] - expectedTerminal)
    );

    const adjustedMean = adjustedPayoffs.reduce((a, b) => a + b, 0) / n;
    const adjustedVariance = adjustedPayoffs.reduce((a, b) =>
      a + (b - adjustedMean) ** 2, 0) / (n - 1);

    optionPrice = adjustedMean * discountFactor;
    standardError = Math.sqrt(adjustedVariance / n) * discountFactor;
  } else {
    const n = payoffs.length;
    const mean = payoffs.reduce((a, b) => a + b, 0) / n;
    const variance = payoffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);

    optionPrice = mean * discountFactor;
    standardError = Math.sqrt(variance / n) * discountFactor;
  }

  // Confidence intervals
  const z95 = 1.96;
  const z99 = 2.576;

  return {
    optionPrice,
    standardError,
    confidenceInterval95: [
      optionPrice - z95 * standardError,
      optionPrice + z95 * standardError
    ],
    confidenceInterval99: [
      optionPrice - z99 * standardError,
      optionPrice + z99 * standardError
    ],
    paths,
    terminalPrices,
    payoffs,
    convergenceData,
    blackScholesPrice: bsPrice
  };
}

// Statistics helper
export function calculateStatistics(values: number[]): {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
} {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, median: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);

  return {
    mean,
    stdDev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[n - 1],
    median: n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)]
  };
}

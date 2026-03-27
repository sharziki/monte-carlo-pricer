# Monte Carlo Options Pricer

A Monte Carlo simulation engine for pricing European and Asian options with real-time path visualization, convergence analysis, and variance reduction techniques.

## Features

### Simulation Engine
- **Geometric Brownian Motion (GBM)** - Simulates asset price paths using the standard stochastic differential equation
- **European Options** - Price calls and puts based on terminal price
- **Asian Options** - Price options based on average price over the path
- **Configurable Parameters** - Spot price, strike, time to expiry, risk-free rate, volatility

### Variance Reduction Techniques
- **Antithetic Variates** - Reduces variance by pairing each random path with its mirror
- **Control Variates** - Uses known expected values to reduce estimation error

### Visualizations
- **Price Paths** - Real-time visualization of 100-200 simulated paths fanning out from spot price
- **Terminal Price Distribution** - Histogram of final prices with strike price overlay
- **Convergence Chart** - Shows Monte Carlo price converging to Black-Scholes with confidence bands
- **Statistics Panel** - 95% and 99% confidence intervals, standard error, comparison to analytical solution

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **Plotly.js** - Interactive charts
- **Lucide React** - Icons

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Mathematical Background

### Black-Scholes Model
The simulation uses risk-neutral pricing under the Black-Scholes framework:

```
dS = rS dt + σS dW
```

Where:
- S = Asset price
- r = Risk-free rate
- σ = Volatility
- dW = Wiener process increment

### Monte Carlo Method
The option price is estimated as:

```
V = e^(-rT) * (1/N) * Σ payoff(S_T)
```

Where N is the number of simulated paths and S_T is the terminal price.

### Variance Reduction

**Antithetic Variates**: For each random number Z, we also simulate -Z, reducing variance by ~50%.

**Control Variates**: Uses E[S_T] = S_0 * e^(rT) as a control to reduce estimation error.

## Project Structure

```
src/
├── lib/
│   └── monteCarlo.ts    # Simulation engine
├── components/
│   ├── InputSlider.tsx      # Parameter input
│   ├── PathVisualization.tsx # Price paths chart
│   ├── HistogramChart.tsx   # Terminal distribution
│   ├── ConvergenceChart.tsx # Price convergence
│   └── StatsPanel.tsx       # Results display
└── App.tsx                  # Main application
```

## License

MIT

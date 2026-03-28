import { useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, Settings } from 'lucide-react';
import { InputSlider } from './components/InputSlider';
import { PathVisualization } from './components/PathVisualization';
import { HistogramChart } from './components/HistogramChart';
import { ConvergenceChart } from './components/ConvergenceChart';
import { StatsPanel } from './components/StatsPanel';
import { runSimulation, type SimulationConfig, type SimulationResult } from './lib/monteCarlo';

function App() {
  // Simulation parameters
  const [spotPrice, setSpotPrice] = useState(100);
  const [strikePrice, setStrikePrice] = useState(100);
  const [timeToExpiry, setTimeToExpiry] = useState(0.25);
  const [riskFreeRate, setRiskFreeRate] = useState(0.05);
  const [volatility, setVolatility] = useState(0.2);
  const [numPaths, setNumPaths] = useState(10000);
  const [numSteps, setNumSteps] = useState(50);
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [asianOption, setAsianOption] = useState(false);
  const [useAntithetic, setUseAntithetic] = useState(true);
  const [useControlVariate, setUseControlVariate] = useState(true);

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const config: SimulationConfig = {
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    numPaths,
    numSteps,
    optionType,
    asianOption,
    useAntithetic,
    useControlVariate,
  };

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setProgress(0);

    // Run simulation in a timeout to allow UI to update
    setTimeout(() => {
      const simulationResult = runSimulation(config, (p) => {
        setProgress(p);
      });
      setResult(simulationResult);
      setIsRunning(false);
      setProgress(1);
    }, 50);
  }, [config]);

  const handleReset = useCallback(() => {
    setResult(null);
    setProgress(0);
    setIsRunning(false);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[hsl(var(--primary))]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Monte Carlo Pricer
                </h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Options pricing via stochastic simulation
                </p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Parameters */}
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Parameters
              </h2>
              <div className="space-y-5">
                <InputSlider
                  label="Spot Price"
                  value={spotPrice}
                  onChange={setSpotPrice}
                  min={1}
                  max={500}
                  step={1}
                  unit="$"
                  tooltip="Current market price of the underlying asset"
                  disabled={isRunning}
                />
                <InputSlider
                  label="Strike Price"
                  value={strikePrice}
                  onChange={setStrikePrice}
                  min={1}
                  max={500}
                  step={1}
                  unit="$"
                  tooltip="Price at which the option can be exercised"
                  disabled={isRunning}
                />
                <InputSlider
                  label="Time to Expiry"
                  value={timeToExpiry}
                  onChange={setTimeToExpiry}
                  min={0.01}
                  max={2}
                  step={0.01}
                  unit="yrs"
                  tooltip="Time remaining until option expiration"
                  disabled={isRunning}
                />
                <InputSlider
                  label="Risk-Free Rate"
                  value={riskFreeRate * 100}
                  onChange={(v) => setRiskFreeRate(v / 100)}
                  min={0}
                  max={15}
                  step={0.1}
                  unit="%"
                  tooltip="Annualized risk-free interest rate"
                  disabled={isRunning}
                />
                <InputSlider
                  label="Volatility"
                  value={volatility * 100}
                  onChange={(v) => setVolatility(v / 100)}
                  min={1}
                  max={100}
                  step={1}
                  unit="%"
                  tooltip="Annualized implied volatility"
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Simulation Settings */}
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
                Simulation Settings
              </h2>
              <div className="space-y-5">
                <InputSlider
                  label="Number of Paths"
                  value={numPaths}
                  onChange={setNumPaths}
                  min={1000}
                  max={100000}
                  step={1000}
                  tooltip="More paths = more accurate but slower"
                  disabled={isRunning}
                />
                <InputSlider
                  label="Time Steps"
                  value={numSteps}
                  onChange={setNumSteps}
                  min={10}
                  max={200}
                  step={10}
                  tooltip="Steps per path (affects path smoothness)"
                  disabled={isRunning}
                />

                {/* Option Type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOptionType('call')}
                    disabled={isRunning}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      optionType === 'call'
                        ? 'bg-[hsl(var(--success))] text-white'
                        : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Call
                  </button>
                  <button
                    onClick={() => setOptionType('put')}
                    disabled={isRunning}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      optionType === 'put'
                        ? 'bg-[hsl(var(--destructive))] text-white'
                        : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Put
                  </button>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={asianOption}
                      onChange={(e) => setAsianOption(e.target.checked)}
                      disabled={isRunning}
                      className="w-4 h-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))] disabled:opacity-50"
                    />
                    <span className="text-sm text-[hsl(var(--foreground))]">
                      Asian Option (average price)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAntithetic}
                      onChange={(e) => setUseAntithetic(e.target.checked)}
                      disabled={isRunning}
                      className="w-4 h-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))] disabled:opacity-50"
                    />
                    <span className="text-sm text-[hsl(var(--foreground))]">
                      Antithetic Variates
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useControlVariate}
                      onChange={(e) => setUseControlVariate(e.target.checked)}
                      disabled={isRunning || asianOption}
                      className="w-4 h-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))] disabled:opacity-50"
                    />
                    <span className={`text-sm ${asianOption ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--foreground))]'}`}>
                      Control Variates
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Run Controls */}
            <div className="flex gap-3">
              <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Simulation
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={isRunning}
                className="p-3 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 text-[hsl(var(--foreground))] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            {isRunning && (
              <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                <div
                  className="h-full progress-bar transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Right Panel - Visualizations */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Panel */}
            <StatsPanel result={result} isRunning={isRunning} asianOption={asianOption} />

            {/* Price Paths */}
            <PathVisualization
              paths={result?.paths || []}
              spotPrice={spotPrice}
              strikePrice={strikePrice}
              isAnimating={isRunning}
            />

            {/* Terminal Price Distribution */}
            <HistogramChart
              terminalPrices={result?.terminalPrices || []}
              strikePrice={strikePrice}
              optionType={optionType}
            />

            {/* Convergence Chart */}
            <ConvergenceChart
              convergenceData={result?.convergenceData || []}
              blackScholesPrice={result?.blackScholesPrice || 0}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <p>Monte Carlo Options Pricer — Educational purposes only</p>
            <p>
              Made by{' '}
              <a 
                href="https://github.com/sharziki" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[hsl(var(--primary))] hover:underline"
              >
                Sharvil Saxena
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

import type { SimulationResult } from '../lib/monteCarlo';

interface StatsPanelProps {
  result: SimulationResult | null;
  isRunning: boolean;
  asianOption: boolean;
}

export function StatsPanel({ result, isRunning, asianOption }: StatsPanelProps) {
  if (!result) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Simulation Results
        </h2>
        <div className="h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          {isRunning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
              <span>Running simulation...</span>
            </div>
          ) : (
            'Run simulation to see results'
          )}
        </div>
      </div>
    );
  }

  const {
    optionPrice,
    standardError,
    confidenceInterval95,
    confidenceInterval99,
    blackScholesPrice,
    paths,
    payoffs,
  } = result;

  const priceDiff = optionPrice - blackScholesPrice;
  const priceDiffPercent = (priceDiff / blackScholesPrice) * 100;

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Simulation Results
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--primary))]">
            <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-pulse" />
            Simulating...
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Monte Carlo Price */}
        <div className="col-span-2 bg-[hsl(var(--background))] rounded-lg p-4 text-center">
          <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
            Monte Carlo Price
          </div>
          <div className="text-3xl font-bold text-[hsl(var(--primary))]">
            ${optionPrice.toFixed(4)}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            SE: ±${standardError.toFixed(4)}
          </div>
        </div>

        {/* Black-Scholes Comparison */}
        {!asianOption && (
          <div className="bg-[hsl(var(--background))] rounded-lg p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
              Black-Scholes
            </div>
            <div className="text-xl font-semibold text-[hsl(var(--success))]">
              ${blackScholesPrice.toFixed(4)}
            </div>
            <div className={`text-xs mt-1 ${Math.abs(priceDiffPercent) < 1 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>
              Diff: {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(4)} ({priceDiffPercent >= 0 ? '+' : ''}{priceDiffPercent.toFixed(2)}%)
            </div>
          </div>
        )}

        {/* 95% CI */}
        <div className="bg-[hsl(var(--background))] rounded-lg p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
            95% Confidence Interval
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            ${confidenceInterval95[0].toFixed(4)}
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            ${confidenceInterval95[1].toFixed(4)}
          </div>
        </div>

        {/* 99% CI */}
        <div className="bg-[hsl(var(--background))] rounded-lg p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
            99% Confidence Interval
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            ${confidenceInterval99[0].toFixed(4)}
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            ${confidenceInterval99[1].toFixed(4)}
          </div>
        </div>

        {/* Simulation Stats */}
        <div className="bg-[hsl(var(--background))] rounded-lg p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
            Paths Simulated
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            {payoffs.length.toLocaleString()}
          </div>
        </div>

        <div className="bg-[hsl(var(--background))] rounded-lg p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
            Paths Displayed
          </div>
          <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
            {paths.length.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

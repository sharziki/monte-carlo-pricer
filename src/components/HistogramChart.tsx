import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import { calculateStatistics } from '../lib/monteCarlo';

interface HistogramChartProps {
  terminalPrices: number[];
  strikePrice: number;
  optionType: 'call' | 'put';
}

export function HistogramChart({ terminalPrices, strikePrice, optionType }: HistogramChartProps) {
  if (terminalPrices.length === 0) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Terminal Price Distribution
        </h2>
        <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          Run simulation to see distribution
        </div>
      </div>
    );
  }

  const stats = calculateStatistics(terminalPrices);

  // Calculate ITM percentage
  const itmCount = terminalPrices.filter(p =>
    optionType === 'call' ? p > strikePrice : p < strikePrice
  ).length;
  const itmPercentage = (itmCount / terminalPrices.length * 100).toFixed(1);

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Terminal Price Distribution
        </h2>
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          {itmPercentage}% in-the-money
        </div>
      </div>

      <Plot
        data={[
          {
            x: terminalPrices,
            type: 'histogram',
            nbinsx: 50,
            marker: {
              color: 'rgba(168, 85, 247, 0.6)',
              line: {
                color: 'rgba(168, 85, 247, 0.8)',
                width: 1,
              },
            },
            hovertemplate: 'Price: $%{x:.2f}<br>Count: %{y}<extra></extra>',
          } as Data,
        ]}
        layout={{
          autosize: true,
          height: 300,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 50, r: 20, t: 20, b: 50 },
          xaxis: {
            title: { text: 'Terminal Price ($)', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            tickfont: { color: 'rgb(156, 163, 175)' },
          },
          yaxis: {
            title: { text: 'Frequency', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            tickfont: { color: 'rgb(156, 163, 175)' },
          },
          shapes: [
            {
              type: 'line',
              x0: strikePrice,
              x1: strikePrice,
              y0: 0,
              y1: 1,
              yref: 'paper',
              line: { color: 'rgb(239, 68, 68)', width: 2, dash: 'dash' },
            },
            {
              type: 'line',
              x0: stats.mean,
              x1: stats.mean,
              y0: 0,
              y1: 1,
              yref: 'paper',
              line: { color: 'rgb(59, 130, 246)', width: 2 },
            },
          ],
          annotations: [
            {
              x: strikePrice,
              y: 1,
              yref: 'paper',
              text: 'Strike',
              showarrow: false,
              font: { color: 'rgb(239, 68, 68)', size: 10 },
              yanchor: 'bottom',
            },
            {
              x: stats.mean,
              y: 1,
              yref: 'paper',
              text: 'Mean',
              showarrow: false,
              font: { color: 'rgb(59, 130, 246)', size: 10 },
              yanchor: 'bottom',
            },
          ],
        }}
        config={{
          displayModeBar: false,
        }}
        style={{ width: '100%' }}
      />

      <div className="grid grid-cols-4 gap-4 mt-4 text-center">
        <div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Mean</div>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
            ${stats.mean.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Std Dev</div>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
            ${stats.stdDev.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Min</div>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
            ${stats.min.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Max</div>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
            ${stats.max.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

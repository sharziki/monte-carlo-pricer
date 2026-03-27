import Plot from 'react-plotly.js';

interface ConvergenceDataPoint {
  numPaths: number;
  price: number;
  stdError: number;
}

interface ConvergenceChartProps {
  convergenceData: ConvergenceDataPoint[];
  blackScholesPrice: number;
}

export function ConvergenceChart({
  convergenceData,
  blackScholesPrice,
}: ConvergenceChartProps) {
  if (convergenceData.length === 0) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Price Convergence
        </h2>
        <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          Run simulation to see convergence
        </div>
      </div>
    );
  }

  const prices = convergenceData.map((d) => d.price);
  const numPaths = convergenceData.map((d) => d.numPaths);
  const upperBound = convergenceData.map((d) => d.price + 1.96 * d.stdError);
  const lowerBound = convergenceData.map((d) => d.price - 1.96 * d.stdError);

  const finalPrice = prices[prices.length - 1];
  const finalError = convergenceData[convergenceData.length - 1].stdError;
  const errorPercent = ((finalError / finalPrice) * 100).toFixed(2);
  const bsDiff = ((finalPrice - blackScholesPrice) / blackScholesPrice * 100).toFixed(2);

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Price Convergence
        </h2>
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Error: {errorPercent}% | vs BS: {bsDiff}%
        </div>
      </div>

      <Plot
        data={[
          // Confidence band (filled area)
          {
            x: [...numPaths, ...numPaths.slice().reverse()],
            y: [...upperBound, ...lowerBound.slice().reverse()],
            fill: 'toself',
            fillcolor: 'rgba(168, 85, 247, 0.15)',
            line: { color: 'transparent' },
            type: 'scatter',
            mode: 'lines',
            hoverinfo: 'skip',
            showlegend: false,
          },
          // Monte Carlo price line
          {
            x: numPaths,
            y: prices,
            type: 'scatter',
            mode: 'lines',
            name: 'Monte Carlo',
            line: {
              color: 'rgb(168, 85, 247)',
              width: 2,
            },
            hovertemplate: 'Paths: %{x}<br>Price: $%{y:.4f}<extra></extra>',
          },
          // Black-Scholes reference line
          {
            x: [numPaths[0], numPaths[numPaths.length - 1]],
            y: [blackScholesPrice, blackScholesPrice],
            type: 'scatter',
            mode: 'lines',
            name: 'Black-Scholes',
            line: {
              color: 'rgb(34, 197, 94)',
              width: 2,
              dash: 'dash',
            },
            hovertemplate: 'Black-Scholes: $%{y:.4f}<extra></extra>',
          },
        ]}
        layout={{
          autosize: true,
          height: 300,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 60, r: 20, t: 20, b: 50 },
          xaxis: {
            title: { text: 'Number of Paths', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            tickfont: { color: 'rgb(156, 163, 175)' },
            type: 'log',
          },
          yaxis: {
            title: { text: 'Option Price ($)', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            tickfont: { color: 'rgb(156, 163, 175)' },
          },
          legend: {
            x: 1,
            y: 1,
            xanchor: 'right',
            yanchor: 'top',
            bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'rgb(156, 163, 175)', size: 11 },
          },
          showlegend: true,
        }}
        config={{
          displayModeBar: false,
        }}
        style={{ width: '100%' }}
      />

      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 text-center">
        Shaded area shows 95% confidence interval. Price converges to Black-Scholes as paths increase.
      </p>
    </div>
  );
}

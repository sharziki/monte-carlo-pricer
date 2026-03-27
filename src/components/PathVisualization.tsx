import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import type { SimulationPath } from '../lib/monteCarlo';

interface PathVisualizationProps {
  paths: SimulationPath[];
  spotPrice: number;
  strikePrice: number;
  isAnimating: boolean;
}

export function PathVisualization({
  paths,
  spotPrice,
  strikePrice,
  isAnimating
}: PathVisualizationProps) {
  if (paths.length === 0) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Price Paths
        </h2>
        <div className="h-96 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          Run simulation to see price paths
        </div>
      </div>
    );
  }

  // Generate colors with gradient from purple to pink
  const getPathColor = (index: number, total: number): string => {
    const hueStart = 262;
    const hueEnd = 330;
    const hue = hueStart + ((hueEnd - hueStart) * index) / total;
    return `hsla(${hue}, 70%, 60%, 0.3)`;
  };

  const traces: Data[] = paths.map((path, index) => ({
    x: path.times,
    y: path.prices,
    type: 'scatter' as const,
    mode: 'lines' as const,
    line: {
      color: getPathColor(index, paths.length),
      width: 1,
    },
    hoverinfo: 'skip' as const,
    showlegend: false,
  }));

  // Add strike price line
  traces.push({
    x: [0, paths[0]?.times[paths[0].times.length - 1] || 1],
    y: [strikePrice, strikePrice],
    type: 'scatter',
    mode: 'lines',
    line: {
      color: 'rgb(239, 68, 68)',
      width: 2,
      dash: 'dash',
    },
    hoverinfo: 'skip',
    showlegend: false,
  } as Data);

  // Add spot price marker
  traces.push({
    x: [0],
    y: [spotPrice],
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: 'rgb(168, 85, 247)',
      size: 12,
      symbol: 'diamond',
    },
    hoverinfo: 'skip',
    showlegend: false,
  } as Data);

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Simulated Price Paths
        </h2>
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
            <span>{paths.length} paths shown</span>
          </div>
          {isAnimating && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-pulse" />
              <span>Simulating...</span>
            </div>
          )}
        </div>
      </div>

      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 400,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 60, r: 20, t: 20, b: 60 },
          xaxis: {
            title: { text: 'Time (years)', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            zerolinecolor: 'rgb(55, 65, 81)',
            tickfont: { color: 'rgb(156, 163, 175)' },
          },
          yaxis: {
            title: { text: 'Price ($)', font: { color: 'rgb(156, 163, 175)' } },
            gridcolor: 'rgba(55, 65, 81, 0.5)',
            zerolinecolor: 'rgb(55, 65, 81)',
            tickfont: { color: 'rgb(156, 163, 175)' },
          },
          annotations: [
            {
              x: paths[0]?.times[paths[0].times.length - 1] || 1,
              y: strikePrice,
              xanchor: 'right',
              yanchor: 'bottom',
              text: `Strike: $${strikePrice}`,
              showarrow: false,
              font: { color: 'rgb(239, 68, 68)', size: 11 },
            },
          ],
        }}
        config={{
          displayModeBar: false,
        }}
        style={{ width: '100%' }}
      />

      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 text-center">
        Each path represents a potential price trajectory under Geometric Brownian Motion
      </p>
    </div>
  );
}

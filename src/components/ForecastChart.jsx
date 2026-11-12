import React, { useState } from 'react';
export const ForecastChart = ({ historicalRecords, forecastPoints, config, threshold, horizonMinutes, samplingIntervalMinutes, empiricalCoveragePct, }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    // We display the last 30 historical points + the forecast horizon points
    const displayHistory = historicalRecords.slice(-32);
    const displayForecast = forecastPoints.slice(-16);
    if (displayHistory.length === 0) {
        return (<div className="h-72 flex items-center justify-center text-slate-400 text-sm">
        No valid telemetry data available to plot.
      </div>);
    }
    // Combine for scale calculation
    const allYValues = [
        threshold,
        ...displayHistory.map(r => (config.id === 'nox' ? r.noxMeasured : config.id === 'so2' ? r.so2Measured : r.pmMeasured)),
        ...displayForecast.map(f => f.predictedValue),
        ...displayForecast.map(f => f.intervalUpper),
        ...displayForecast.map(f => f.intervalLower),
    ].filter(v => typeof v === 'number' && !isNaN(v));
    const minY = Math.max(0, Math.floor(Math.min(...allYValues) * 0.9));
    const maxY = Math.ceil(Math.max(...allYValues) * 1.1);
    const yRange = maxY - minY || 100;
    // SVG dimensions
    const svgWidth = 900;
    const svgHeight = 320;
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 25;
    const paddingBottom = 45;
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    const totalPoints = displayHistory.length + displayForecast.length;
    const stepX = chartWidth / (totalPoints - 1 || 1);
    const getYPos = (val) => {
        return paddingTop + chartHeight - ((val - minY) / yRange) * chartHeight;
    };
    const getXPos = (index) => {
        return paddingLeft + index * stepX;
    };
    // Build SVG path for history
    const historyCoords = displayHistory.map((r, i) => {
        const val = config.id === 'nox' ? r.noxMeasured : config.id === 'so2' ? r.so2Measured : r.pmMeasured;
        return { x: getXPos(i), y: getYPos(val), val, raw: r };
    });
    const historyPath = historyCoords.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    // Boundary index is the end of history
    const boundaryIndex = displayHistory.length - 1;
    const boundaryX = getXPos(boundaryIndex);
    // Forecast coordinates (starting from boundary point for continuity)
    const lastHistoryPoint = historyCoords[historyCoords.length - 1];
    const forecastCoords = displayForecast.map((f, i) => {
        const x = getXPos(boundaryIndex + 1 + i);
        return {
            x,
            y: getYPos(f.predictedValue),
            yLower: getYPos(f.intervalLower),
            yUpper: getYPos(f.intervalUpper),
            forecast: f,
        };
    });
    const allForecastPoints = [
        {
            x: lastHistoryPoint.x,
            y: lastHistoryPoint.y,
            yLower: lastHistoryPoint.y,
            yUpper: lastHistoryPoint.y,
            forecast: null,
        },
        ...forecastCoords,
    ];
    const forecastPath = allForecastPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    // Prediction interval polygon
    const upperPath = allForecastPoints.map(p => `${p.x},${p.yUpper}`).join(' ');
    const lowerPath = [...allForecastPoints].reverse().map(p => `${p.x},${p.yLower}`).join(' ');
    const intervalPolygon = `${upperPath} ${lowerPath}`;
    // Threshold Y
    const thresholdY = getYPos(threshold);
    // Y-axis tick values (4 steps)
    const yTicks = [
        minY,
        minY + Math.round(yRange * 0.33),
        minY + Math.round(yRange * 0.66),
        maxY,
    ];
    return (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
      {/* Chart Top Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              Actual vs Forecast Concentration Trend
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              +{horizonMinutes}m Horizon
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Solid line shows verified CEMS history. Shaded cone illustrates 90% conformal prediction interval (Evaluated coverage: {empiricalCoveragePct}%).
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-blue-600 rounded"></span>
            <span className="text-slate-600">Historical CEMS Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-emerald-600 rounded"></span>
            <span className="text-slate-700 font-medium">ML Ensemble Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 bg-emerald-100/70 border border-emerald-300 rounded-xs"></span>
            <span className="text-slate-600">90% Prediction Interval</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-red-500"></span>
            <span className="text-red-700 font-semibold">
              Threshold ({threshold} {config.units})
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[650px] select-none">
          <defs>
            <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.06"/>
            </linearGradient>
            <linearGradient id="historyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(tick => {
            const y = getYPos(tick);
            return (<g key={tick}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3"/>
                <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {tick}
                </text>
              </g>);
        })}

          {/* Forecast Horizon Shaded Background Zone */}
          <rect x={boundaryX} y={paddingTop} width={svgWidth - paddingRight - boundaryX} height={chartHeight} fill="#f0fdf4" opacity="0.45"/>

          {/* Forecast Boundary Line at t0 */}
          <line x1={boundaryX} y1={paddingTop} x2={boundaryX} y2={paddingTop + chartHeight} stroke="#0f766e" strokeWidth="1.75" strokeDasharray="4 2"/>
          <text x={boundaryX - 6} y={paddingTop + 14} textAnchor="end" className="text-[10px] font-mono fill-teal-800 font-bold">
            Issue Time t₀
          </text>
          <text x={boundaryX + 6} y={paddingTop + 14} textAnchor="start" className="text-[10px] font-mono fill-emerald-800 font-bold">
            Future Forecast &gt;&gt;
          </text>

          {/* Internal Warning Threshold Line */}
          <line x1={paddingLeft} y1={thresholdY} x2={svgWidth - paddingRight} y2={thresholdY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 4"/>
          <text x={svgWidth - paddingRight - 4} y={thresholdY - 5} textAnchor="end" className="text-[10px] font-mono fill-red-600 font-bold">
            Warning Limit: {threshold} {config.units}
          </text>

          {/* 90% Prediction Interval Polygon */}
          <polygon points={intervalPolygon} fill="url(#forecastBandGrad)" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2"/>

          {/* Historical CEMS Actual Path */}
          <path d={historyPath} fill="none" stroke="#2563eb" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Historical Data Points */}
          {historyCoords.map((pt, i) => (<circle key={i} cx={pt.x} cy={pt.y} r={i === historyCoords.length - 1 ? 4.5 : 2} fill={i === historyCoords.length - 1 ? '#1d4ed8' : '#3b82f6'} stroke="#ffffff" strokeWidth="1.5"/>))}

          {/* Forecast Path */}
          <path d={forecastPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Forecast Dots */}
          {forecastCoords.map((pt, i) => {
            const isExceed = pt.forecast.predictedValue >= threshold;
            return (<circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill={isExceed ? '#dc2626' : '#10b981'} stroke="#ffffff" strokeWidth="1.5"/>);
        })}

          {/* X-axis baseline */}
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight} stroke="#cbd5e1" strokeWidth="1"/>

          {/* X-axis labels */}
          <text x={paddingLeft} y={paddingTop + chartHeight + 16} className="text-[10px] fill-slate-500 font-mono">
            {displayHistory[0]?.timestamp.slice(11, 16)}
          </text>
          <text x={boundaryX} y={paddingTop + chartHeight + 16} textAnchor="middle" className="text-[10px] fill-slate-700 font-mono font-bold">
            {displayHistory[displayHistory.length - 1]?.timestamp.slice(11, 16)} (Now)
          </text>
          <text x={svgWidth - paddingRight} y={paddingTop + chartHeight + 16} textAnchor="end" className="text-[10px] fill-emerald-700 font-mono font-bold">
            +{horizonMinutes}m Target
          </text>
        </svg>
      </div>

      {/* Axis Unit Sub-label */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 px-2">
        <span>Y-axis: Concentration ({config.units} @ 6% O2 dry)</span>
        <span>X-axis: Plant SCADA Time (UTC+8)</span>
      </div>
    </div>);
};

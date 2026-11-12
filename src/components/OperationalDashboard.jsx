import React from 'react';
import { Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Gauge, CheckCircle2, FileDown, Info, } from 'lucide-react';
import { ForecastChart } from './ForecastChart';
import { exportForecastPointsToCsv, downloadFile } from '../utils/csvExport';
export const OperationalDashboard = ({ currentRecord, latestForecast, historicalRecords, forecastPoints, config, threshold, horizonMinutes, samplingIntervalMinutes, featureAssociations, empiricalCoveragePct, }) => {
    if (!currentRecord || !latestForecast) {
        return (<div className="p-8 text-center text-slate-500">
        Initializing operational combustion telemetry...
      </div>);
    }
    const currentPollutantVal = config.id === 'nox'
        ? currentRecord.noxMeasured
        : config.id === 'so2'
            ? currentRecord.so2Measured
            : currentRecord.pmMeasured;
    const predictedVal = latestForecast.predictedValue;
    const delta = predictedVal - currentPollutantVal;
    const isRising = delta > 0;
    const isExceeding = predictedVal >= threshold;
    const isWatch = !isExceeding && predictedVal >= threshold * 0.88;
    const handleExportCsv = () => {
        const csv = exportForecastPointsToCsv(forecastPoints, config.name);
        downloadFile(`cems_forecast_${config.id}_${horizonMinutes}m.csv`, csv);
    };
    return (<div className="space-y-6">
      {/* 4 Primary Key Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Current Measured Stack CEMS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Current CEMS Measured</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                VALID
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {currentPollutantVal.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500">{config.units}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Normalized @ 6% O2 dry basis
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Source Time:</span>
            <span className="font-semibold text-slate-700">
              {currentRecord.timestamp.slice(11, 16)} UTC+8
            </span>
          </div>
        </div>

        {/* Card 2: Predicted Future Emission */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">
                Predicted (+{horizonMinutes}m Ahead)
              </span>
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                ML ENSEMBLE
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight font-mono">
                {predictedVal.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500">{config.units}</span>
              <span className={`ml-auto inline-flex items-center text-xs font-bold font-mono ${isRising ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isRising ? (<ArrowUpRight className="w-3.5 h-3.5"/>) : (<ArrowDownRight className="w-3.5 h-3.5"/>)}
                {Math.abs(delta).toFixed(1)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              90% Interval: [{latestForecast.intervalLower.toFixed(1)} - {latestForecast.intervalUpper.toFixed(1)}]
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Target Time:</span>
            <span className="font-semibold text-blue-700">
              {latestForecast.targetTimestamp.slice(11, 16)} UTC+8
            </span>
          </div>
        </div>

        {/* Card 3: Rolling Average vs Threshold */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">
                Rolling Forecast vs Limit
              </span>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {config.averagingPeriodMinutes}m Window
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                {latestForecast.predictedRollingAvg.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {threshold} {config.units}
              </span>
            </div>
            {/* Progress Bar towards limit */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${isExceeding ? 'bg-red-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{
            width: `${Math.min(100, (latestForecast.predictedRollingAvg / threshold) * 100)}%`,
        }}></div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Buffer to Threshold:</span>
            <span className={`font-mono font-bold ${threshold - predictedVal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {(threshold - predictedVal).toFixed(1)} {config.units}
            </span>
          </div>
        </div>

        {/* Card 4: Advisory Operational Warning Status */}
        <div className={`rounded-xl border shadow-xs p-4 flex flex-col justify-between ${isExceeding
            ? 'bg-red-50/80 border-red-300'
            : isWatch
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-emerald-50/70 border-emerald-300'}`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-semibold uppercase tracking-wider ${isExceeding ? 'text-red-800' : isWatch ? 'text-amber-800' : 'text-emerald-800'}`}>
                Advisory Early Warning
              </span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded uppercase ${isExceeding
            ? 'bg-red-600 text-white'
            : isWatch
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 text-white'}`}>
                {isExceeding ? 'WARNING' : isWatch ? 'WATCH' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-2 text-xs font-medium leading-snug">
              {isExceeding ? (<span className="text-red-900 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0"/>
                  Potential threshold exceedance in ~{horizonMinutes} min.
                </span>) : isWatch ? (<span className="text-amber-900 font-medium">
                  Emissions within 12% of warning limit. Monitor SOFA air staging.
                </span>) : (<span className="text-emerald-900 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
                  Operating comfortably within internal warning margin.
                </span>)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Lead Time:</span>
            <span className="font-mono font-semibold text-slate-800">
              {isExceeding ? `+${horizonMinutes}m early warning` : 'Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Time Series Trend Chart */}
      <ForecastChart historicalRecords={historicalRecords} forecastPoints={forecastPoints} config={config} threshold={threshold} horizonMinutes={horizonMinutes} samplingIntervalMinutes={samplingIntervalMinutes} empiricalCoveragePct={empiricalCoveragePct}/>

      {/* Two Columns: Boiler Combustion Telemetry at t0 + Feature Associations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Boiler Combustion & Operating Telemetry at Cutoff t0 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600"/>
              <h3 className="text-sm font-bold text-slate-800">
                Boiler Operating Telemetry at Forecast Issue Time (t₀)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Unit 1 (600 MW)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unit Load</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.unitLoadMw}</span>
              <span className="text-[10px] text-slate-500 ml-1">MW</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Coal Feed</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.coalFeedRateTph}</span>
              <span className="text-[10px] text-slate-500 ml-1">t/h</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Flue Gas O2</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.flueGasO2Pct}</span>
              <span className="text-[10px] text-slate-500 ml-1">% dry</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Furnace FEGT</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.furnaceExitGasTempC}</span>
              <span className="text-[10px] text-slate-500 ml-1">°C</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">SOFA Damper</span>
              <span className="font-mono text-base font-bold text-blue-700">{currentRecord.sofaDamperPct}</span>
              <span className="text-[10px] text-slate-500 ml-1">%</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">SCR NH3 Flow</span>
              <span className="font-mono text-base font-bold text-emerald-700">{currentRecord.ammoniaFlowKgH}</span>
              <span className="text-[10px] text-slate-500 ml-1">kg/h</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Coal Sulfur (Lab)</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.usableCoalSulfurPct.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 ml-1">% (lagged)</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Combustion Air</span>
              <span className="font-mono text-base font-bold text-slate-800">{currentRecord.totalCombustionAirFlow}</span>
              <span className="text-[10px] text-slate-500 ml-1">kNm³/h</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50/70 rounded-lg border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
            <div>
              <span className="font-semibold">Point-in-Time Causality Enforced:</span> All combustion inputs and lagged emissions used by the model are strictly from cutoff timestamp <code className="bg-amber-100/60 px-1 rounded font-mono font-bold">{currentRecord.timestamp.slice(11, 16)} UTC+8</code> or earlier. No future readings are used in generating the forecast.
            </div>
          </div>
        </div>

        {/* Right: Feature Associations Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600"/>
              <h3 className="text-sm font-bold text-slate-800">
                Operating Input Associations (Influential Drivers)
              </h3>
            </div>
            <button onClick={handleExportCsv} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Export all forecast points to CSV">
              <FileDown className="w-3.5 h-3.5 text-slate-500"/>
              <span>Export CSV</span>
            </button>
          </div>

          {/* Feature Importance Bars */}
          <div className="space-y-2.5">
            {featureAssociations.slice(0, 5).map((feat, idx) => (<div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-4 h-4 rounded bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{feat.label}</span>
                    <span className="text-[10px] text-slate-400">({feat.unit})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${feat.correlationDirection === 'positive'
                ? 'text-amber-700 bg-amber-50'
                : 'text-emerald-700 bg-emerald-50'}`}>
                      {feat.correlationDirection === 'positive' ? 'Direct (+)' : 'Inverse (-)'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      {(feat.importanceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, feat.importanceScore * 300)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 italic pl-5">
                  {feat.engineeringRationale}
                </p>
              </div>))}
          </div>

          <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-500">
            <strong>Engineering Notice:</strong> Influential inputs are presented as <em>statistical associations</em> within the ensemble tree splits, not proven direct physical causes. Physical causality must be verified via boiler thermodynamic balance.
          </div>
        </div>
      </div>
    </div>);
};

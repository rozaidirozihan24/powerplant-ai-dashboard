import React, { useRef, useState } from 'react';
import { Clock, Upload, Info, Sliders, AlertCircle, FileSpreadsheet, } from 'lucide-react';
import { POLLUTANT_CONFIGS } from '../utils/demoData';
export const ControlBar = ({ selectedPollutant, onSelectPollutant, selectedHorizon, onSelectHorizon, supportedHorizons, samplingIntervalMinutes, currentThreshold, averagingPeriodMinutes, onOpenThresholdModal, onUploadCsv, isProcessingUpload, uploadError, }) => {
    const fileInputRef = useRef(null);
    const [showBasisModal, setShowBasisModal] = useState(false);
    const config = POLLUTANT_CONFIGS[selectedPollutant];
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUploadCsv(e.target.files[0]);
        }
    };
    return (<div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Stack & Pollutant Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Pollutant:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                {['nox', 'so2', 'pm'].map(pollutantId => {
            const pConfig = POLLUTANT_CONFIGS[pollutantId];
            const isActive = selectedPollutant === pollutantId;
            return (<button key={pollutantId} onClick={() => onSelectPollutant(pollutantId)} className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${isActive
                    ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'}`}>
                      <span>{pConfig.chemicalFormula}</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                        ({pollutantId.toUpperCase()})
                      </span>
                    </button>);
        })}
              </div>
            </div>

            {/* Reporting Basis Confirmation Button */}
            <button onClick={() => setShowBasisModal(true)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition" title="Confirm reporting basis, standard conditions, and units">
              <Info className="w-3.5 h-3.5 text-blue-600"/>
              <span>Reporting Basis</span>
            </button>
          </div>

          {/* Horizon Selection with Dynamic Sampling Rate Guard */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400"/>
                Horizon:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                {[15, 30, 60].map(horizon => {
            const isSupported = supportedHorizons.includes(horizon);
            const isSelected = selectedHorizon === horizon;
            return (<button key={horizon} disabled={!isSupported} onClick={() => onSelectHorizon(horizon)} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isSupported
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-slate-300 cursor-not-allowed line-through'}`} title={isSupported
                    ? `Forecast ${horizon} minutes ahead of issue time`
                    : `Disabled: Requires data sampling interval ≤ ${horizon} minutes (current is ${samplingIntervalMinutes}m)`}>
                      +{horizon} min
                    </button>);
        })}
              </div>
            </div>

            {/* Sampling Interval Badge */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span className="text-slate-400">Δt:</span>
              <span className="font-semibold text-slate-700">{samplingIntervalMinutes}m interval</span>
            </div>

            {/* Threshold & Averaging Settings Trigger */}
            <button onClick={onOpenThresholdModal} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition">
              <Sliders className="w-3.5 h-3.5 text-amber-600"/>
              <span>
                Threshold: {currentThreshold} {config.units} ({averagingPeriodMinutes}m roll)
              </span>
            </button>

            {/* CSV Upload Button */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden"/>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessingUpload} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition">
              <Upload className="w-3.5 h-3.5 text-emerald-200"/>
              <span>{isProcessingUpload ? 'Parsing CSV...' : 'Upload CEMS CSV'}</span>
            </button>
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (<div className="mt-2.5 p-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0"/>
            <span>{uploadError}</span>
          </div>)}
      </div>

      {/* Reporting Basis Modal */}
      {showBasisModal && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600"/>
                <h3 className="font-bold text-slate-900 text-base">
                  CEMS Reporting Basis & Standard Conditions
                </h3>
              </div>
              <button onClick={() => setShowBasisModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                <span className="font-semibold text-blue-900 block mb-1">
                  Active Pollutant: {config.name} ({config.chemicalFormula})
                </span>
                <p className="text-blue-800">{config.reportingBasis}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Physical & Engineering Guardrails:
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Chemical Identity Confirmation:</strong> Model predictions for NOx represent <strong>NO2 equivalent</strong>. Do not confuse SO2 with total SOx, or optical opacity (%) with gravimetric PM concentration (mg/Nm³).
                  </li>
                  <li>
                    <strong>O2 Normalization:</strong> Normalized to <strong>6% O2 dry basis</strong> using formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">C_norm = C_meas × (21 - 6) / (21 - O2_meas)</code>.
                  </li>
                  <li>
                    <strong>Standard Conditions:</strong> 0°C (273.15 K), 101.325 kPa (1 atmosphere).
                  </li>
                  <li>
                    <strong>Concentration vs Mass Emission Rate:</strong> Concentration forecasts (mg/Nm³) are strictly separated from mass emission rate forecasts (kg/h), which require certified flue-gas velocity and volumetric flow telemetry.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setShowBasisModal(false)} className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition">
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};

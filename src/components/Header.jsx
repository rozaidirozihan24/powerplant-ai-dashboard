import React from 'react';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { generateCsvTemplate, downloadFile } from '../utils/csvExport';
export const Header = ({ onResetDemo, activeUnit, activeStack, }) => {
    const handleDownloadTemplate = () => {
        const csvContent = generateCsvTemplate();
        downloadFile('cems_stack_emissions_template.csv', csvContent);
    };
    return (<header className="bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Industrial Banner with Logo and Plant Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shadow-inner overflow-hidden border border-slate-200">
            <img src="/assets/aistudio/image_b8c706d2.png" alt="Power Plant Utility Logo" className="w-full h-full object-contain"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                {activeUnit} • {activeStack}
              </span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Synthetic CEMS Demo
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-50 tracking-tight leading-snug">
              Short-Term Prediction of Stack Emissions for Early Operational Warning
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Tanjung Bin Thermal Power Station • 600 MW Supercritical Pulverized Coal Boiler
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition" title="Download standardized CEMS Excel/CSV upload template">
            <Download className="w-3.5 h-3.5 text-blue-400"/>
            <span>CEMS Template</span>
          </button>
          <button onClick={onResetDemo} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition" title="Reload 5-day realistic synthetic plant dataset">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400"/>
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Mandatory Safety & Regulatory Disclaimer Banner */}
      <div className="bg-amber-950/90 border-y border-amber-800/80 px-4 sm:px-6 lg:px-8 py-2 text-amber-200 text-xs">
        <div className="max-w-7xl mx-auto flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300 uppercase tracking-wide mr-1.5">
              Operational Safety & Regulatory Boundary:
            </span>
            This application is an internal advisory forecasting prototype for early operator awareness. It does <strong>not</strong> have regulatory approval and does <strong>not</strong> replace Continuous Emission Monitoring Systems (CEMS). Forecasts are strictly advisory and do not automatically alter Distributed Control System (DCS) actuator settings.
          </div>
        </div>
      </div>
    </header>);
};

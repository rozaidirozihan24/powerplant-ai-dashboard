import React, { useState } from 'react';
import { Sliders, Info, Check } from 'lucide-react';
export const ThresholdModal = ({ config, currentThreshold, currentAveragingMinutes, onSave, onClose, }) => {
    const [threshold, setThreshold] = useState(currentThreshold);
    const [averagingMinutes, setAveragingMinutes] = useState(currentAveragingMinutes);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(threshold, averagingMinutes);
        onClose();
    };
    return (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600"/>
            <h3 className="font-bold text-slate-900 text-base">
              Configure Internal Warning Threshold
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Warning Concentration Threshold ({config.units})
            </label>
            <div className="relative">
              <input type="number" min="10" max="1000" step="5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"/>
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                {config.units}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Default operational margin for {config.name}: {config.defaultThreshold} {config.units}.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Compliance Averaging Period
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(mins => (<button type="button" key={mins} onClick={() => setAveragingMinutes(mins)} className={`py-2 text-xs font-semibold rounded-lg border transition ${averagingMinutes === mins
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                  {mins} Minutes
                </button>))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
            <div>
              <strong>Averaging Period Discipline:</strong> When evaluated against an averaging period, the system calculates the <em>predicted rolling average</em> rather than comparing instantaneous peaks with incompatible limits.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5"/>
              <span>Apply Threshold</span>
            </button>
          </div>
        </form>
      </div>
    </div>);
};

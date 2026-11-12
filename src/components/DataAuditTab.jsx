import React, { useState } from 'react';
import { ShieldAlert, FileSpreadsheet, Download, Search, } from 'lucide-react';
import { generateCsvTemplate, downloadFile } from '../utils/csvExport';
export const DataAuditTab = ({ auditTrail, samplingIntervalMinutes, supportedHorizons, totalRawCount, validCount, excludedCount, calibrationsDetected, startupsDetected, }) => {
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const filteredAudit = auditTrail.filter(entry => {
        const matchesCat = filterCategory === 'all' || entry.category === filterCategory;
        const matchesSearch = searchTerm === '' ||
            entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.actionTaken.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });
    const handleDownloadTemplate = () => {
        const csv = generateCsvTemplate();
        downloadFile('cems_stack_emissions_template.csv', csv);
    };
    return (<div className="space-y-6">
      
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Telemetry Sampling Interval
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-slate-800">
              {samplingIntervalMinutes}
            </span>
            <span className="text-xs text-slate-500 font-semibold">minutes</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Supports: {supportedHorizons.map(h => `+${h}m`).join(', ')}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Clean Valid Records
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              {validCount}
            </span>
            <span className="text-xs text-slate-500">/ {totalRawCount}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {((validCount / (totalRawCount || 1)) * 100).toFixed(1)}% usable data
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            CEMS Calibrations Detected
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-amber-600">
              {calibrationsDetected}
            </span>
            <span className="text-xs text-slate-500">periods</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">
            Zero/span drift auto-checks
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Startup/Low-Load Regimes
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-blue-600">
              {startupsDetected}
            </span>
            <span className="text-xs text-slate-500">points</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Load &lt; 240 MW partitioned
          </span>
        </div>
      </div>

      {/* CEMS Column Tag Mapping Guide */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600"/>
              Standardized CEMS & Combustion Telemetry Mapping
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly verifies column formats, reporting units, and laboratory result delivery times.
            </p>
          </div>
          <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition">
            <Download className="w-3.5 h-3.5"/>
            <span>Download Template (.CSV)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-1">
              1. CEMS Emission Tags (mg/Nm³)
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• <code className="font-mono font-bold text-blue-700">nox_measured</code>: NO2 eq. @ 6% O2 dry</li>
              <li>• <code className="font-mono font-bold text-blue-700">so2_measured</code>: Pure SO2 @ 6% O2 dry</li>
              <li>• <code className="font-mono font-bold text-blue-700">pm_measured</code>: Dust gravimetric eq.</li>
              <li>• <code className="font-mono text-amber-700">cems_calib_flag</code>: 1 = span gas injection</li>
              <li>• <code className="font-mono text-amber-700">cems_valid_flag</code>: 1 = healthy analyzer</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-1">
              2. Boiler Combustion Telemetry
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• <code className="font-mono font-bold text-slate-800">unit_load_mw</code>: Generator gross MW</li>
              <li>• <code className="font-mono font-bold text-slate-800">coal_feed_rate_tph</code>: Total coal feed (t/h)</li>
              <li>• <code className="font-mono font-bold text-slate-800">flue_gas_o2_pct_dry</code>: Economizer exit O2</li>
              <li>• <code className="font-mono text-slate-700">sofa_damper_pct</code>: Overfire air staging %</li>
              <li>• <code className="font-mono text-slate-700">scr_ammonia_flow_kgh</code>: DeNOx NH3 feed</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-1">
              3. Delayed Laboratory Analysis
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• <code className="font-mono font-bold text-slate-800">coal_sulfur_pct</code>: Fuel total sulfur</li>
              <li>• <code className="font-mono font-bold text-slate-800">coal_ash_pct</code>: Total proximate ash</li>
              <li>• <code className="font-mono font-bold text-purple-700">lab_result_available_time</code>: Certified certificate issue timestamp</li>
              <li className="text-[11px] text-purple-900 mt-1 italic">
                *Guards against using coal lab results before the certificate is issued!
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filterable Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600"/>
            <h3 className="text-sm font-bold text-slate-800">
              Data Cleansing & Automated Audit Trail Log ({auditTrail.length} Events)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700">
              <option value="all">All Categories</option>
              <option value="CEMS_CALIBRATION">CEMS Calibrations</option>
              <option value="CEMS_INVALID">Analyzer Diagnostic Faults</option>
              <option value="LAB_LATENCY">Lab Turnaround Delays</option>
              <option value="STALE_SENSOR">Stale / Frozen Sensor</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2"/>
              <input type="text" placeholder="Search audit trail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-xs pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 w-44"/>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Audit ID</th>
                <th className="py-2.5 px-4">Timestamp (UTC+8)</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Anomaly Details</th>
                <th className="py-2.5 px-4">Cleansing Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredAudit.length === 0 ? (<tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                    No audit events match the selected criteria.
                  </td>
                </tr>) : (filteredAudit.map((item, idx) => (<tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-700">{item.id}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {item.timestamp.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.severity === 'critical'
                ? 'bg-red-100 text-red-800'
                : item.severity === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">{item.details}</td>
                    <td className="py-2.5 px-4 font-sans text-emerald-800 font-medium">
                      {item.actionTaken}
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
};

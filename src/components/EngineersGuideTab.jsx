import React, { useState } from 'react';
import { BookOpen, Clock, ShieldAlert, Flame, Binary, Layers, BarChart, } from 'lucide-react';
export const EngineersGuideTab = () => {
    const [activeStep, setActiveStep] = useState(1);
    const steps = [
        {
            num: 1,
            title: 'Sampling Intervals & Valid Horizons',
            subtitle: 'Why a 30m sampling interval cannot forecast 15m ahead',
            icon: Clock,
        },
        {
            num: 2,
            title: 'CEMS Quality, Calibrations & Lab Latency',
            subtitle: 'Filtering zero/span gas spikes & respecting coal certificate lag',
            icon: ShieldAlert,
        },
        {
            num: 3,
            title: 'Target Shifting & Anti-Leakage Discipline',
            subtitle: 'Never using future operating readings as inputs',
            icon: Binary,
        },
        {
            num: 4,
            title: 'Reporting Basis & O2 Normalization',
            subtitle: 'Why opacity ≠ PM, and mg/Nm³ @ 6% O2 dry basis matters',
            icon: Flame,
        },
        {
            num: 5,
            title: 'Averaging Periods vs Instantaneous Spikes',
            subtitle: 'Evaluating rolling window compliance accurately',
            icon: Layers,
        },
        {
            num: 6,
            title: 'Model Benchmarking & Warning Metrics',
            subtitle: 'Comparing Persistence, Trend, and Random Forest on test data',
            icon: BarChart,
        },
    ];
    return (<div className="space-y-6">
      
      {/* Intro Hero for Operation Engineers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Plant Operation Engineer's Step-by-Step Implementation Guide
            </h2>
            <p className="text-xs text-slate-500">
              A beginner-friendly practical guide explaining combustion physics, temporal data science, and early warning detection.
            </p>
          </div>
        </div>

        {/* Step Navigation Pill Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
          {steps.map(s => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.num;
            return (<button key={s.num} onClick={() => setActiveStep(s.num)} className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${isCurrent
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {s.num}
                  </span>
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}/>
                </div>
                <span className={`text-xs font-bold leading-snug line-clamp-2 ${isCurrent ? 'text-blue-900' : 'text-slate-700'}`}>
                  {s.title}
                </span>
              </button>);
        })}
        </div>
      </div>

      {/* Step Detail Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        {activeStep === 1 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Understanding Sampling Intervals and Forecast Horizons
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              As a plant engineer, one of the first questions you must answer is: <em>"How frequently does my CEMS data arrive, and how far ahead can I realistically predict?"</em>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 text-sm block mb-1">
                  The Fundamental Sampling Rule:
                </span>
                <p className="text-slate-600 mb-2">
                  A forecasting horizon <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold">H</code> can only be enabled if it is an integer multiple greater than or equal to the telemetry sampling interval <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold">Δt</code>:
                </p>
                <div className="bg-white p-2.5 rounded font-mono text-center border border-slate-200 text-blue-700 font-bold">
                  H ≥ Δt &nbsp;and&nbsp; (H % Δt) == 0
                </div>
                <p className="text-slate-500 mt-2">
                  For example: If your plant's data archive records averages every <strong>30 minutes</strong>, you <em>cannot</em> produce a true 15-minute forecast without fabricating unmeasured sub-interval timestamps.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-200">
                <span className="font-bold text-emerald-950 text-sm block mb-1">
                  Avoiding "Fake Forecasting" (Current Estimation vs Future Prediction):
                </span>
                <p className="text-emerald-900 leading-relaxed">
                  In data science, many models are incorrectly evaluated by feeding current boiler inputs (Load, Air, O2 at time <code className="font-mono">t</code>) to predict emission at the <strong>same</strong> timestamp <code className="font-mono">t</code>. That is <em>virtual sensing</em> or soft-sensor estimation—it is <strong>NOT</strong> forecasting!
                </p>
                <p className="text-emerald-900 font-semibold mt-2">
                  True short-term forecasting predicts the emission state at future time <code className="font-mono">t + 15m</code>, <code className="font-mono">t + 30m</code>, or <code className="font-mono">t + 60m</code> strictly using telemetry known up to time <code className="font-mono">t</code>.
                </p>
              </div>
            </div>
          </div>)}

        {activeStep === 2 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900">
                CEMS Quality Cleansing, Daily Calibrations & Lab Latency
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Industrial stack telemetry is imperfect. Continuous Emission Monitoring Systems (CEMS) undergo automated calibration cycles, purging, and filter blowbacks.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-950">
                <span className="font-bold block mb-1">
                  1. Zero and Span Drift Calibration Checks (cems_calib_flag = 1):
                </span>
                <p>
                  Every 24 hours (commonly at 02:00 AM), certified zero air and high-span calibration gas are injected into the sample cell. The analyzer output swings to a calibration value (e.g. 450 mg/Nm³ span check). If not filtered, a machine learning algorithm will falsely learn that nocturnal periods experience massive NOx spikes!
                </p>
                <p className="font-semibold text-amber-800 mt-1">
                  Action Taken: Our pipeline detects the calibration flag and marks these intervals as <code className="font-mono bg-amber-100 px-1 rounded">isExcluded = true</code>.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-lg border border-purple-200 text-purple-950">
                <span className="font-bold block mb-1">
                  2. Coal Laboratory Latency (lab_result_available_time):
                </span>
                <p>
                  When coal is fed from the bunker into the pulverizers, the proximate and ultimate chemical analysis (Sulfur %, Ash %, Gross Calorific Value) is <strong>not</strong> known instantaneously. The chemist collects a sample, dries it, and performs bomb calorimetry and LECO sulfur combustion in the on-site lab, taking 4 to 8 hours.
                </p>
                <p className="font-semibold text-purple-800 mt-1">
                  Anti-Leakage Safeguard: Our pipeline inspects <code className="font-mono bg-purple-100 px-1 rounded">lab_result_available_time</code>. If a prediction is issued at 10:00 AM, the model is strictly prohibited from seeing lab samples certified at 14:00 PM; it must use the certified sample from the preceding shift.
                </p>
              </div>
            </div>
          </div>)}

        {activeStep === 3 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Target Shifting & The Anti-Leakage Golden Rule
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              In academic papers, models often boast unrealistic 99% accuracy because they accidentally use <em>future actual operating conditions</em> as inputs. In a real power plant control room, this causes catastrophic model failure.
            </p>

            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
              <div className="text-emerald-400 font-bold text-sm">
                // Target Creation by Forward Shifting:
              </div>
              <div className="text-slate-300">
                target_vector = actual_emission[t + Horizon]
              </div>
              <div className="text-blue-300">
                feature_vector = [
              </div>
              <div className="pl-6 text-slate-300">
                emission[t], emission[t - Δt], emission[t - 2Δt],<br />
                unit_load_mw[t], coal_feed_rate[t], total_air_flow[t],<br />
                flue_gas_o2[t], fegt_temp[t], sofa_damper_pct[t],<br />
                scr_ammonia_flow[t], certified_coal_sulfur[t]
              </div>
              <div className="text-blue-300">
                ]
              </div>
              <div className="text-red-400 font-semibold pt-1">
                // CRITICAL RULE: NEVER include unit_load_mw[t + Horizon] in the feature vector!
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              At time <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">t₀</code>, the operator does not know with 100% certainty what the grid dispatcher will demand at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">t₀ + 30m</code>. Feeding future actual MW into the model creates a fatal "look-ahead bias".
            </p>
          </div>)}

        {activeStep === 4 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Chemical Identity, Reporting Basis & Oxygen Normalization
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              In environmental engineering, numbers without defined reference bases are meaningless. Environmental authorities enforce strict standards:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-blue-900 block mb-1">
                  1. NOx Identity
                </span>
                <p className="text-slate-600">
                  Combustion produces ~95% NO and ~5% NO2. By environmental regulation, all NOx must be converted and reported as <strong>NO2 equivalent molecular weight (46.01 g/mol)</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-amber-900 block mb-1">
                  2. SO2 vs Total SOx
                </span>
                <p className="text-slate-600">
                  Do not treat SO2 as total SOx! Flue gas also contains SO3 (sulfur trioxide / sulfuric acid mist). Our model explicitly forecasts <strong>pure SO2</strong> measured by UV/NDIR analyzers.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  3. Opacity vs Particulate Matter
                </span>
                <p className="text-slate-600">
                  Optical opacity (%) measures light transmission extinction, not dust weight. Gravimetric PM (mg/Nm³) requires site-specific isokinetic calibration curves.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-950">
              <span className="font-bold block mb-1">
                Standard 6% Flue Gas Oxygen Normalization Formula:
              </span>
              <div className="font-mono bg-white p-2 rounded border border-blue-200 text-center text-blue-900 font-bold my-1">
                C_normalized = C_measured × (21.0 - 6.0) / (21.0 - FlueGas_O2_measured)
              </div>
              <p className="text-[11px] text-blue-800">
                This normalization prevents diluting emissions by simply blowing excess ambient air through the boiler.
              </p>
            </div>
          </div>)}

        {activeStep === 5 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Averaging Periods vs Instantaneous Spikes
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              A major operational error in plant monitoring is sounding an alarm when a single 1-minute telemetry reading spikes above a 30-minute regulatory limit.
            </p>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-2">
              <span className="font-bold text-sm text-amber-900 block">
                The Incompatible Averaging Period Trap:
              </span>
              <p>
                During soot blowing or mill roll-in, stack NOx might jump to 410 mg/Nm³ for 3 minutes before settling back to 310 mg/Nm³. If your internal warning limit is <strong>380 mg/Nm³ on a 30-minute rolling average</strong>, this transient spike does <em>not</em> breach the limit:
              </p>
              <div className="bg-white p-2.5 rounded font-mono text-center border border-amber-200 text-slate-800 font-semibold">
                Rolling Average = (3 × 410 + 27 × 310) / 30 = 320 mg/Nm³ (Safe!)
              </div>
              <p className="font-semibold text-amber-800">
                How Our Tool Solves This: The application calculates the <strong>predicted rolling average</strong> across the window, rather than comparing instantaneous peaks with rolling standards.
              </p>
            </div>
          </div>)}

        {activeStep === 6 && (<div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                6
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Model Benchmarking: Persistence, Trend & ML Decision Ensemble
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Every machine learning model deployed in a power plant must prove its value against simple, robust baselines:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  1. Persistence Baseline
                </span>
                <p className="text-slate-600">
                  Assumes tomorrow's emission equals today's: <code className="font-mono">ŷ(t+H) = y(t)</code>. Simple and fast, but completely blind to upcoming ramps.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  2. Simple Trend Extrapolation
                </span>
                <p className="text-slate-600">
                  Projects the recent 30-minute slope forward. Effective during steady ramps, but prone to false alarms when the ramp concludes.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="font-bold text-emerald-950 block mb-1">
                  3. Machine Learning Ensemble
                </span>
                <p className="text-emerald-900">
                  Combines autoregressive history with boiler operating inputs: MW Load, Coal Feed Rate, Overfire Air (SOFA), and SCR Ammonia flow to anticipate non-linear spikes 15-60 min ahead.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-950">
              <span className="font-bold block mb-1">
                Why We Never Equate MAPE with an "Accuracy Percentage":
              </span>
              <p>
                In statistics, marketing materials often claim "Accuracy = 100% - MAPE". If actual NOx is 10 mg/Nm³ and prediction is 25 mg/Nm³, the error is 150%, yielding negative "accuracy"! In this tool, we report MAE, RMSE, and precision/recall on discrete threshold events.
              </p>
            </div>
          </div>)}
      </div>
    </div>);
};

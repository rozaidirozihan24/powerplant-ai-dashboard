/**
 * Short-Term Prediction of Stack Emissions for Early Operational Warning
 * Coal-Fired Thermal Power Station CEMS Advisory Platform
 */
import React, { useState, useMemo } from 'react';
import { Activity, BarChart2, ShieldAlert, BookOpen, Server, } from 'lucide-react';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ModelComparisonTab } from './components/ModelComparisonTab';
import { DataAuditTab } from './components/DataAuditTab';
import { EngineersGuideTab } from './components/EngineersGuideTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { ThresholdModal } from './components/ThresholdModal';
import { generateSyntheticPlantData, POLLUTANT_CONFIGS, } from './utils/demoData';
import { cleansePlantData, createChronologicalSplit, } from './utils/dataCleansing';
import { runModelPipeline } from './utils/forecasting';
import { parsePlantCsv } from './utils/csvExport';
export default function App() {
    // Navigation tab state
    const [activeTab, setActiveTab] = useState('dashboard');
    // Controls state
    const [selectedPollutant, setSelectedPollutant] = useState('nox');
    const [selectedHorizon, setSelectedHorizon] = useState(15);
    // Raw dataset: defaults to high-fidelity 5-day synthetic power plant data
    const [rawRecords, setRawRecords] = useState(() => generateSyntheticPlantData(5, 15));
    // Operational thresholds state
    const [thresholds, setThresholds] = useState({
        nox: POLLUTANT_CONFIGS.nox.defaultThreshold,
        so2: POLLUTANT_CONFIGS.so2.defaultThreshold,
        pm: POLLUTANT_CONFIGS.pm.defaultThreshold,
    });
    const [averagingPeriods, setAveragingPeriods] = useState({
        nox: POLLUTANT_CONFIGS.nox.averagingPeriodMinutes,
        so2: POLLUTANT_CONFIGS.so2.averagingPeriodMinutes,
        pm: POLLUTANT_CONFIGS.pm.averagingPeriodMinutes,
    });
    // Modal & upload status
    const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
    const [isProcessingUpload, setIsProcessingUpload] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    // 1. Data Cleansing & Validation Pipeline
    const cleansingResult = useMemo(() => {
        return cleansePlantData(rawRecords);
    }, [rawRecords]);
    // Ensure selected horizon is supported by the data interval
    const effectiveHorizon = useMemo(() => {
        if (cleansingResult.supportedHorizons.includes(selectedHorizon)) {
            return selectedHorizon;
        }
        return cleansingResult.supportedHorizons[0] || 15;
    }, [cleansingResult.supportedHorizons, selectedHorizon]);
    // 2. Strict Chronological Dataset Splitting (60% Train, 20% Val, 20% Test)
    const datasetSplit = useMemo(() => {
        return createChronologicalSplit(cleansingResult.records, cleansingResult.samplingIntervalMinutes, cleansingResult.supportedHorizons);
    }, [cleansingResult]);
    // 3. Model Pipeline & Comparison Engine
    const comparisonResult = useMemo(() => {
        return runModelPipeline(datasetSplit.train, datasetSplit.validation, datasetSplit.test, selectedPollutant, effectiveHorizon, cleansingResult.samplingIntervalMinutes, thresholds[selectedPollutant], averagingPeriods[selectedPollutant]);
    }, [
        datasetSplit,
        selectedPollutant,
        effectiveHorizon,
        cleansingResult.samplingIntervalMinutes,
        thresholds,
        averagingPeriods,
    ]);
    // Active configuration for selected pollutant
    const config = POLLUTANT_CONFIGS[selectedPollutant];
    // Latest historical record and latest forecast point
    const currentRecord = datasetSplit.test.length > 0
        ? datasetSplit.test[datasetSplit.test.length - 1]
        : cleansingResult.records[cleansingResult.records.length - 1] || null;
    const latestForecast = comparisonResult.forecastPoints.length > 0
        ? comparisonResult.forecastPoints[comparisonResult.forecastPoints.length - 1]
        : null;
    // Handlers
    const handleResetDemo = () => {
        setRawRecords(generateSyntheticPlantData(5, 15));
        setUploadError(null);
    };
    const handleUploadCsv = (file) => {
        setIsProcessingUpload(true);
        setUploadError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const parsed = parsePlantCsv(text);
                if (parsed.length < 10) {
                    throw new Error('CSV file has too few data points (minimum 10 rows required).');
                }
                setRawRecords(parsed);
            }
            catch (err) {
                setUploadError(err.message || 'Failed to parse uploaded CEMS CSV file.');
            }
            finally {
                setIsProcessingUpload(false);
            }
        };
        reader.onerror = () => {
            setUploadError('Failed to read file from disk.');
            setIsProcessingUpload(false);
        };
        reader.readAsText(file);
    };
    const handleSaveThreshold = (newThreshold, newAveragingMinutes) => {
        setThresholds(prev => ({ ...prev, [selectedPollutant]: newThreshold }));
        setAveragingPeriods(prev => ({ ...prev, [selectedPollutant]: newAveragingMinutes }));
    };
    return (<div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      
      {/* 1. Header with Malakoff Palette, Plant Info, and Regulatory Safety Banner */}
      <Header onResetDemo={handleResetDemo} activeUnit="Unit 1 (600 MW)" activeStack="Stack 1 CEMS"/>

      {/* 2. Top Control Bar: Pollutant, Sampling-Guarded Horizons, Thresholds, CSV Upload */}
      <ControlBar selectedPollutant={selectedPollutant} onSelectPollutant={setSelectedPollutant} selectedHorizon={effectiveHorizon} onSelectHorizon={setSelectedHorizon} supportedHorizons={cleansingResult.supportedHorizons} samplingIntervalMinutes={cleansingResult.samplingIntervalMinutes} currentThreshold={thresholds[selectedPollutant]} averagingPeriodMinutes={averagingPeriods[selectedPollutant]} onOpenThresholdModal={() => setIsThresholdModalOpen(true)} onUploadCsv={handleUploadCsv} isProcessingUpload={isProcessingUpload} uploadError={uploadError}/>

      {/* 3. Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
            <button onClick={() => setActiveTab('dashboard')} className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'dashboard'
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Activity className="w-4 h-4 text-blue-600"/>
              <span>Operational Forecast</span>
            </button>

            <button onClick={() => setActiveTab('comparison')} className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'comparison'
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <BarChart2 className="w-4 h-4 text-emerald-600"/>
              <span>Model Benchmark & Test Metrics</span>
            </button>

            <button onClick={() => setActiveTab('audit')} className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'audit'
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <ShieldAlert className="w-4 h-4 text-amber-600"/>
              <span>CEMS Data Cleansing & Audit</span>
            </button>

            <button onClick={() => setActiveTab('guide')} className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'guide'
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <BookOpen className="w-4 h-4 text-purple-600"/>
              <span>Engineer's Step-by-Step Guide</span>
            </button>

            <button onClick={() => setActiveTab('architecture')} className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'architecture'
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Server className="w-4 h-4 text-slate-700"/>
              <span>Cloud Run & Corporate Laptop Guide</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Tab Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (<OperationalDashboard currentRecord={currentRecord} latestForecast={latestForecast} historicalRecords={datasetSplit.test} forecastPoints={comparisonResult.forecastPoints} config={config} threshold={thresholds[selectedPollutant]} horizonMinutes={effectiveHorizon} samplingIntervalMinutes={cleansingResult.samplingIntervalMinutes} featureAssociations={comparisonResult.featureAssociations} empiricalCoveragePct={comparisonResult.empiricalCoveragePct}/>)}

        {activeTab === 'comparison' && (<ModelComparisonTab comparisonResult={comparisonResult} config={config} threshold={thresholds[selectedPollutant]}/>)}

        {activeTab === 'audit' && (<DataAuditTab auditTrail={cleansingResult.auditTrail} samplingIntervalMinutes={cleansingResult.samplingIntervalMinutes} supportedHorizons={cleansingResult.supportedHorizons} totalRawCount={cleansingResult.totalRawCount} validCount={cleansingResult.validCount} excludedCount={cleansingResult.excludedCount} calibrationsDetected={cleansingResult.calibrationsDetected} startupsDetected={cleansingResult.startupsDetected}/>)}

        {activeTab === 'guide' && <EngineersGuideTab />}

        {activeTab === 'architecture' && <ArchitectureTab />}
      </main>

      {/* 5. Threshold Configuration Modal */}
      {isThresholdModalOpen && (<ThresholdModal config={config} currentThreshold={thresholds[selectedPollutant]} currentAveragingMinutes={averagingPeriods[selectedPollutant]} onSave={handleSaveThreshold} onClose={() => setIsThresholdModalOpen(false)}/>)}

      {/* 6. Professional Industrial Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Tanjung Bin Thermal Power Station • Stack 1 Continuous Emissions Monitoring System</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Advisory Engineering Prototype • Not an EPA Compliance Instrument • Does not replace CEMS
          </div>
        </div>
      </footer>
    </div>);
}

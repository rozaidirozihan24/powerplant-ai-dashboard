/**
 * CSV Template, Import, and Export Handlers for Power Plant Data
 * Adheres to standard CEMS logging and combustion SCADA tags.
 */
export const CSV_TEMPLATE_HEADERS = [
    'timestamp',
    'timezone',
    'unit',
    'stack',
    'unit_load_mw',
    'coal_feed_rate_tph',
    'combustion_air_flow_knm3h',
    'flue_gas_o2_pct_dry',
    'furnace_exit_temp_c',
    'coal_sulfur_pct',
    'coal_ash_pct',
    'coal_gcv_kcal_kg',
    'lab_result_available_time',
    'sofa_damper_pct',
    'scr_ammonia_flow_kgh',
    'fgd_status_bool',
    'limestone_flow_tph',
    'absorber_ph',
    'esp_active_fields',
    'esp_sec_current_ma',
    'nox_measured_mg_nm3_dry6o2',
    'so2_measured_mg_nm3_dry6o2',
    'pm_measured_mg_nm3_dry6o2',
    'cems_valid_flag_1valid_0invalid',
    'cems_calib_flag_1calib_0normal',
    'cems_maint_flag_1maint_0normal',
];
export function generateCsvTemplate() {
    const comment = [
        '# CEMS & Combustion Telemetry Upload Template',
        '# Units & Reporting Basis:',
        '# - NOx, SO2, PM: Normalized concentration in mg/Nm3 at 0°C, 101.3 kPa, Dry Basis, 6% Flue Gas O2',
        '# - Confirmation: Do NOT substitute opacity (%) for PM (mg/Nm3) or SO2 for total SOx.',
        '# - Lab Results: lab_result_available_time represents certified publication time (accounting for sample prep delay).',
        '# - CEMS Flags: cems_calib_flag=1 denotes automatic zero/span gas drift tests (will be audited & excluded).',
    ].join('\n');
    const sampleRow1 = [
        '2026-11-01T00:00:00Z',
        'UTC+8',
        'Unit 1',
        'Stack 1',
        '450.0',
        '195.8',
        '1520',
        '4.2',
        '1340',
        '0.75',
        '9.2',
        '5280',
        '2026-11-01T06:00:00Z',
        '75',
        '42.8',
        '1',
        '20.5',
        '5.6',
        '4',
        '720',
        '315.4',
        '210.2',
        '22.1',
        '1',
        '0',
        '0',
    ].join(',');
    const sampleRow2 = [
        '2026-11-01T00:15:00Z',
        'UTC+8',
        'Unit 1',
        'Stack 1',
        '452.5',
        '196.2',
        '1525',
        '4.1',
        '1342',
        '0.75',
        '9.2',
        '5280',
        '2026-11-01T06:00:00Z',
        '75',
        '43.0',
        '1',
        '20.6',
        '5.6',
        '4',
        '722',
        '318.2',
        '209.8',
        '21.9',
        '1',
        '0',
        '0',
    ].join(',');
    return `${comment}\n${CSV_TEMPLATE_HEADERS.join(',')}\n${sampleRow1}\n${sampleRow2}\n`;
}
export function downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
export function exportForecastPointsToCsv(points, pollutantName) {
    const headers = [
        'Model_Version',
        'Pollutant',
        'Forecast_Horizon_Min',
        'Forecast_Issue_Timestamp',
        'Forecast_Target_Timestamp',
        'Predicted_Concentration_mg_Nm3',
        'Prediction_Interval_90_Lower',
        'Prediction_Interval_90_Upper',
        'Actual_Ground_Truth_mg_Nm3',
        'Internal_Warning_Threshold',
        'Warning_Triggered_Flag',
        'Advisory_Status',
    ];
    const rows = points.map(p => [
        'StackPredict-v1.2-Ensemble',
        pollutantName,
        p.horizonMinutes,
        p.issueTimestamp,
        p.targetTimestamp,
        p.predictedValue,
        p.intervalLower,
        p.intervalUpper,
        p.actualValue !== undefined ? p.actualValue : 'N/A',
        p.thresholdValue,
        p.isWarningTriggered ? '1' : '0',
        p.status.toUpperCase(),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
}
/**
 * Parses user-uploaded CSV text into raw plant records with fallback mapping
 */
export function parsePlantCsv(csvText) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    if (lines.length < 2)
        throw new Error('Uploaded CSV file does not contain enough data rows.');
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    // Find column indices
    const getIdx = (candidates) => {
        return headers.findIndex(h => candidates.some(c => h.includes(c)));
    };
    const tsIdx = getIdx(['time', 'date', 'timestamp']);
    const loadIdx = getIdx(['load', 'mw', 'megawatt']);
    const coalIdx = getIdx(['coal', 'fuel', 'feed']);
    const airIdx = getIdx(['air', 'combustion_air']);
    const o2Idx = getIdx(['o2', 'oxygen']);
    const fegtIdx = getIdx(['fegt', 'temp', 'furnace']);
    const noxIdx = getIdx(['nox']);
    const so2Idx = getIdx(['so2']);
    const pmIdx = getIdx(['pm', 'dust', 'particulate']);
    const calibIdx = getIdx(['calib', 'calibration']);
    const validIdx = getIdx(['valid']);
    const sofaIdx = getIdx(['sofa', 'damper']);
    const nh3Idx = getIdx(['nh3', 'ammonia']);
    if (tsIdx === -1 || noxIdx === -1) {
        throw new Error('CSV must contain at least a Timestamp column and a measured NOx column.');
    }
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < headers.length * 0.7)
            continue;
        const ts = parts[tsIdx] || new Date().toISOString();
        const load = loadIdx !== -1 && !isNaN(Number(parts[loadIdx])) ? Number(parts[loadIdx]) : 450;
        const coal = coalIdx !== -1 && !isNaN(Number(parts[coalIdx])) ? Number(parts[coalIdx]) : load * 0.43;
        const air = airIdx !== -1 && !isNaN(Number(parts[airIdx])) ? Number(parts[airIdx]) : 1500;
        const o2 = o2Idx !== -1 && !isNaN(Number(parts[o2Idx])) ? Number(parts[o2Idx]) : 4.0;
        const fegt = fegtIdx !== -1 && !isNaN(Number(parts[fegtIdx])) ? Number(parts[fegtIdx]) : 1350;
        const nox = !isNaN(Number(parts[noxIdx])) ? Number(parts[noxIdx]) : 310;
        const so2 = so2Idx !== -1 && !isNaN(Number(parts[so2Idx])) ? Number(parts[so2Idx]) : 210;
        const pm = pmIdx !== -1 && !isNaN(Number(parts[pmIdx])) ? Number(parts[pmIdx]) : 22;
        const calib = calibIdx !== -1 && !isNaN(Number(parts[calibIdx])) ? Number(parts[calibIdx]) : 0;
        const valid = validIdx !== -1 && !isNaN(Number(parts[validIdx])) ? Number(parts[validIdx]) : 1;
        const sofa = sofaIdx !== -1 && !isNaN(Number(parts[sofaIdx])) ? Number(parts[sofaIdx]) : 70;
        const nh3 = nh3Idx !== -1 && !isNaN(Number(parts[nh3Idx])) ? Number(parts[nh3Idx]) : 42;
        records.push({
            timestamp: ts,
            timezone: 'UTC+8',
            unit: 'Unit 1',
            stack: 'Stack 1',
            unitLoadMw: load,
            coalFeedRateTph: coal,
            totalCombustionAirFlow: air,
            flueGasO2Pct: o2,
            furnaceExitGasTempC: fegt,
            coalSulfurPct: 0.78,
            coalAshPct: 9.2,
            coalGcvKcalKg: 5250,
            labResultAvailableTime: ts,
            sofaDamperPct: sofa,
            ammoniaFlowKgH: nh3,
            fgdStatus: true,
            limestoneSlurryFlowTph: 20,
            absorberPh: 5.6,
            espFieldsActive: 4,
            espSecondaryCurrentMa: 700,
            noxMeasured: nox,
            so2Measured: so2,
            pmMeasured: pm,
            cemsValidFlag: valid,
            cemsCalibFlag: calib,
            cemsMaintFlag: 0,
        });
    }
    return records;
}

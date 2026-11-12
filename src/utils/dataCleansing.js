/**
 * Data Preparation and Quality Cleansing for Stack Emissions
 * Enforces strict temporal integrity, CEMS analyzer status audits, and operational regime identification.
 */
/**
 * Detects the dominant sampling interval in minutes from sorted timestamps.
 */
export function detectSamplingInterval(records) {
    if (records.length < 2)
        return 15;
    const diffs = [];
    const limit = Math.min(records.length - 1, 50);
    for (let i = 0; i < limit; i++) {
        const t1 = new Date(records[i].timestamp).getTime();
        const t2 = new Date(records[i + 1].timestamp).getTime();
        const diffMinutes = Math.round(Math.abs(t2 - t1) / (60 * 1000));
        if (diffMinutes > 0 && diffMinutes <= 120) {
            diffs.push(diffMinutes);
        }
    }
    if (diffs.length === 0)
        return 15;
    // Find mode/median diff
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)];
}
/**
 * Determines which forecast horizons are valid given the data's sampling interval.
 * Horizon must be an integer multiple >= sampling interval.
 */
export function getSupportedHorizons(samplingIntervalMinutes) {
    const candidates = [15, 30, 60];
    return candidates.filter(h => h >= samplingIntervalMinutes && h % samplingIntervalMinutes === 0);
}
/**
 * Cleanses raw plant telemetry, applies CEMS validity flags, checks laboratory result latency,
 * and classifies boiler operating regimes.
 */
export function cleansePlantData(rawRecords) {
    const auditTrail = [];
    let auditCounter = 1;
    // Sort chronologically
    const sorted = [...rawRecords].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const samplingIntervalMinutes = detectSamplingInterval(sorted);
    const supportedHorizons = getSupportedHorizons(samplingIntervalMinutes);
    let calibrationsDetected = 0;
    let startupsDetected = 0;
    let excludedCount = 0;
    // Track latest verified lab result for point-in-time integrity
    let lastKnownCoalSulfur = 0.8;
    const prepared = [];
    for (let i = 0; i < sorted.length; i++) {
        const raw = sorted[i];
        const epochMs = new Date(raw.timestamp).getTime();
        // 1. Check Operating Regime (e.g. 600 MW unit rated: < 240 MW = startup/shutdown)
        let operatingMode = 'normal';
        if (raw.unitLoadMw < 100) {
            operatingMode = 'startup';
            startupsDetected++;
        }
        else if (raw.unitLoadMw < 240) {
            operatingMode = 'low_load_unstable';
        }
        // 2. Point-in-time lab result availability check:
        // Lab results cannot be used before their certified publication timestamp!
        const labAvailableEpoch = new Date(raw.labResultAvailableTime).getTime();
        let isLabAvailable = false;
        let usableSulfur = lastKnownCoalSulfur;
        if (labAvailableEpoch <= epochMs) {
            isLabAvailable = true;
            usableSulfur = raw.coalSulfurPct;
            lastKnownCoalSulfur = raw.coalSulfurPct;
        }
        else {
            // Lab result for current coal batch is not yet available; model must use lagged historical batch!
            if (auditCounter <= 5) {
                auditTrail.push({
                    id: `AUD-${auditCounter++}`,
                    timestamp: raw.timestamp,
                    category: 'LAB_LATENCY',
                    severity: 'info',
                    details: `Coal ultimate analysis for current bunkered batch is pending lab turnaround (available at ${raw.labResultAvailableTime}).`,
                    actionTaken: `Substituted with previous certified lab sample (${usableSulfur.toFixed(2)}% S) to prevent future data leakage.`,
                });
            }
        }
        // 3. CEMS Validity & Calibration Audit
        let isExcluded = false;
        let exclusionReason = undefined;
        if (raw.cemsCalibFlag === 1) {
            calibrationsDetected++;
            isExcluded = true;
            exclusionReason = 'CEMS Daily Auto-Calibration (Zero/Span Drift Check in progress)';
            if (calibrationsDetected <= 5) {
                auditTrail.push({
                    id: `AUD-${auditCounter++}`,
                    timestamp: raw.timestamp,
                    category: 'CEMS_CALIBRATION',
                    severity: 'warning',
                    details: `CEMS analyzer reports calibration gas injection on Stack ${raw.stack}. Reading: ${raw.noxMeasured.toFixed(1)} mg/Nm³.`,
                    actionTaken: 'Flagged as invalid calibration period. Excluded from model training and target computation.',
                });
            }
        }
        else if (raw.cemsValidFlag === 0 || raw.cemsMaintFlag === 1) {
            isExcluded = true;
            exclusionReason = raw.cemsMaintFlag === 1 ? 'CEMS Sampling Probe Maintenance' : 'CEMS Diagnostic Fault / Purge Cycle';
            auditTrail.push({
                id: `AUD-${auditCounter++}`,
                timestamp: raw.timestamp,
                category: 'CEMS_INVALID',
                severity: 'critical',
                details: `CEMS analyzer diagnostic flag active (Valid=${raw.cemsValidFlag}, Maint=${raw.cemsMaintFlag}).`,
                actionTaken: 'Excluded invalid analyser reading to prevent erroneous training gradients.',
            });
        }
        // 4. Stale / Frozen Sensor Detection
        if (i >= 4 && !isExcluded) {
            const prev4 = sorted.slice(i - 4, i);
            const isFrozen = prev4.every(p => p.noxMeasured === raw.noxMeasured);
            if (isFrozen) {
                auditTrail.push({
                    id: `AUD-${auditCounter++}`,
                    timestamp: raw.timestamp,
                    category: 'STALE_SENSOR',
                    severity: 'warning',
                    details: `NOx measurement remained completely unchanged across 5 consecutive intervals (${raw.noxMeasured} mg/Nm³).`,
                    actionTaken: 'Flagged as suspicious frozen telemetry; flagged for instrument technician inspection.',
                });
            }
        }
        if (isExcluded)
            excludedCount++;
        prepared.push({
            ...raw,
            epochMs,
            operatingMode,
            isExcluded,
            exclusionReason,
            isLabAvailableAtPointInTime: isLabAvailable,
            usableCoalSulfurPct: usableSulfur,
        });
    }
    return {
        records: prepared,
        auditTrail,
        samplingIntervalMinutes,
        supportedHorizons,
        totalRawCount: rawRecords.length,
        validCount: prepared.length - excludedCount,
        excludedCount,
        calibrationsDetected,
        startupsDetected,
    };
}
/**
 * Splits dataset chronologically into Train (60%), Validation (20%), and Test (20%).
 * Strictly preserves time sequence with zero future overlap.
 */
export function createChronologicalSplit(records, samplingIntervalMinutes, supportedHorizons) {
    const validRecords = records.filter(r => !r.isExcluded);
    const n = validRecords.length;
    const trainCutoff = Math.floor(n * 0.6);
    const valCutoff = Math.floor(n * 0.8);
    const train = validRecords.slice(0, trainCutoff);
    const validation = validRecords.slice(trainCutoff, valCutoff);
    const test = validRecords.slice(valCutoff);
    return {
        train,
        validation,
        test,
        samplingIntervalMinutes,
        supportedHorizons,
    };
}

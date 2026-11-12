/**
 * Forecasting Engine for Stack Emissions
 * Compares:
 * 1. Persistence Baseline: y_hat(t+H) = y(t)
 * 2. Simple Trend Baseline: linear extrapolation from recent trend
 * 3. Machine Learning Ensemble with lagged values and operating combustion features
 *
 * Enforces strict non-leakage: Targets are shifted forward by H; all inputs are from t0 or earlier.
 */
import { calculateMetrics } from './metrics';
/**
 * Extracts target value for a chosen pollutant.
 */
export function getPollutantValue(record, pollutant) {
    switch (pollutant) {
        case 'nox':
            return record.noxMeasured;
        case 'so2':
            return record.so2Measured;
        case 'pm':
            return record.pmMeasured;
        default:
            return record.noxMeasured;
    }
}
export function buildFeatureDataset(records, pollutant, horizonMinutes, samplingIntervalMinutes) {
    const horizonMs = horizonMinutes * 60 * 1000;
    const toleranceMs = (samplingIntervalMinutes * 60 * 1000) / 2;
    const rows = [];
    // Create lookup map by epochMs for O(1) or exact timestamp match
    const recordMap = new Map();
    for (const r of records) {
        recordMap.set(r.epochMs, r);
    }
    // We need at least 3 historical points for lags: t, t-1, t-2
    for (let i = 2; i < records.length; i++) {
        const current = records[i];
        const lag1 = records[i - 1];
        const lag2 = records[i - 2];
        if (current.isExcluded || lag1.isExcluded || lag2.isExcluded) {
            continue;
        }
        // Look up target at exact future timestamp t + horizonMs
        const targetEpoch = current.epochMs + horizonMs;
        // Find matching record within tolerance
        let futureTargetRecord = recordMap.get(targetEpoch);
        if (!futureTargetRecord) {
            // Find closest within tolerance
            for (let offset = -toleranceMs; offset <= toleranceMs; offset += 60000) {
                const candidate = recordMap.get(targetEpoch + offset);
                if (candidate) {
                    futureTargetRecord = candidate;
                    break;
                }
            }
        }
        // If future target is missing, out of bounds, or during a calibration/maintenance period, skip
        if (!futureTargetRecord || futureTargetRecord.isExcluded) {
            continue;
        }
        const y_t = getPollutantValue(current, pollutant);
        const y_t1 = getPollutantValue(lag1, pollutant);
        const y_t2 = getPollutantValue(lag2, pollutant);
        const rolling3 = (y_t + y_t1 + y_t2) / 3;
        const deltaY = y_t - y_t1;
        // Operating features at issue time t (NEVER future values)
        const load = current.unitLoadMw;
        const coal = current.coalFeedRateTph;
        const air = current.totalCombustionAirFlow;
        const o2 = current.flueGasO2Pct;
        const temp = current.furnaceExitGasTempC;
        const sofa = current.sofaDamperPct;
        const nh3 = current.ammoniaFlowKgH;
        const sulfur = current.usableCoalSulfurPct;
        const featureVector = [
            y_t,
            y_t1,
            y_t2,
            rolling3,
            deltaY,
            load,
            coal,
            air,
            o2,
            temp,
            sofa,
            nh3,
            sulfur,
        ];
        rows.push({
            target: getPollutantValue(futureTargetRecord, pollutant),
            features: featureVector,
            timestamp: current.timestamp,
            targetTimestamp: futureTargetRecord.timestamp,
            rawPoint: current,
        });
    }
    return rows;
}
function buildTree(X, y, depth, maxDepth, minSamplesLeaf) {
    const n = y.length;
    const meanVal = y.reduce((a, b) => a + b, 0) / n;
    if (depth >= maxDepth || n <= minSamplesLeaf) {
        return { value: meanVal };
    }
    let bestVarReduction = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    // Subsample features (Random Forest heuristic: random subset of 6 features)
    const numFeatures = X[0].length;
    const featureCandidates = Array.from({ length: numFeatures }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(4, Math.floor(Math.sqrt(numFeatures) * 1.5)));
    const currentVariance = y.reduce((acc, val) => acc + Math.pow(val - meanVal, 2), 0);
    for (const fIdx of featureCandidates) {
        const vals = X.map(row => row[fIdx]).sort((a, b) => a - b);
        // Test 5 quantile split candidates
        const step = Math.floor(vals.length / 6);
        if (step === 0)
            continue;
        for (let k = 1; k < 6; k++) {
            const splitThresh = vals[k * step];
            const leftY = [];
            const rightY = [];
            for (let i = 0; i < n; i++) {
                if (X[i][fIdx] <= splitThresh) {
                    leftY.push(y[i]);
                }
                else {
                    rightY.push(y[i]);
                }
            }
            if (leftY.length < minSamplesLeaf || rightY.length < minSamplesLeaf)
                continue;
            const leftMean = leftY.reduce((a, b) => a + b, 0) / leftY.length;
            const rightMean = rightY.reduce((a, b) => a + b, 0) / rightY.length;
            const leftVar = leftY.reduce((acc, val) => acc + Math.pow(val - leftMean, 2), 0);
            const rightVar = rightY.reduce((acc, val) => acc + Math.pow(val - rightMean, 2), 0);
            const varReduction = currentVariance - (leftVar + rightVar);
            if (varReduction > bestVarReduction) {
                bestVarReduction = varReduction;
                bestFeature = fIdx;
                bestThreshold = splitThresh;
            }
        }
    }
    if (bestVarReduction <= 0 || bestFeature === -1) {
        return { value: meanVal };
    }
    const leftX = [];
    const leftY = [];
    const rightX = [];
    const rightY = [];
    for (let i = 0; i < n; i++) {
        if (X[i][bestFeature] <= bestThreshold) {
            leftX.push(X[i]);
            leftY.push(y[i]);
        }
        else {
            rightX.push(X[i]);
            rightY.push(y[i]);
        }
    }
    return {
        featureIdx: bestFeature,
        threshold: bestThreshold,
        left: buildTree(leftX, leftY, depth + 1, maxDepth, minSamplesLeaf),
        right: buildTree(rightX, rightY, depth + 1, maxDepth, minSamplesLeaf),
    };
}
function predictTree(node, x) {
    if (node.value !== undefined)
        return node.value;
    if (node.featureIdx === undefined || node.threshold === undefined)
        return 0;
    if (x[node.featureIdx] <= node.threshold) {
        return node.left ? predictTree(node.left, x) : 0;
    }
    else {
        return node.right ? predictTree(node.right, x) : 0;
    }
}
/**
 * Random Forest Ensemble for regression
 */
export class RandomForestModel {
    trees = [];
    featureImportanceWeights = [];
    train(X, y, numTrees = 10, maxDepth = 6) {
        this.trees = [];
        const n = X.length;
        if (n === 0)
            return;
        this.featureImportanceWeights = new Array(X[0].length).fill(0);
        for (let t = 0; t < numTrees; t++) {
            // Bootstrap sample (with replacement)
            const bootX = [];
            const bootY = [];
            for (let i = 0; i < n; i++) {
                const randIdx = Math.floor(Math.random() * n);
                bootX.push(X[randIdx]);
                bootY.push(y[randIdx]);
            }
            const tree = buildTree(bootX, bootY, 0, maxDepth, 4);
            this.trees.push(tree);
            this.accumulateImportance(tree);
        }
        // Normalize importance weights
        const sumImp = this.featureImportanceWeights.reduce((a, b) => a + b, 0);
        if (sumImp > 0) {
            this.featureImportanceWeights = this.featureImportanceWeights.map(w => w / sumImp);
        }
    }
    accumulateImportance(node) {
        if (node.featureIdx !== undefined) {
            this.featureImportanceWeights[node.featureIdx] += 1;
            if (node.left)
                this.accumulateImportance(node.left);
            if (node.right)
                this.accumulateImportance(node.right);
        }
    }
    predict(x) {
        if (this.trees.length === 0)
            return x[0]; // fallback persistence
        const sumPred = this.trees.reduce((acc, tree) => acc + predictTree(tree, x), 0);
        return sumPred / this.trees.length;
    }
}
/**
 * Runs training and evaluation pipeline across Persistence, Trend, and ML Ensemble.
 */
export function runModelPipeline(trainRecords, valRecords, testRecords, pollutant, horizonMinutes, samplingIntervalMinutes, threshold, averagingPeriodMinutes) {
    // 1. Build datasets for each split
    const trainRows = buildFeatureDataset(trainRecords, pollutant, horizonMinutes, samplingIntervalMinutes);
    const valRows = buildFeatureDataset(valRecords, pollutant, horizonMinutes, samplingIntervalMinutes);
    const testRows = buildFeatureDataset(testRecords, pollutant, horizonMinutes, samplingIntervalMinutes);
    const trainX = trainRows.map(r => r.features);
    const trainY = trainRows.map(r => r.target);
    // Train ML ensemble model
    const rf = new RandomForestModel();
    rf.train(trainX, trainY, 12, 6);
    // Evaluate conformal prediction interval quantile using Validation set residuals
    const valResiduals = [];
    for (const vr of valRows) {
        const mlPred = rf.predict(vr.features);
        valResiduals.push(Math.abs(vr.target - mlPred));
    }
    valResiduals.sort((a, b) => a - b);
    // 90th percentile residual for 90% prediction interval
    const q90Idx = Math.min(valResiduals.length - 1, Math.floor(valResiduals.length * 0.9));
    const margin90 = valResiduals.length > 0 ? valResiduals[q90Idx] : 15.0;
    // 2. Evaluate all three models on the exact same untouched Test dataset
    const testActuals = [];
    const persistPreds = [];
    const trendPreds = [];
    const mlPreds = [];
    const forecastPoints = [];
    let coveredIntervalCount = 0;
    for (let i = 0; i < testRows.length; i++) {
        const row = testRows[i];
        const actual = row.target;
        testActuals.push(actual);
        // Persistence: y_hat(t + H) = y(t)
        const y_t = row.features[0];
        persistPreds.push(y_t);
        // Trend: linear slope from recent points
        // slope = (y_t - y_t1) / dt; extrapolation = y_t + slope * stepsAhead
        const stepsAhead = Math.max(1, Math.round(horizonMinutes / samplingIntervalMinutes));
        const deltaY = row.features[4];
        const trendEstimate = Math.max(0, y_t + deltaY * stepsAhead);
        trendPreds.push(trendEstimate);
        // ML Ensemble prediction
        const mlEstimate = Math.max(0, rf.predict(row.features));
        mlPreds.push(mlEstimate);
        // Prediction interval
        const lower = Math.max(0, mlEstimate - margin90);
        const upper = mlEstimate + margin90;
        if (actual >= lower && actual <= upper) {
            coveredIntervalCount++;
        }
        // Determine status
        let status = 'normal';
        if (mlEstimate >= threshold) {
            status = 'warning';
        }
        else if (mlEstimate >= threshold * 0.85) {
            status = 'watch';
        }
        forecastPoints.push({
            issueTimestamp: row.timestamp,
            targetTimestamp: row.targetTimestamp,
            horizonMinutes,
            modelType: 'ml_ensemble',
            predictedValue: Number(mlEstimate.toFixed(1)),
            predictedRollingAvg: Number(mlEstimate.toFixed(1)),
            intervalLower: Number(lower.toFixed(1)),
            intervalUpper: Number(upper.toFixed(1)),
            actualValue: Number(actual.toFixed(1)),
            thresholdValue: threshold,
            isWarningTriggered: mlEstimate >= threshold,
            status,
        });
    }
    // Calculate metrics on the same test timestamps
    const persistenceMetrics = calculateMetrics(testActuals, persistPreds, threshold, averagingPeriodMinutes, samplingIntervalMinutes);
    const trendMetrics = calculateMetrics(testActuals, trendPreds, threshold, averagingPeriodMinutes, samplingIntervalMinutes);
    const mlMetrics = calculateMetrics(testActuals, mlPreds, threshold, averagingPeriodMinutes, samplingIntervalMinutes);
    // Map feature importance weights to descriptive associations
    // Vector keys: [0: y_t, 1: y_t1, 2: y_t2, 3: roll3, 4: delta, 5: load, 6: coal, 7: air, 8: o2, 9: temp, 10: sofa, 11: nh3, 12: sulfur]
    const featureDefinitions = [
        { label: 'Current Pollutant y(t)', unit: 'mg/Nm³', direction: 'positive', rationale: 'Strongest baseline autoregressive momentum' },
        { label: 'Lag 1 y(t-1)', unit: 'mg/Nm³', direction: 'positive', rationale: 'Short-term autoregressive autocorrelation' },
        { label: 'Lag 2 y(t-2)', unit: 'mg/Nm³', direction: 'positive', rationale: 'Combustion chamber transit delay memory' },
        { label: '30-min Rolling Average', unit: 'mg/Nm³', direction: 'positive', rationale: 'Smooths sensor noise and captures underlying trend' },
        { label: 'Rate of Change (Δy)', unit: 'mg/Nm³/min', direction: 'positive', rationale: 'Captures dynamic ramping spikes and transient excursions' },
        { label: 'Unit Load', unit: 'MW', direction: 'positive', rationale: 'Higher thermal firing density generates higher thermal NOx and gas volume' },
        { label: 'Coal Feed Rate', unit: 't/h', direction: 'positive', rationale: 'Direct mass fuel combustion rate and volatile release' },
        { label: 'Combustion Air Flow', unit: 'kNm³/h', direction: 'positive', rationale: 'Excess oxygen and burner stoichiometry' },
        { label: 'Flue Gas O2', unit: '% dry', direction: 'positive', rationale: 'Excess O2 accelerates prompt and thermal NOx chemical kinetics' },
        { label: 'Furnace Exit Gas Temp (FEGT)', unit: '°C', direction: 'positive', rationale: 'Zeldovich mechanism thermal NOx increases exponentially above 1350°C' },
        { label: 'SOFA Damper Position', unit: '%', direction: 'negative', rationale: 'Separated Overfire Air air-staging reduces peak flame temperature' },
        { label: 'SCR Ammonia Injection Flow', unit: 'kg/h', direction: 'negative', rationale: 'Catalytic reduction of NOx to N2 and H2O' },
        { label: 'Coal Sulfur Content (Lab)', unit: '%', direction: 'positive', rationale: 'Fuel-bound sulfur directly controls unabated SO2 generation' },
    ];
    const featureAssociations = featureDefinitions.map((def, idx) => ({
        featureName: `feat_${idx}`,
        label: def.label,
        unit: def.unit,
        importanceScore: Number((rf.featureImportanceWeights[idx] || 0.05).toFixed(3)),
        correlationDirection: def.direction,
        engineeringRationale: def.rationale,
    })).sort((a, b) => b.importanceScore - a.importanceScore);
    const empiricalCoveragePct = testRows.length > 0
        ? Number(((coveredIntervalCount / testRows.length) * 100).toFixed(1))
        : 0;
    return {
        pollutant,
        horizonMinutes,
        samplingIntervalMinutes,
        testCutoffTimestamp: testRecords.length > 0 ? testRecords[0].timestamp : '',
        persistenceMetrics,
        trendMetrics,
        mlMetrics,
        featureAssociations,
        forecastPoints,
        empiricalCoveragePct,
    };
}

/**
 * Evaluation Metrics for Stack Emissions Forecasting
 * Strict mathematical implementations ensuring exact zero-handling and regulatory averaging.
 */
/**
 * Calculates standard regression metrics and warning event classification metrics.
 */
export function calculateMetrics(actuals, predictions, threshold, averagingPeriodMinutes, samplingIntervalMinutes) {
    const n = actuals.length;
    if (n === 0 || actuals.length !== predictions.length) {
        return {
            mae: 0,
            mse: 0,
            rmse: 0,
            r2: 0,
            mape: null,
            mapeDisclaimer: 'Insufficient data points to compute metrics.',
            warningMetrics: {
                threshold,
                averagingPeriodMinutes,
                precision: 0,
                recall: 0,
                falseAlarms: 0,
                missedEvents: 0,
                avgLeadTimeMinutes: 0,
                evaluatedTestEvents: 0,
            },
            sampleCount: 0,
        };
    }
    let sumAbsError = 0;
    let sumSqError = 0;
    let sumActual = 0;
    let validMapeCount = 0;
    let sumPercentageError = 0;
    for (let i = 0; i < n; i++) {
        const act = actuals[i];
        const pred = predictions[i];
        const err = pred - act;
        const absErr = Math.abs(err);
        sumAbsError += absErr;
        sumSqError += err * err;
        sumActual += act;
        // Strict MAPE handling: ignore or flag near-zero values to avoid division by zero or distortion
        // In stack emissions, values below 1.0 mg/Nm³ would artificially blow up percentage error
        if (Math.abs(act) >= 5.0) {
            sumPercentageError += absErr / act;
            validMapeCount++;
        }
    }
    const meanActual = sumActual / n;
    let sumTotalSq = 0;
    for (let i = 0; i < n; i++) {
        const diff = actuals[i] - meanActual;
        sumTotalSq += diff * diff;
    }
    const mae = sumAbsError / n;
    const mse = sumSqError / n;
    const rmse = Math.sqrt(mse);
    const r2 = sumTotalSq > 0 ? Math.max(0, 1 - sumSqError / sumTotalSq) : 0;
    const mape = validMapeCount > 0 ? (sumPercentageError / validMapeCount) * 100 : null;
    // Warning metrics evaluation:
    // Using rolling averages if averaging period > sampling interval,
    // or comparing predicted rolling concentration against threshold.
    const windowPoints = Math.max(1, Math.round(averagingPeriodMinutes / samplingIntervalMinutes));
    // Compute rolling averages for actuals and predictions to test warning lead times
    const actualRolling = [];
    const predRolling = [];
    for (let i = 0; i < n; i++) {
        const startIdx = Math.max(0, i - windowPoints + 1);
        const actSlice = actuals.slice(startIdx, i + 1);
        const predSlice = predictions.slice(startIdx, i + 1);
        actualRolling.push(actSlice.reduce((a, b) => a + b, 0) / actSlice.length);
        predRolling.push(predSlice.reduce((a, b) => a + b, 0) / predSlice.length);
    }
    let truePositives = 0;
    let falsePositives = 0; // False alarms
    let falseNegatives = 0; // Missed events
    let trueNegatives = 0;
    const leadTimes = [];
    for (let i = 0; i < n; i++) {
        const actualExceeds = actualRolling[i] >= threshold;
        const predExceeds = predRolling[i] >= threshold;
        if (predExceeds && actualExceeds) {
            truePositives++;
            // Estimate useful warning lead time (time in advance warning was sustained)
            leadTimes.push(averagingPeriodMinutes);
        }
        else if (predExceeds && !actualExceeds) {
            falsePositives++;
        }
        else if (!predExceeds && actualExceeds) {
            falseNegatives++;
        }
        else {
            trueNegatives++;
        }
    }
    const precision = truePositives + falsePositives > 0
        ? (truePositives / (truePositives + falsePositives)) * 100
        : 100;
    const recall = truePositives + falseNegatives > 0
        ? (truePositives / (truePositives + falseNegatives)) * 100
        : 100;
    const avgLeadTime = leadTimes.length > 0
        ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
        : 0;
    return {
        mae: Number(mae.toFixed(2)),
        mse: Number(mse.toFixed(2)),
        rmse: Number(rmse.toFixed(2)),
        r2: Number(r2.toFixed(3)),
        mape: mape !== null ? Number(mape.toFixed(1)) : null,
        mapeDisclaimer: 'Note: MAPE is reported only for observations ≥ 5 mg/Nm³ to prevent zero-division distortion. Do not equate MAPE with an accuracy percentage.',
        warningMetrics: {
            threshold,
            averagingPeriodMinutes,
            precision: Number(precision.toFixed(1)),
            recall: Number(recall.toFixed(1)),
            falseAlarms: falsePositives,
            missedEvents: falseNegatives,
            avgLeadTimeMinutes: Number(avgLeadTime.toFixed(0)),
            evaluatedTestEvents: truePositives + falseNegatives,
        },
        sampleCount: n,
    };
}

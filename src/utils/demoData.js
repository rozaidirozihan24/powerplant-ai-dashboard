/**
 * Realistic Synthetic Dataset Generator for a 600 MW Supercritical Coal-Fired Power Plant
 * Stack 1 / Unit 1 - Real combustion physics, CEMS calibration cycles, and lab turnaround delays.
 */
export const POLLUTANT_CONFIGS = {
    nox: {
        id: 'nox',
        name: 'Nitrogen Oxides (as NO2 equivalent)',
        chemicalFormula: 'NOx',
        units: 'mg/Nm³',
        reportingBasis: 'Standard Conditions (0°C, 101.3 kPa), Dry Basis, Normalized to 6% Flue Gas O2',
        defaultThreshold: 380, // Internal operational warning threshold
        averagingPeriodMinutes: 30, // 30-min rolling average internal control
        cautionNotice: 'Confirmation required: Reporting basis must be NO2 equivalent at 6% O2 dry basis. Do not compare instantaneous stack spikes with long-term 24-hr daily averages.',
        equipmentParameters: ['SOFA Damper Position (%)', 'SCR Ammonia Injection Flow (kg/h)', 'Furnace Exit Gas Temp (°C)'],
    },
    so2: {
        id: 'so2',
        name: 'Sulfur Dioxide',
        chemicalFormula: 'SO2',
        units: 'mg/Nm³',
        reportingBasis: 'Standard Conditions (0°C, 101.3 kPa), Dry Basis, Normalized to 6% Flue Gas O2',
        defaultThreshold: 280,
        averagingPeriodMinutes: 60,
        cautionNotice: 'Confirmation required: Measure is pure SO2, NOT total SOx. Mass emission rate (kg/h) requires certified dry flue gas flow velocity.',
        equipmentParameters: ['FGD In-Service Status', 'Limestone Slurry Feed (t/h)', 'Absorber Sump pH'],
    },
    pm: {
        id: 'pm',
        name: 'Particulate Matter (Dust)',
        chemicalFormula: 'PM',
        units: 'mg/Nm³',
        reportingBasis: 'Standard Conditions (0°C, 101.3 kPa), Dry Basis, Normalized to 6% Flue Gas O2',
        defaultThreshold: 35,
        averagingPeriodMinutes: 30,
        cautionNotice: 'Confirmation required: Gravimetric PM concentration (mg/Nm³), NOT optical opacity (%). Optical opacity requires calibration correlation curve.',
        equipmentParameters: ['Active ESP Fields (0-4)', 'Secondary T/R Current (mA)', 'Baghouse Filter ΔP (kPa)'],
    },
};
/**
 * Generates 5 days of 15-minute interval synthetic data (~480 records)
 * with authentic boiler dynamics, load swings, CEMS calibrations, and lab report latencies.
 */
export function generateSyntheticPlantData(numDays = 5, intervalMinutes = 15) {
    const records = [];
    const startEpoch = new Date('2026-11-01T00:00:00Z').getTime();
    const pointsPerDay = (24 * 60) / intervalMinutes;
    const totalPoints = numDays * pointsPerDay;
    // Coal lab batches arrive at 06:00 and 18:00 with 6-hour analysis turnaround
    let currentCoalSulfur = 0.78;
    let currentCoalAsh = 9.4;
    let currentCoalGcv = 5250;
    let nextLabAvailableEpoch = startEpoch + 6 * 3600 * 1000;
    for (let i = 0; i < totalPoints; i++) {
        const recordEpoch = startEpoch + i * intervalMinutes * 60 * 1000;
        const date = new Date(recordEpoch);
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const timeOfDayHours = hour + minute / 60;
        // Daily grid demand curve: low nighttime (350 MW), ramp at 06:00, peak at 14:00-19:00 (580 MW)
        const baseDemand = 340 + 220 * Math.sin(((timeOfDayHours - 6) / 24) * 2 * Math.PI);
        const loadNoise = (Math.sin(i * 0.17) + Math.cos(i * 0.31)) * 12;
        const unitLoadMw = Math.min(600, Math.max(280, Number((baseDemand + loadNoise).toFixed(1))));
        // Coal feed rate (tons/hr) ~ load * 0.44 t/MWh + noise
        const coalFeedRateTph = Number((unitLoadMw * 0.435 + Math.sin(i * 0.4) * 3.5).toFixed(1));
        // Flue Gas O2 (%): inversely related to load (higher at low load, lower at high load)
        const flueGasO2Pct = Number((6.2 - (unitLoadMw - 280) * (2.8 / 320) + (Math.sin(i * 0.7) * 0.15)).toFixed(2));
        // Combustion Air Flow (kNm3/h)
        const totalCombustionAirFlow = Number((coalFeedRateTph * 7.4 + flueGasO2Pct * 45 + Math.cos(i * 0.2) * 20).toFixed(0));
        // Furnace Exit Gas Temp (FEGT): 1250°C to 1460°C
        const furnaceExitGasTempC = Number((1260 + (unitLoadMw - 280) * 0.55 + Math.sin(i * 0.3) * 15).toFixed(0));
        // Air staging: SOFA damper position (45% - 85%)
        // Simulate periodic soot blowing event every 36 hours causing SOFA throttling
        const isSootBlowing = (i % 144 >= 72 && i % 144 <= 78);
        const sofaDamperPct = isSootBlowing
            ? Number((48 + Math.sin(i) * 4).toFixed(0))
            : Number((72 + (unitLoadMw / 600) * 12 + Math.sin(i * 0.5) * 5).toFixed(0));
        // SCR Ammonia Injection Flow (kg/h): automated PID controller response
        const targetNh3 = unitLoadMw * 0.095;
        const ammoniaFlowKgH = isSootBlowing
            ? Number((targetNh3 * 0.75).toFixed(1)) // Ammonia lag/limitation during soot blowing
            : Number((targetNh3 + Math.cos(i * 0.8) * 2.5).toFixed(1));
        // Periodic coal sample updates (every 12 hours)
        if (i % ((12 * 60) / intervalMinutes) === 0 && i > 0) {
            currentCoalSulfur = Number((0.70 + Math.random() * 0.30).toFixed(2));
            currentCoalAsh = Number((8.8 + Math.random() * 2.2).toFixed(1));
            currentCoalGcv = Number((5100 + Math.random() * 350).toFixed(0));
            // Certified lab result delivered 6 hours later!
            nextLabAvailableEpoch = recordEpoch + 6 * 3600 * 1000;
        }
        // Equipment operating parameters for SO2 and PM
        const fgdStatus = true;
        const limestoneSlurryFlowTph = Number((currentCoalSulfur * coalFeedRateTph * 0.14).toFixed(2));
        const absorberPh = Number((5.4 + Math.sin(i * 0.1) * 0.25).toFixed(2));
        const espFieldsActive = 4;
        const espSecondaryCurrentMa = Number((650 + (unitLoadMw / 600) * 220 + Math.sin(i) * 30).toFixed(0));
        // Emissions physics models:
        // NOx formation: Thermal NOx (Zeldovich mechanism) + Fuel NOx
        // Increases with FEGT, excess O2, and coal rate; reduced by SOFA damper and NH3 injection
        const thermalNoxBase = (furnaceExitGasTempC - 1200) * 0.65;
        const o2ExcessFactor = (flueGasO2Pct - 3.0) * 18;
        const sofaReduction = (sofaDamperPct - 50) * 1.8;
        const scrReduction = ammoniaFlowKgH * 2.8;
        // Injected operational excursion event on Day 4 to test warning lead time
        const isOperationalExcursion = (i >= 320 && i <= 342); // 5-hour excursion event
        const excursionAdd = isOperationalExcursion ? 85 * Math.sin(((i - 320) / 22) * Math.PI) : 0;
        let noxMeasured = Number((285 + thermalNoxBase + o2ExcessFactor - sofaReduction - scrReduction + excursionAdd + (Math.sin(i * 1.1) * 6)).toFixed(1));
        noxMeasured = Math.max(160, Math.min(520, noxMeasured));
        // SO2 formation: depends on coal sulfur, coal feed rate, and FGD efficiency (~94%)
        const rawSo2 = (coalFeedRateTph * currentCoalSulfur * 18.5) / (totalCombustionAirFlow * 0.00085);
        const fgdEfficiency = fgdStatus ? 0.93 + (absorberPh - 5.0) * 0.04 : 0;
        const so2Measured = Number((rawSo2 * (1 - fgdEfficiency) + Math.cos(i * 0.4) * 8).toFixed(1));
        // PM concentration: depends on coal ash and ESP efficiency (99.8%)
        const rawDust = (coalFeedRateTph * (currentCoalAsh / 100) * 1000) / (totalCombustionAirFlow * 0.85);
        const espEfficiency = 0.997 + (espFieldsActive / 4) * 0.0018;
        const pmMeasured = Number((rawDust * (1 - espEfficiency) * 1000 + Math.sin(i * 0.6) * 2).toFixed(1));
        // Daily CEMS Zero/Span Calibration Check:
        // Every night between 02:00 and 02:30 AM (two 15-minute points)
        const isDailyCalib = (hour === 2 && (minute === 0 || minute === 15));
        const cemsCalibFlag = isDailyCalib ? 1 : 0;
        const cemsValidFlag = isDailyCalib ? 0 : 1;
        const cemsMaintFlag = 0;
        // During calibration, stack analyzer samples span gas (typically artificial test value or zero)
        const displayedNox = isDailyCalib ? 450.0 : noxMeasured;
        records.push({
            timestamp: date.toISOString(),
            timezone: 'UTC+8',
            unit: 'Unit 1 (600 MW)',
            stack: 'Stack 1',
            unitLoadMw,
            coalFeedRateTph,
            totalCombustionAirFlow,
            flueGasO2Pct,
            furnaceExitGasTempC,
            coalSulfurPct: currentCoalSulfur,
            coalAshPct: currentCoalAsh,
            coalGcvKcalKg: currentCoalGcv,
            labResultAvailableTime: new Date(nextLabAvailableEpoch).toISOString(),
            sofaDamperPct,
            ammoniaFlowKgH,
            fgdStatus,
            limestoneSlurryFlowTph,
            absorberPh,
            espFieldsActive,
            espSecondaryCurrentMa,
            noxMeasured: displayedNox,
            so2Measured,
            pmMeasured,
            cemsValidFlag,
            cemsCalibFlag,
            cemsMaintFlag,
        });
    }
    return records;
}

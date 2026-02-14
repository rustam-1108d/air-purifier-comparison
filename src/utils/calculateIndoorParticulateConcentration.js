const calculateIndoorParticulateConcentration = ({
  ventilationRate,
  penetrationFactor = 1,
  outdoorParticulateConcentration,
  indoorParticulateGeneration,
  cadr,
  depositionRate = 0,
  roomVolume,
}) => {
  const nums = [
    ventilationRate,
    penetrationFactor,
    outdoorParticulateConcentration,
    indoorParticulateGeneration,
    cadr,
    depositionRate,
    roomVolume,
  ];

  if (nums.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    throw new TypeError("All inputs must be finite numbers.");
  }
  if (ventilationRate < 0 || cadr < 0 || depositionRate < 0 || roomVolume <= 0) {
    throw new RangeError("Rates must be >= 0 and roomVolume must be > 0.");
  }
  if (penetrationFactor < 0 || penetrationFactor > 1) {
    throw new RangeError("penetrationFactor must be between 0 and 1.");
  }

  const numerator =
    ventilationRate * penetrationFactor * outdoorParticulateConcentration +
    indoorParticulateGeneration;

  const denominator = cadr + ventilationRate + depositionRate * roomVolume;

  if (denominator <= 0) {
    throw new RangeError("Denominator must be > 0 (check inputs).");
  }

  return numerator / denominator;
};


// Example usage:
const cadr = 730; // m³/h
const outdoorPm2_5Concentration = 100; // µg/m³
const ventilationRate = 70; // m³/h
const indoorParticulateGeneration = 1000; // µg per hour
const roomVolume = 50; // m³
const depositionRate = 0; // 1/h
const penetrationFactor = 1; // dimensionless

const indoorPm2_5Concentration = calculateIndoorParticulateConcentration({
  cadr,
  outdoorParticulateConcentration: outdoorPm2_5Concentration,
  ventilationRate,
  indoorParticulateGeneration,
  roomVolume,
  depositionRate,
  penetrationFactor,
});

console.log(`Indoor PM2.5 concentration: ${indoorPm2_5Concentration.toFixed(2)} µg/m³`);

const calculateRequiredParticulateCADR = (
  outdoorParticulateConcentration,
  indoorParticulateConcentrationLimit,
  ventilationRate,
  indoorParticulateGenerationRate,
  penetrationFactor = 1,
) => {
  if (indoorParticulateConcentrationLimit <= 0) {
    throw new Error("Indoor particulate concentration limit must be greater than zero.");
  }

  // CADR = (Ventilation Rate * (Outdoor Particulate * Penetration Factor - Indoor Particulate Limit) + indoorParticulateGeneration) / indoorParticulateLimit
  const requiredCADR = (ventilationRate * (outdoorParticulateConcentration * penetrationFactor - indoorParticulateConcentrationLimit) + indoorParticulateGenerationRate) / indoorParticulateConcentrationLimit;

  return Math.max(requiredCADR, 0); // CADR cannot be negative
}

export default calculateRequiredParticulateCADR;

// Example usage:
const outdoorPm2_5Concentration = 100; // µg/m³
const indoorPm2_5ConcentrationLimit = 10; // µg/m³
const ventilationRate = 70; // m³/h
const indoorParticulateGenerationRate = 1000; // µg per hour

const requiredCADR = calculateRequiredParticulateCADR(
  outdoorPm2_5Concentration,
  indoorPm2_5ConcentrationLimit,
  ventilationRate,
  indoorParticulateGenerationRate
);

console.log(`Required CADR for PM2.5: ${requiredCADR.toFixed(2)} m³/h`);

const calculateRequiredParticulateCADR = ({
  indoorParticulateConcentrationLimit,
  outdoorParticulateConcentration,
  ventilationRate,
  indoorParticulateGenerationRate,
  roomVolume,
  depositionRate = 0,
  penetrationFactor = 1,
}) => {
  if (indoorParticulateConcentrationLimit <= 0) {
    return null; // Indoor particulate concentration limit must be greater than zero
  }

  const requiredCADR =
    (ventilationRate * outdoorParticulateConcentration * penetrationFactor -
      ventilationRate * indoorParticulateConcentrationLimit +
      indoorParticulateGenerationRate -
      depositionRate * roomVolume * indoorParticulateConcentrationLimit) /
    indoorParticulateConcentrationLimit;

  return Math.max(requiredCADR, 0); // CADR cannot be negative
}

export default calculateRequiredParticulateCADR;

// Example usage:
const indoorPm2_5ConcentrationLimit = 10; // µg/m³
const outdoorPm2_5Concentration = 100; // µg/m³
const ventilationRate = 70; // m³/h
const indoorParticulateGenerationRate = 1000; // µg per hour
const roomVolume = 50; // m³
const depositionRate = 0; // 1/h
const penetrationFactor = 1; // dimensionless

const requiredCADR = calculateRequiredParticulateCADR({
  indoorParticulateConcentrationLimit: indoorPm2_5ConcentrationLimit,
  outdoorParticulateConcentration: outdoorPm2_5Concentration,
  ventilationRate,
  indoorParticulateGenerationRate,
  roomVolume,
  depositionRate,
  penetrationFactor,
});

console.log(`Required CADR for PM2.5: ${requiredCADR.toFixed(2)} m³/h`);

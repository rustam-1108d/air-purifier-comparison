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

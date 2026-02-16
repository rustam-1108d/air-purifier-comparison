const calculatePm10PenetrationFactor = (outdoorPm2_5_ugm3, outdoorPm10_ugm3, filterPm2_5Efficiency, filterCoarseEfficiency) => {
  if (![outdoorPm2_5_ugm3, outdoorPm10_ugm3, filterPm2_5Efficiency, filterCoarseEfficiency].every(Number.isFinite)) {
    throw new Error("All parameters must be finite numbers.");
  }
  if (outdoorPm2_5_ugm3 < 0 || outdoorPm10_ugm3 < 0) {
    throw new Error("Outdoor PM concentrations must be >= 0");
  }
  if (outdoorPm2_5_ugm3 > outdoorPm10_ugm3) {
    throw new Error("Outdoor PM2.5 cannot exceed outdoor PM10");
  }
  if (filterPm2_5Efficiency < 0 || filterPm2_5Efficiency > 1 || filterCoarseEfficiency < 0 || filterCoarseEfficiency > 1) {
    throw new Error("Filter efficiencies must be in [0,1]");
  }

  if (outdoorPm10_ugm3 === 0) {
    return 0;
  }

  const outdoorCoarse_ugm3 = outdoorPm10_ugm3 - outdoorPm2_5_ugm3;

  const indoorCoarse_ugm3 = outdoorCoarse_ugm3 * (1 - filterCoarseEfficiency);
  const indoorPm2_5_ugm3 = outdoorPm2_5_ugm3 * (1 - filterPm2_5Efficiency);

  const indoorPm10_ugm3 = indoorPm2_5_ugm3 + indoorCoarse_ugm3;

  const penetrationFactor = indoorPm10_ugm3 / outdoorPm10_ugm3;
  return Math.round(penetrationFactor * 1000) / 1000;
};

export default calculatePm10PenetrationFactor;

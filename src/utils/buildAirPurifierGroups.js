import estimateFilterLifeHours from "./estimateFilterLifeHours.js";

const calculateCombinedNoiseDbA = (singleUnitDbA, quantity) =>
  singleUnitDbA + 10 * Math.log10(quantity);

const buildAirPurifierGroups = (purifiers, {
  maxCount,
  maxNoiseDbA,

  minRequiredCadr_m3ph,

  ventilation_m3ph,
  penetrationFactor = 1,
  outdoorPm10_ugm3,

  indoorPm10Gen_ugph,

  deposition_per_h = 0,
  roomVolume_m3,
}) => {
  const groups = [];

  for (const purifier of purifiers) {
    for (const speed of purifier.speedSettings) {
      for (let quantity = 1; quantity <= maxCount; quantity += 1) {
        const totalCadrM3PerHour = speed.cadrM3PerHour * quantity;

        const totalPowerWatts = speed.powerWatts * quantity;

        const combinedNoiseDbA = calculateCombinedNoiseDbA(
          speed.soundPressureLevelDbA,
          quantity
        );

        const totalCcmMg = purifier.ccmMg * quantity;

        const filterLifeEstimate = estimateFilterLifeHours({
          cadrStart_m3ph: totalCadrM3PerHour,
          ccm_mg: totalCcmMg,
          minRequiredCadr_m3ph,

          ventilation_m3ph,
          penetrationFactor,
          outdoorPm10_ugm3,

          indoorPm10Gen_ugph,

          deposition_per_h,
          roomVolume_m3,
        });

        const filterLifeHours = filterLifeEstimate.hours;


        if (totalCadrM3PerHour >= minRequiredCadr_m3ph && combinedNoiseDbA <= maxNoiseDbA) {
          groups.push({
            purifierId: purifier.id,
            brand: purifier.brand,
            model: purifier.model,
            speedId: speed.id,
            speedName: speed.modeName,
            quantity,
            totalCadrM3PerHour,
            totalPowerWatts,
            combinedNoiseDbA: Number(combinedNoiseDbA.toFixed(1)),
            totalCcmMg,
            filterLifeHours,
            filterLifeEstimate,
          });
        }
      }
    }
  }

  return groups;
};

export default buildAirPurifierGroups;

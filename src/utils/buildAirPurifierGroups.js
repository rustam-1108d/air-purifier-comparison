import estimateFilterLifeHours from "./estimateFilterLifeHours.js";

const calculateCombinedNoiseDbA = (singleUnitDbA, quantity) =>
  singleUnitDbA + 10 * Math.log10(quantity);

const buildAirPurifierGroups = (purifiers, {
  maxCount,
  maxNoiseDbA,

  minCadr,

  roomVolume_m3,
  ventilation_m3ph,
  outdoorPm10_ugm3,
  penetrationFactor,

  indoorPm10Gen_ugph,
  deposition_per_h,
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

        const filterLifeHours = estimateFilterLifeHours({
          cadrStart_m3ph: totalCadrM3PerHour,
          ccm_mg: totalCcmMg,
          minCadr_m3ph: minCadr,

          roomVolume_m3,
          ventilation_m3ph,
          outdoorPm10_ugm3,
          penetrationFactor,

          indoorPm10Gen_ugph,
          deposition_per_h
        });

        if (totalCadrM3PerHour >= minCadr && combinedNoiseDbA <= maxNoiseDbA) {
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
          });
        }
      }
    }
  }

  return groups;
};

import { airPurifiers } from "../data/airPurifiers.js";

const testFormData = {
  roomVolume: 50,
  ventilationRate: 30,
  outdoorPm10Concentration: 50,
  penetrationFactor: 1,

  indoorPm10GenerationRate: 1000,
  deposition_per_h: 0,
}
const maxAirPurifierCount = 1;
const maxCombinedNoiseDbA = 50;
const minimumCadrM3PerHour = 120;

const airPurifierGroups = buildAirPurifierGroups(
  airPurifiers,
  {
    maxCount: maxAirPurifierCount,
    maxNoiseDbA: maxCombinedNoiseDbA,
    minCadr: minimumCadrM3PerHour,

    roomVolume_m3: testFormData.roomVolume,
    ventilation_m3ph: testFormData.ventilationRate,
    outdoorPm10_ugm3: testFormData.outdoorPm10Concentration,
    penetrationFactor: testFormData.penetrationFactor,

    indoorPm10Gen_ugph: testFormData.indoorPm10GenerationRate,
    deposition_per_h: testFormData.deposition_per_h,
  }
);

console.log(airPurifierGroups);

const calculateCombinedNoiseDbA = (singleUnitDbA, quantity) =>
  singleUnitDbA + 10 * Math.log10(quantity);

const buildAirPurifierGroups = (purifiers, maxCount, maxNoiseDbA, minCadr) => {
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
          });
        }
      }
    }
  }

  return groups;
};

import { airPurifiers } from "../data/airPurifiers.js";

const maxAirPurifierCount = 3;
const maxCombinedNoiseDbA = 40;
const minimumCadrM3PerHour = 70;

const airPurifierGroups = buildAirPurifierGroups(
  airPurifiers,
  maxAirPurifierCount,
  maxCombinedNoiseDbA,
  minimumCadrM3PerHour
);

console.log(airPurifierGroups);

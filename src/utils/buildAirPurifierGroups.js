import estimateFilterLifeHours from "./estimateFilterLifeHours.js";

const calculateCombinedNoiseDbA = (singleUnitDbA, quantity) =>
  singleUnitDbA + 10 * Math.log10(quantity);

const buildAirPurifierGroups = (purifiers, {
  maxCount,
  maxNoiseDbA,

  minCadr,

  ventilation_m3ph,
  penetrationFactor = 1,
  outdoorPm10_ugm3,

  indoorPm10Gen_ugph,

  deposition_per_h = 0,
  roomVolume_m3,
}, { selectedCountry, airPurifiersPrices }) => {
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

          ventilation_m3ph,
          penetrationFactor,
          outdoorPm10_ugm3,

          indoorPm10Gen_ugph,

          deposition_per_h,
          roomVolume_m3,
        });

        const currency = airPurifiersPrices[purifier.id][selectedCountry].currency;
        const totalPurifiersPurchaseCost = airPurifiersPrices[purifier.id][selectedCountry].amount * quantity;

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
            currency,
            totalPurifiersPurchaseCost,
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
  // penetrationFactor: 1,

  indoorPm10GenerationRate: 1000,
  // deposition_per_h: 0,
}
const maxAirPurifierCount = 2;
const maxCombinedNoiseDbA = 37;
const minimumCadrM3PerHour = 30;

const selectedCountry = 'KZ';

const getAirPurifierPrices = () => Object.fromEntries(airPurifiers.map(purifier => [purifier.id, purifier.purifierPrices]));
const testAirPurifierPricesState = getAirPurifierPrices();
console.log(testAirPurifierPricesState);
console.log(testAirPurifierPricesState[airPurifiers[0].id][selectedCountry].currency);

const airPurifierGroups = buildAirPurifierGroups(
  airPurifiers,
  {
    maxCount: maxAirPurifierCount,
    maxNoiseDbA: maxCombinedNoiseDbA,
    minCadr: minimumCadrM3PerHour,

    ventilation_m3ph: testFormData.ventilationRate,
    // penetrationFactor: testFormData.penetrationFactor,
    outdoorPm10_ugm3: testFormData.outdoorPm10Concentration,

    indoorPm10Gen_ugph: testFormData.indoorPm10GenerationRate,

    // deposition_per_h: testFormData.deposition_per_h,
    roomVolume_m3: testFormData.roomVolume,
  },
  { selectedCountry,
    // currency: testAirPurifierPricesState[airPurifiers[0].id][selectedCountry].currency,
    airPurifiersPrices: testAirPurifierPricesState }
);

console.log(airPurifierGroups);

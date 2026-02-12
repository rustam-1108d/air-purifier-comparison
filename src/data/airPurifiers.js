export const airPurifiers = [
  {
    id: 1,
    brand: 'IQAir',
    model: 'HealthPro 100',
    speedSettings: [
      { id: 1, modeName: 'Speed 1', cadrM3PerHour: 50, powerWatts: 20, soundPressureLevelDbA: 22 },
      { id: 2, modeName: 'Speed 2', cadrM3PerHour: 100, powerWatts: 36, soundPressureLevelDbA: 33 },
      { id: 3, modeName: 'Speed 3', cadrM3PerHour: 170, powerWatts: 54, soundPressureLevelDbA: 41 },
      { id: 4, modeName: 'Speed 4', cadrM3PerHour: 240, powerWatts: 74, soundPressureLevelDbA: 47 },
      { id: 5, modeName: 'Speed 5', cadrM3PerHour: 330, powerWatts: 105, soundPressureLevelDbA: 52 },
      { id: 6, modeName: 'Speed 6', cadrM3PerHour: 470, powerWatts: 135, soundPressureLevelDbA: 57 },
    ],
    ccmMg: 1_013_788,
  },
  {
    id: 2,
    brand: 'Smart Air',
    model: 'Sqair with E12 filter (without carbon filter)',
    speedSettings: [
      { id: 1, modeName: 'Speed 1', cadrM3PerHour: 65, powerWatts: 6, soundPressureLevelDbA: 23 },
      { id: 2, modeName: 'Speed 2', cadrM3PerHour: 180, powerWatts: 18, soundPressureLevelDbA: 43 },
      { id: 3, modeName: 'Speed 3', cadrM3PerHour: 315, powerWatts: 38, soundPressureLevelDbA: 52 },
    ],
    ccmMg: 4468,
  },
];

console.log(airPurifiers);

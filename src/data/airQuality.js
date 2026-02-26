// Units: µg/m³
// Notes:
// - Country values are computed from WHO Ambient Air Quality Database (Update Jan 2024, V6.1) as:
//   mean of each country's cities, using the latest year per city where BOTH PM2.5 and PM10 are present.
// - Almaty (ALA) is not present in WHO V6.1 as a city entry; PM2.5 is taken from Almaty Air Initiative’s 2025 summary.
// - PM10 for KZ and ALA is an estimate derived from the mean PM10/PM2.5 ratio across the WHO city records (~1.8x).
const airQualityByLocation = {
  countries: [
    { countryCode: "CN", pm2_5: 47.91, pm10: 81.74, updatedAt: "2019-12-31" },
    { countryCode: "KZ", pm2_5: 21.77, pm10: (21.77 * 1.8), updatedAt: "2019-12-31" }, // PM10 estimated
    { countryCode: "RU", pm2_5: 14.0, pm10: 28.0, updatedAt: "2016-12-31" },
    { countryCode: "UK", pm2_5: 9.19, pm10: 15.39, updatedAt: "2020-12-31" },
    { countryCode: "US", pm2_5: 8.38, pm10: 19.74, updatedAt: "2021-12-31" },
  ],
  cities: [
    { cityId: "SHA", countryCode: "CN", pm2_5: 45.55, pm10: 59.0, updatedAt: "2016-12-31" },
    { cityId: "ALA", countryCode: "KZ", pm2_5: 31.2, pm10: (31.2 * 1.8), updatedAt: "2025-12-31" }, // PM10 estimated
    { cityId: "MOW", countryCode: "RU", pm2_5: 14.0, pm10: 28.0, updatedAt: "2016-12-31" },
    { cityId: "LON", countryCode: "UK", pm2_5: 11.21, pm10: 19.4, updatedAt: "2019-12-31" },
    { cityId: "NYC", countryCode: "US", pm2_5: 7.65, pm10: 16.7, updatedAt: "2021-12-31" },
  ],
};

export const getInitialAirQualityByCountry = () =>
  Object.fromEntries(
    airQualityByLocation.countries.map(({ countryCode, pm2_5, pm10 }) => [
      countryCode,
      {
        outdoorPm2_5Concentration: pm2_5,
        outdoorPm10Concentration: pm10,
      },
    ])
  );

export const getInitialAirQualityByCity = () =>
  Object.fromEntries(
    airQualityByLocation.cities.map(({ cityId, pm2_5, pm10 }) => [
      cityId,
      {
        outdoorPm2_5Concentration: pm2_5,
        outdoorPm10Concentration: pm10,
      },
    ])
  );

export default airQualityByLocation;

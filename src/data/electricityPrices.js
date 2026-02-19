const electricityPricesByLocation = {
  countries: [
    { countryCode: 'CN', pricePerKwh: 0.520, currency: 'CNY', updatedAt: '2026-02-19' },
    { countryCode: 'KZ', pricePerKwh: 30.56, currency: 'KZT', updatedAt: '2026-02-19' },
    { countryCode: 'RU', pricePerKwh: 5.53, currency: 'RUB', updatedAt: '2026-02-19' },
    { countryCode: 'UK', pricePerKwh: 0.2769, currency: 'GBP', updatedAt: '2026-02-19' },
    { countryCode: 'US', pricePerKwh: 0.1778, currency: 'USD', updatedAt: '2026-02-19' },
  ],
  cities: [
    { cityId: 'SHA', countryCode: 'CN', pricePerKwh: 0.617, currency: 'CNY', updatedAt: '2026-02-19' },
    { cityId: 'ALA', countryCode: 'KZ', pricePerKwh: 32.33, currency: 'KZT', updatedAt: '2026-02-19' },
    { cityId: 'MOW', countryCode: 'RU', pricePerKwh: 7.28, currency: 'RUB', updatedAt: '2026-02-19' },
    { cityId: 'LON', countryCode: 'UK', pricePerKwh: 0.2700, currency: 'GBP', updatedAt: '2026-02-19' },
    { cityId: 'NYC', countryCode: 'US', pricePerKwh: 0.3382, currency: 'USD', updatedAt: '2026-02-19' },
  ],
};

export const getInitialElectricityPriceByCountry = () =>
  Object.fromEntries(
    electricityPricesByLocation.countries.map(({ countryCode, pricePerKwh }) => [countryCode, pricePerKwh])
  );

export const getInitialElectricityPriceByCity = () =>
  Object.fromEntries(
    electricityPricesByLocation.cities.map(({ cityId, pricePerKwh }) => [cityId, pricePerKwh])
  );

export default electricityPricesByLocation;

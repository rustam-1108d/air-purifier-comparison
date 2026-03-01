import countries from '../data/countries.js';
import { getInitialElectricityPriceByCountry } from '../data/electricityPrices.js';
import { getInitialAirQualityByCountry } from '../data/airQuality.js';
import { airPurifiers } from '../data/airPurifiers.js';

export const buildInitialElectricityPricesByCountry = () => {
  const initialElectricityPrices = getInitialElectricityPriceByCountry();
  return Object.fromEntries(countries.map((country) => [country.code, initialElectricityPrices[country.code] ?? null]));
};

export const buildInitialAirQualityByCountry = () => {
  const initialAirQuality = getInitialAirQualityByCountry();
  return Object.fromEntries(
    countries.map((country) => [
      country.code,
      initialAirQuality[country.code] ?? {
        outdoorPm2_5Concentration: null,
        outdoorPm10Concentration: null,
      },
    ])
  );
};

export const buildInitialAirPurifierPricesByCountry = () => Object.fromEntries(
  airPurifiers.map((purifier) => [
    purifier.id,
    Object.fromEntries(
      countries.map((country) => [
        country.code,
        purifier.purifierPrices?.[country.code]?.amount ?? null,
      ])
    ),
  ])
);

export const buildInitialFilterPricesByCountry = () => Object.fromEntries(
  airPurifiers.map((purifier) => [
    purifier.id,
    Object.fromEntries(
      countries.map((country) => [
        country.code,
        purifier.filterPrices?.[country.code]?.amount ?? null,
      ])
    ),
  ])
);

export const buildInitialMaxFilterUsageHoursByPurifier = () => (
  Object.fromEntries(airPurifiers.map((purifier) => [purifier.id, null]))
);

export const getInitialTheme = (themeStorageKey) => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const getInitialLanguage = (languageStorageKey) => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const savedLanguage = window.localStorage.getItem(languageStorageKey);
  if (savedLanguage === 'en' || savedLanguage === 'ru') {
    return savedLanguage;
  }

  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

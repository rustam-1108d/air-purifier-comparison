export const DEFAULT_DECIMAL_PLACES = 4;
export const DEFAULT_INTEGER_DIGITS = 9;
export const MIN_ANNUAL_OPERATING_HOURS = 0;
export const MAX_ANNUAL_OPERATING_HOURS = 8784;
export const MIN_OWNERSHIP_YEARS = 1;
export const MAX_OWNERSHIP_YEARS = 99;

export const FORM_DECIMAL_PLACES_BY_FIELD = {
  indoorPm2_5AnnualAverageConcentrationLimit: 4,
  indoorPm10AnnualAverageConcentrationLimit: 4,
  ventilationRate: 4,
  indoorPm2_5GenerationRate: 4,
  indoorPm10GenerationRate: 4,
  roomVolume: 4,
  maxCombinedNoiseDbA: 4,
};

export const FORM_INTEGER_DIGITS_BY_FIELD = {
  indoorPm2_5AnnualAverageConcentrationLimit: 4,
  indoorPm10AnnualAverageConcentrationLimit: 4,
  ventilationRate: 5,
  indoorPm2_5GenerationRate: 7,
  indoorPm10GenerationRate: 7,
  roomVolume: 5,
  maxCombinedNoiseDbA: 3,
};

export const LOCATION_DECIMAL_PLACES = {
  electricityPrice: 4,
  outdoorPm2_5: 4,
  outdoorPm10: 4,
  purifierPrice: 4,
  filterPrice: 4,
};

export const LOCATION_INTEGER_DIGITS = {
  electricityPrice: 6,
  outdoorPm2_5: 4,
  outdoorPm10: 4,
  purifierPrice: 7,
  filterPrice: 7,
};

export const FILTER_USAGE_LIMIT_DECIMAL_PLACES = 2;
export const FILTER_USAGE_LIMIT_INTEGER_DIGITS = 7;
export const GROUPING_SEPARATOR = '\u202F';

export const THEME_STORAGE_KEY = 'app-theme';
export const LANGUAGE_STORAGE_KEY = 'app-language';

export const INITIAL_FORM = {
  indoorPm2_5AnnualAverageConcentrationLimit: 5,
  indoorPm10AnnualAverageConcentrationLimit: 15,
  ventilationRate: 30,
  indoorPm2_5GenerationRate: 0,
  indoorPm10GenerationRate: 0,
  roomVolume: 50,
  maxAirPurifierCount: 2,
  maxCombinedNoiseDbA: 40,
  annualOperatingHours: 8760,
  ownershipYears: 5,
};

export const DEFAULT_SORT_CONFIG = { key: 'totalCostOfOwnership', direction: 'asc' };

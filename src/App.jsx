import { useEffect, useMemo, useState } from 'react'

import calculateRequiredParticulateCADR from './utils/calculateRequiredParticulateCADR';
import buildAirPurifierGroups from './utils/buildAirPurifierGroups';

import countries from './data/countries.js';
import cities from './data/cities.js';
import { getInitialElectricityPriceByCountry, getInitialElectricityPriceByCity } from './data/electricityPrices.js';
import { getInitialAirQualityByCountry, getInitialAirQualityByCity } from './data/airQuality.js';
import { airPurifiers } from './data/airPurifiers.js';
import { translations } from './i18n/translations.js';

import './App.css'

const DEFAULT_DECIMAL_PLACES = 4;
const DEFAULT_INTEGER_DIGITS = 9;
const MIN_ANNUAL_OPERATING_HOURS = 0;
const MAX_ANNUAL_OPERATING_HOURS = 8784;
const MIN_OWNERSHIP_YEARS = 1;
const MAX_OWNERSHIP_YEARS = 99;

const FORM_DECIMAL_PLACES_BY_FIELD = {
  indoorPm2_5AnnualAverageConcentrationLimit: 4,
  indoorPm10AnnualAverageConcentrationLimit: 4,
  ventilationRate: 4,
  indoorPm2_5GenerationRate: 4,
  indoorPm10GenerationRate: 4,
  roomVolume: 4,
  maxCombinedNoiseDbA: 4,
};

const FORM_INTEGER_DIGITS_BY_FIELD = {
  indoorPm2_5AnnualAverageConcentrationLimit: 4,
  indoorPm10AnnualAverageConcentrationLimit: 4,
  ventilationRate: 5,
  indoorPm2_5GenerationRate: 7,
  indoorPm10GenerationRate: 7,
  roomVolume: 5,
  maxCombinedNoiseDbA: 3,
};

const LOCATION_DECIMAL_PLACES = {
  electricityPrice: 4,
  outdoorPm2_5: 4,
  outdoorPm10: 4,
  purifierPrice: 4,
  filterPrice: 4,
};

const LOCATION_INTEGER_DIGITS = {
  electricityPrice: 6,
  outdoorPm2_5: 4,
  outdoorPm10: 4,
  purifierPrice: 7,
  filterPrice: 7,
};

const FILTER_USAGE_LIMIT_DECIMAL_PLACES = 2;
const FILTER_USAGE_LIMIT_INTEGER_DIGITS = 7;
const GROUPING_SEPARATOR = '\u202F';

const normalizeDecimalInput = (value) => value.replace(/[\s\u202F]/g, '').replace(/,/g, '.');

const isValidDecimalInput = (
  value,
  maxDecimalPlaces = DEFAULT_DECIMAL_PLACES,
  maxIntegerDigits = DEFAULT_INTEGER_DIGITS,
) => {
  const pattern = new RegExp(`^\\d{0,${maxIntegerDigits}}(\\.\\d{0,${maxDecimalPlaces}})?$`);
  return pattern.test(value);
};

const parseDecimalForForm = (value) => (value === '' || value === '.' ? '' : Number(value));

const parseDecimalForNullable = (value) => (value === '' || value === '.' ? null : Number(value));

const formatIntegerInputString = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, GROUPING_SEPARATOR);
};

const formatDecimalInputString = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const rawValue = String(value);
  if (rawValue === '.') {
    return '.';
  }

  const hasDot = rawValue.includes('.');
  const [integerPart, fractionalPart = ''] = rawValue.split('.');
  const formattedIntegerPart = formatIntegerInputString(integerPart);

  return hasDot ? `${formattedIntegerPart}.${fractionalPart}` : formattedIntegerPart;
};

const countMatchingCharacters = (value, matcher) => (
  Array.from(value).reduce((count, character) => (matcher(character) ? count + 1 : count), 0)
);

const getCaretPositionForRawIndex = (formattedValue, rawIndex, matcher) => {
  if (rawIndex <= 0) {
    return 0;
  }

  let matchedCharacterCount = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (matcher(formattedValue[index])) {
      matchedCharacterCount += 1;
    }

    if (matchedCharacterCount >= rawIndex) {
      return index + 1;
    }
  }

  return formattedValue.length;
};

const scheduleCaretPosition = ({
  input,
  nextDisplayValue,
  rawIndex,
  matcher,
}) => {
  if (!input) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (document.activeElement !== input) {
      return;
    }

    const caretPosition = getCaretPositionForRawIndex(nextDisplayValue, rawIndex, matcher);
    input.setSelectionRange(caretPosition, caretPosition);
  });
};

const isDigitCharacter = (character) => /\d/.test(character);
const isDecimalCharacter = (character) => /[\d.]/.test(character);

const formatGroupedNumber = (
  value,
  {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {},
  locale = 'en-US',
) => {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }

  const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping: true,
    });

  return formatter
    .formatToParts(value)
    .map((part) => (part.type === 'group' ? GROUPING_SEPARATOR : part.value))
    .join('');
};

const getFilterUsageLimitValidationMessage = (value, filterUsageLimitPositiveMessage) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  return value <= 0 ? filterUsageLimitPositiveMessage : null;
};

const getPm10IncludesPm2_5ValidationMessage = (pm2_5Value, pm10Value, pm10MustIncludePm25Message) => {
  if (!Number.isFinite(pm2_5Value) || !Number.isFinite(pm10Value)) {
    return null;
  }

  return pm10Value < pm2_5Value ? pm10MustIncludePm25Message : null;
};

const THEME_STORAGE_KEY = 'app-theme';
const LANGUAGE_STORAGE_KEY = 'app-language';

const INITIAL_FORM = {
  indoorPm2_5AnnualAverageConcentrationLimit: 5,
  indoorPm10AnnualAverageConcentrationLimit: 15,
  ventilationRate: 30,
  indoorPm2_5GenerationRate: 0,
  indoorPm10GenerationRate: 0,
  roomVolume: 50,
  maxAirPurifierCount: 2,
  maxCombinedNoiseDbA: 37,
  annualOperatingHours: 8760,
  ownershipYears: 5,
};

const buildInitialElectricityPricesByCountry = () => {
  const initialElectricityPrices = getInitialElectricityPriceByCountry();
  return Object.fromEntries(countries.map((country) => [country.code, initialElectricityPrices[country.code] ?? null]));
};

const buildInitialAirQualityByCountry = () => {
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

const buildInitialAirPurifierPricesByCountry = () => Object.fromEntries(
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

const buildInitialFilterPricesByCountry = () => Object.fromEntries(
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

const buildInitialMaxFilterUsageHoursByPurifier = () => (
  Object.fromEntries(airPurifiers.map((purifier) => [purifier.id, null]))
);

const DEFAULT_SORT_CONFIG = { key: 'totalCostOfOwnership', direction: 'asc' };

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage === 'en' || savedLanguage === 'ru') {
    return savedLanguage;
  }

  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [selectedCountry, setSelectedCountry] = useState(countries[0].code);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [electricityPricesByCountry, setElectricityPricesByCountry] = useState(
    () => buildInitialElectricityPricesByCountry()
  );
  const [electricityPricesByCity, setElectricityPricesByCity] = useState(
    () => getInitialElectricityPriceByCity()
  );
  const [airQualityByCountry, setAirQualityByCountry] = useState(
    () => buildInitialAirQualityByCountry()
  );
  const [airQualityByCity, setAirQualityByCity] = useState(
    () => getInitialAirQualityByCity()
  );
  const [airPurifierPricesByCountry, setAirPurifierPricesByCountry] = useState(
    () => buildInitialAirPurifierPricesByCountry()
  );
  const [filterPricesByCountry, setFilterPricesByCountry] = useState(
    () => buildInitialFilterPricesByCountry()
  );
  const [maxFilterUsageHoursGlobal, setMaxFilterUsageHoursGlobal] = useState(null);
  const [maxFilterUsageHoursByPurifier, setMaxFilterUsageHoursByPurifier] = useState(
    () => buildInitialMaxFilterUsageHoursByPurifier()
  );
  const [inputDrafts, setInputDrafts] = useState({});
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT_CONFIG);
  const [activeTooltip, setActiveTooltip] = useState(null);
  // console.log('Electricity Prices by Country:', electricityPricesByCountry);
  // console.log('Electricity Prices by City:', electricityPricesByCity);
  // console.log('Air Purifier Prices by Country:', airPurifierPricesByCountry);
  // console.log('Filter Prices by Country:', filterPricesByCountry);

  const [form, setForm] = useState(INITIAL_FORM);
  const copy = translations[language];
  const numberLocale = language === 'ru' ? 'ru-RU' : 'en-US';
  const formatNumber = (value, options) => (
    Number.isFinite(value) ? formatGroupedNumber(value, options, numberLocale) : copy.notAvailable
  );

  const currentAirQuality = selectedCityId
    ? (airQualityByCity[selectedCityId] ?? null)
    : (airQualityByCountry[selectedCountry] ?? null);

  const outdoorPm2_5AnnualAverageConcentration = currentAirQuality?.outdoorPm2_5Concentration ?? null;
  const outdoorPm10AnnualAverageConcentration = currentAirQuality?.outdoorPm10Concentration ?? null;

  const requiredPm2_5CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm2_5AnnualAverageConcentrationLimit,
    outdoorParticulateConcentration: outdoorPm2_5AnnualAverageConcentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm2_5GenerationRate,
    roomVolume: form.roomVolume,
  });

  const requiredPm10CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm10AnnualAverageConcentrationLimit,
    outdoorParticulateConcentration: outdoorPm10AnnualAverageConcentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm10GenerationRate,
    roomVolume: form.roomVolume,
  });

  const minimumRequiredCADR = Math.max(requiredPm2_5CADR ?? 0, requiredPm10CADR ?? 0);

  const selectedCountryData = countries.find((country) => country.code === selectedCountry);
  const selectedCountryCurrency = selectedCountryData?.currency;
  const availableCities = cities.filter((city) => city.countryCode === selectedCountry);

  const currentElectricityPrice = selectedCityId
    ? (electricityPricesByCity[selectedCityId] ?? null)
    : (electricityPricesByCountry[selectedCountry] ?? null);

  const annualOperatingHoursValidationMessage = form.annualOperatingHours === ''
    ? copy.annualOperatingHoursRequired
    : form.annualOperatingHours < MIN_ANNUAL_OPERATING_HOURS || form.annualOperatingHours > MAX_ANNUAL_OPERATING_HOURS
      ? copy.annualOperatingHoursBetween(MIN_ANNUAL_OPERATING_HOURS, MAX_ANNUAL_OPERATING_HOURS)
      : null;
  const isAnnualOperatingHoursValid = annualOperatingHoursValidationMessage === null;

  const ownershipYearsValidationMessage = form.ownershipYears === ''
    ? copy.ownershipYearsRequired
    : form.ownershipYears < MIN_OWNERSHIP_YEARS || form.ownershipYears > MAX_OWNERSHIP_YEARS
      ? copy.ownershipYearsBetween(MIN_OWNERSHIP_YEARS, MAX_OWNERSHIP_YEARS)
      : null;
  const outdoorPmHierarchyValidationMessage = getPm10IncludesPm2_5ValidationMessage(
    outdoorPm2_5AnnualAverageConcentration,
    outdoorPm10AnnualAverageConcentration,
    copy.pm10MustIncludePm25(copy.outdoorAnnualConcentration)
  );
  const indoorLimitPmHierarchyValidationMessage = getPm10IncludesPm2_5ValidationMessage(
    form.indoorPm2_5AnnualAverageConcentrationLimit,
    form.indoorPm10AnnualAverageConcentrationLimit,
    copy.pm10MustIncludePm25(copy.indoorConcentrationLimit)
  );
  const indoorGenerationPmHierarchyValidationMessage = getPm10IncludesPm2_5ValidationMessage(
    form.indoorPm2_5GenerationRate,
    form.indoorPm10GenerationRate,
    copy.pm10MustIncludePm25(copy.indoorGenerationRate)
  );
  const maxFilterUsageHoursGlobalValidationMessage = getFilterUsageLimitValidationMessage(maxFilterUsageHoursGlobal, copy.filterUsageLimitPositive);
  const isOwnershipYearsValid = ownershipYearsValidationMessage === null;
  const isCostPeriodValid = isAnnualOperatingHoursValid && isOwnershipYearsValid;

  const hasValidGroupInputs = Number.isFinite(minimumRequiredCADR)
    && Number.isFinite(form.maxAirPurifierCount)
    && Number.isFinite(form.maxCombinedNoiseDbA)
    && Number.isFinite(form.ventilationRate)
    && Number.isFinite(outdoorPm10AnnualAverageConcentration)
    && Number.isFinite(form.indoorPm10GenerationRate)
    && Number.isFinite(form.roomVolume)
    && form.maxAirPurifierCount > 0
    && form.maxCombinedNoiseDbA >= 0
    && form.ventilationRate >= 0
    && outdoorPm10AnnualAverageConcentration >= 0
    && form.indoorPm10GenerationRate >= 0
    && form.roomVolume > 0
    && outdoorPmHierarchyValidationMessage === null
    && indoorLimitPmHierarchyValidationMessage === null
    && indoorGenerationPmHierarchyValidationMessage === null;

  const airPurifierGroups = useMemo(() => {
    if (!hasValidGroupInputs || minimumRequiredCADR <= 0) {
      return [];
    }

    return buildAirPurifierGroups(airPurifiers, {
      maxCount: form.maxAirPurifierCount,
      maxNoiseDbA: form.maxCombinedNoiseDbA,
      minRequiredCadr_m3ph: minimumRequiredCADR,
      ventilation_m3ph: form.ventilationRate,
      outdoorPm10_ugm3: outdoorPm10AnnualAverageConcentration,
      indoorPm10Gen_ugph: form.indoorPm10GenerationRate,
      roomVolume_m3: form.roomVolume,
    });
  }, [
    hasValidGroupInputs,
    minimumRequiredCADR,
    form.maxAirPurifierCount,
    form.maxCombinedNoiseDbA,
    form.ventilationRate,
    outdoorPm10AnnualAverageConcentration,
    form.indoorPm10GenerationRate,
    form.roomVolume,
  ]);

  const airPurifierGroupsWithCosts = useMemo(() => {
    const ownershipPeriodHours = isCostPeriodValid
      ? form.annualOperatingHours * form.ownershipYears
      : null;

    return airPurifierGroups.map((group) => {
      const purifierUnitPrice = airPurifierPricesByCountry[group.purifierId]?.[selectedCountry] ?? null;
      const filterUnitPrice = filterPricesByCountry[group.purifierId]?.[selectedCountry] ?? null;
      const purifierSpecificMaxFilterUsageHours = maxFilterUsageHoursByPurifier[group.purifierId] ?? null;
      const applicableMaxFilterUsageHours = Number.isFinite(purifierSpecificMaxFilterUsageHours) && purifierSpecificMaxFilterUsageHours > 0
        ? purifierSpecificMaxFilterUsageHours
        : (Number.isFinite(maxFilterUsageHoursGlobal) && maxFilterUsageHoursGlobal > 0
          ? maxFilterUsageHoursGlobal
          : null);

      const effectiveFilterLifeHours = Number.isFinite(group.filterLifeHours) && group.filterLifeHours > 0
        ? (Number.isFinite(applicableMaxFilterUsageHours)
          ? Math.min(group.filterLifeHours, applicableMaxFilterUsageHours)
          : group.filterLifeHours)
        : null;

      const purchaseCost = Number.isFinite(purifierUnitPrice)
        ? purifierUnitPrice * group.quantity
        : null;

      const electricityCost = Number.isFinite(currentElectricityPrice) && Number.isFinite(ownershipPeriodHours)
        ? (group.totalPowerWatts / 1000) * ownershipPeriodHours * currentElectricityPrice
        : null;

      const filterReplacements = Number.isFinite(effectiveFilterLifeHours) && effectiveFilterLifeHours > 0 && Number.isFinite(ownershipPeriodHours)
        ? Math.max(0, Math.ceil(ownershipPeriodHours / effectiveFilterLifeHours) - 1)
        : null;

      const filterCost = Number.isFinite(filterUnitPrice) && Number.isFinite(filterReplacements)
        ? filterUnitPrice * group.quantity * filterReplacements
        : null;

      const totalCostOfOwnership = Number.isFinite(purchaseCost)
        && Number.isFinite(electricityCost)
        && Number.isFinite(filterCost)
        ? purchaseCost + electricityCost + filterCost
        : null;

      return {
        ...group,
        ownershipPeriodHours,
        appliedMaxFilterUsageHours: applicableMaxFilterUsageHours,
        effectiveFilterLifeHours,
        purchaseCost,
        electricityCost,
        filterReplacements,
        filterCost,
        totalCostOfOwnership,
      };
    });
  }, [
    airPurifierGroups,
    form.annualOperatingHours,
    form.ownershipYears,
    isCostPeriodValid,
    airPurifierPricesByCountry,
    filterPricesByCountry,
    maxFilterUsageHoursGlobal,
    maxFilterUsageHoursByPurifier,
    selectedCountry,
    currentElectricityPrice,
  ]);

  const sortedAirPurifierGroupsWithCosts = useMemo(() => {
    if (!sortConfig.key) {
      return airPurifierGroupsWithCosts;
    }

    const sorted = [...airPurifierGroupsWithCosts].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });

    return sortConfig.direction === 'asc' ? sorted : sorted.reverse();
  }, [airPurifierGroupsWithCosts, sortConfig]);

  const bestValueGroup = useMemo(() => {
    const groupsWithCompleteCosts = airPurifierGroupsWithCosts.filter(
      (group) => Number.isFinite(group.totalCostOfOwnership)
    );

    if (groupsWithCompleteCosts.length === 0) {
      return null;
    }

    return groupsWithCompleteCosts.reduce((bestGroup, currentGroup) => (
      currentGroup.totalCostOfOwnership < bestGroup.totalCostOfOwnership ? currentGroup : bestGroup
    ));
  }, [airPurifierGroupsWithCosts]);

  const electricityDraftKey = selectedCityId
    ? `electricity-city-${selectedCityId}`
    : `electricity-country-${selectedCountry}`;
  const pm2_5DraftKey = selectedCityId
    ? `pm2_5-city-${selectedCityId}`
    : `pm2_5-country-${selectedCountry}`;
  const pm10DraftKey = selectedCityId
    ? `pm10-city-${selectedCityId}`
    : `pm10-country-${selectedCountry}`;

  // console.log(form);
  // console.log('availableCities:', availableCities);
  // console.log('selectedCountryData:', selectedCountryData);
  // console.log('Current Electricity Price:', currentElectricityPrice);

  const decimalFormFieldNames = new Set(Object.keys(FORM_DECIMAL_PLACES_BY_FIELD));

  const handleChange = (e) => {
    const inputElement = e.target;
    const { name, value } = inputElement;
    const cursorPosition = inputElement.selectionStart ?? value.length;

    if (decimalFormFieldNames.has(name)) {
      const normalizedValue = normalizeDecimalInput(value);
      const normalizedValueBeforeCursor = normalizeDecimalInput(value.slice(0, cursorPosition));
      const maxDecimalPlaces = FORM_DECIMAL_PLACES_BY_FIELD[name] ?? DEFAULT_DECIMAL_PLACES;
      const maxIntegerDigits = FORM_INTEGER_DIGITS_BY_FIELD[name] ?? DEFAULT_INTEGER_DIGITS;

      if (!isValidDecimalInput(normalizedValue, maxDecimalPlaces, maxIntegerDigits)) {
        return;
      }

      const parsedValue = parseDecimalForForm(normalizedValue);

      setInputDrafts((prev) => ({
        ...prev,
        [name]: normalizedValue,
      }));

      setForm((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));

      scheduleCaretPosition({
        input: inputElement,
        nextDisplayValue: formatDecimalInputString(normalizedValue),
        rawIndex: countMatchingCharacters(normalizedValueBeforeCursor, isDecimalCharacter),
        matcher: isDecimalCharacter,
      });
      return;
    }

    const numericValue = value.replace(/\D/g, '');
    const digitsBeforeCursor = countMatchingCharacters(value.slice(0, cursorPosition), isDigitCharacter);

    if (name === 'annualOperatingHours' && numericValue !== '') {
      const parsedHours = Number(numericValue);
      if (parsedHours > MAX_ANNUAL_OPERATING_HOURS) {
        return;
      }
    }

    if (name === 'ownershipYears' && numericValue !== '') {
      const parsedYears = Number(numericValue);
      if (parsedYears > MAX_OWNERSHIP_YEARS) {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: numericValue === "" ? "" : Number(numericValue),
    }));

    scheduleCaretPosition({
      input: inputElement,
      nextDisplayValue: formatIntegerInputString(numericValue),
      rawIndex: digitsBeforeCursor,
      matcher: isDigitCharacter,
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (decimalFormFieldNames.has(name)) {
      setInputDrafts((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });

      if (value === '' || value === '.') {
        setForm((prev) => ({
          ...prev,
          [name]: 0,
        }));
      }
      return;
    }

    // If the input is empty, set it to 0 on blur
    if (value === "") {
      setForm((prev) => ({
        ...prev,
        [name]: 0,
      }));
    }
  };

  const handleLocationDecimalInputChange = ({
    value,
    cursorPosition,
    inputElement,
    draftKey,
    onCountryUpdate,
    onCityUpdate,
    maxDecimalPlaces = DEFAULT_DECIMAL_PLACES,
    maxIntegerDigits = DEFAULT_INTEGER_DIGITS,
  }) => {
    const normalizedValue = normalizeDecimalInput(value);
    const normalizedValueBeforeCursor = normalizeDecimalInput(value.slice(0, cursorPosition ?? value.length));

    if (!isValidDecimalInput(normalizedValue, maxDecimalPlaces, maxIntegerDigits)) {
      return;
    }

    const parsedValue = parseDecimalForNullable(normalizedValue);

    setInputDrafts((prev) => ({
      ...prev,
      [draftKey]: normalizedValue,
    }));

    if (selectedCityId && onCityUpdate) {
      onCityUpdate(parsedValue);
      scheduleCaretPosition({
        input: inputElement,
        nextDisplayValue: formatDecimalInputString(normalizedValue),
        rawIndex: countMatchingCharacters(normalizedValueBeforeCursor, isDecimalCharacter),
        matcher: isDecimalCharacter,
      });
      return;
    }

    onCountryUpdate(parsedValue);

    scheduleCaretPosition({
      input: inputElement,
      nextDisplayValue: formatDecimalInputString(normalizedValue),
      rawIndex: countMatchingCharacters(normalizedValueBeforeCursor, isDecimalCharacter),
      matcher: isDecimalCharacter,
    });
  };

  const handleElectricityPriceChange = (e) => {
    handleLocationDecimalInputChange({
      value: e.target.value,
      cursorPosition: e.target.selectionStart,
      inputElement: e.target,
      draftKey: electricityDraftKey,
      maxDecimalPlaces: LOCATION_DECIMAL_PLACES.electricityPrice,
      maxIntegerDigits: LOCATION_INTEGER_DIGITS.electricityPrice,
      onCityUpdate: (parsedValue) => {
        setElectricityPricesByCity((prev) => ({
          ...prev,
          [selectedCityId]: parsedValue,
        }));
      },
      onCountryUpdate: (parsedValue) => {
        setElectricityPricesByCountry((prev) => ({
          ...prev,
          [selectedCountry]: parsedValue,
        }));
      },
    });
  };

  const handleOutdoorPm2_5Change = (e) => {
    handleLocationDecimalInputChange({
      value: e.target.value,
      cursorPosition: e.target.selectionStart,
      inputElement: e.target,
      draftKey: pm2_5DraftKey,
      maxDecimalPlaces: LOCATION_DECIMAL_PLACES.outdoorPm2_5,
      maxIntegerDigits: LOCATION_INTEGER_DIGITS.outdoorPm2_5,
      onCityUpdate: (parsedValue) => {
        setAirQualityByCity((prev) => ({
          ...prev,
          [selectedCityId]: {
            ...(prev[selectedCityId] ?? {}),
            outdoorPm2_5Concentration: parsedValue,
          },
        }));
      },
      onCountryUpdate: (parsedValue) => {
        setAirQualityByCountry((prev) => ({
          ...prev,
          [selectedCountry]: {
            ...(prev[selectedCountry] ?? {}),
            outdoorPm2_5Concentration: parsedValue,
          },
        }));
      },
    });
  };

  const handleOutdoorPm10Change = (e) => {
    handleLocationDecimalInputChange({
      value: e.target.value,
      cursorPosition: e.target.selectionStart,
      inputElement: e.target,
      draftKey: pm10DraftKey,
      maxDecimalPlaces: LOCATION_DECIMAL_PLACES.outdoorPm10,
      maxIntegerDigits: LOCATION_INTEGER_DIGITS.outdoorPm10,
      onCityUpdate: (parsedValue) => {
        setAirQualityByCity((prev) => ({
          ...prev,
          [selectedCityId]: {
            ...(prev[selectedCityId] ?? {}),
            outdoorPm10Concentration: parsedValue,
          },
        }));
      },
      onCountryUpdate: (parsedValue) => {
        setAirQualityByCountry((prev) => ({
          ...prev,
          [selectedCountry]: {
            ...(prev[selectedCountry] ?? {}),
            outdoorPm10Concentration: parsedValue,
          },
        }));
      },
    });
  };

  const handleAirPurifierPriceChange = (purifierId, event) => {
    const draftKey = `purifier-${purifierId}-${selectedCountry}`;

    handleLocationDecimalInputChange({
      value: event.target.value,
      cursorPosition: event.target.selectionStart,
      inputElement: event.target,
      draftKey,
      maxDecimalPlaces: LOCATION_DECIMAL_PLACES.purifierPrice,
      maxIntegerDigits: LOCATION_INTEGER_DIGITS.purifierPrice,
      onCountryUpdate: (parsedValue) => {
        setAirPurifierPricesByCountry((prev) => ({
          ...prev,
          [purifierId]: {
            ...prev[purifierId],
            [selectedCountry]: parsedValue,
          },
        }));
      },
    });
  };

  const handleFilterPriceChange = (purifierId, event) => {
    const draftKey = `filter-${purifierId}-${selectedCountry}`;

    handleLocationDecimalInputChange({
      value: event.target.value,
      cursorPosition: event.target.selectionStart,
      inputElement: event.target,
      draftKey,
      maxDecimalPlaces: LOCATION_DECIMAL_PLACES.filterPrice,
      maxIntegerDigits: LOCATION_INTEGER_DIGITS.filterPrice,
      onCountryUpdate: (parsedValue) => {
        setFilterPricesByCountry((prev) => ({
          ...prev,
          [purifierId]: {
            ...prev[purifierId],
            [selectedCountry]: parsedValue,
          },
        }));
      },
    });
  };

  const handleMaxFilterUsageGlobalChange = (e) => {
    const draftKey = 'max-filter-usage-global';
    const normalizedValue = normalizeDecimalInput(e.target.value);
    const normalizedValueBeforeCursor = normalizeDecimalInput(
      e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length)
    );

    if (!isValidDecimalInput(normalizedValue, FILTER_USAGE_LIMIT_DECIMAL_PLACES, FILTER_USAGE_LIMIT_INTEGER_DIGITS)) {
      return;
    }

    setInputDrafts((prev) => ({
      ...prev,
      [draftKey]: normalizedValue,
    }));

    setMaxFilterUsageHoursGlobal(parseDecimalForNullable(normalizedValue));

    scheduleCaretPosition({
      input: e.target,
      nextDisplayValue: formatDecimalInputString(normalizedValue),
      rawIndex: countMatchingCharacters(normalizedValueBeforeCursor, isDecimalCharacter),
      matcher: isDecimalCharacter,
    });
  };

  const handleMaxFilterUsageByPurifierChange = (purifierId, event) => {
    const draftKey = `max-filter-usage-${purifierId}`;
    const normalizedValue = normalizeDecimalInput(event.target.value);
    const normalizedValueBeforeCursor = normalizeDecimalInput(
      event.target.value.slice(0, event.target.selectionStart ?? event.target.value.length)
    );

    if (!isValidDecimalInput(normalizedValue, FILTER_USAGE_LIMIT_DECIMAL_PLACES, FILTER_USAGE_LIMIT_INTEGER_DIGITS)) {
      return;
    }

    setInputDrafts((prev) => ({
      ...prev,
      [draftKey]: normalizedValue,
    }));

    setMaxFilterUsageHoursByPurifier((prev) => ({
      ...prev,
      [purifierId]: parseDecimalForNullable(normalizedValue),
    }));

    scheduleCaretPosition({
      input: event.target,
      nextDisplayValue: formatDecimalInputString(normalizedValue),
      rawIndex: countMatchingCharacters(normalizedValueBeforeCursor, isDecimalCharacter),
      matcher: isDecimalCharacter,
    });
  };

  const handleDraftInputBlur = (draftKey) => {
    setInputDrafts((prev) => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: 'asc',
      };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const getSortButtonClassName = (key) => (
    sortConfig.key === key ? 'sort-button is-active' : 'sort-button'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (!activeTooltip) {
      return undefined;
    }

    const hideTooltip = () => setActiveTooltip(null);

    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);

    return () => {
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('resize', hideTooltip);
    };
  }, [activeTooltip]);

  const showTooltip = (event) => {
    const element = event.currentTarget;
    const tooltipText = element.dataset.tooltip;

    if (!tooltipText) {
      setActiveTooltip(null);
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const anchorElement = element.classList.contains('cell-tooltip')
      ? (element.querySelector('.cell-tooltip-value') ?? element)
      : element;
    const rect = anchorElement.getBoundingClientRect();
    const edgePadding = 16;
    const maxWidth = Number(element.dataset.tooltipMaxWidth ?? 320);
    const estimatedHeight = Number(element.dataset.tooltipEstimatedHeight ?? 96);
    const tooltipWidth = Math.min(maxWidth, viewportWidth - (edgePadding * 2));
    const targetCenterX = rect.left + (rect.width / 2);
    const left = Math.min(
      Math.max(targetCenterX - (tooltipWidth / 2), edgePadding),
      viewportWidth - edgePadding - tooltipWidth,
    );
    const arrowOffset = Math.min(Math.max(targetCenterX - left, 10), tooltipWidth - 10);

    const spaceAbove = rect.top - edgePadding;
    const spaceBelow = viewportHeight - rect.bottom - edgePadding;
    const vertical = spaceAbove < estimatedHeight && spaceBelow > spaceAbove ? 'bottom' : 'top';
    const anchorY = vertical === 'top' ? rect.top : rect.bottom;

    setActiveTooltip({
      text: tooltipText,
      vertical,
      left,
      anchorY,
      width: tooltipWidth,
      arrowOffset,
    });
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const handleResetAllInputs = () => {
    setSelectedCountry(countries[0].code);
    setSelectedCityId('');
    setElectricityPricesByCountry(buildInitialElectricityPricesByCountry());
    setElectricityPricesByCity(getInitialElectricityPriceByCity());
    setAirQualityByCountry(buildInitialAirQualityByCountry());
    setAirQualityByCity(getInitialAirQualityByCity());
    setAirPurifierPricesByCountry(buildInitialAirPurifierPricesByCountry());
    setFilterPricesByCountry(buildInitialFilterPricesByCountry());
    setMaxFilterUsageHoursGlobal(null);
    setMaxFilterUsageHoursByPurifier(buildInitialMaxFilterUsageHoursByPurifier());
    setInputDrafts({});
    setSortConfig(DEFAULT_SORT_CONFIG);
    setForm(INITIAL_FORM);
  };

  const renderHelpLabel = (label, helpText) => (
    <span className="label-with-help">
      <span>{label}</span>
      {helpText && (
        <span
          className="help-dot"
          aria-label={copy.helpAria(label)}
          tabIndex={0}
          data-tooltip={helpText}
          data-tooltip-max-width="320"
          data-tooltip-estimated-height="96"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
        >
          ?
        </span>
      )}
    </span>
  );

  const renderHeaderWithHelp = (label, helpText) => (
    <span className="table-header-with-help">
      <span>{label}</span>
      {helpText && (
        <span
          className="help-dot"
          aria-label={copy.helpAria(label)}
          tabIndex={0}
          data-tooltip={helpText}
          data-tooltip-max-width="320"
          data-tooltip-estimated-height="96"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
        >
          ?
        </span>
      )}
    </span>
  );

  const renderSortableHeaderWithHelp = (key, label, helpText) => (
    <span className="table-header-with-help">
      <span>{label} {getSortIndicator(key)}</span>
      {helpText && (
        <span
          className="help-dot"
          aria-label={copy.helpAria(label)}
          tabIndex={0}
          data-tooltip={helpText}
          data-tooltip-max-width="320"
          data-tooltip-estimated-height="96"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
        >
          ?
        </span>
      )}
    </span>
  );

  return (
    <main className="app-shell">
      <header className="app-header card">
        <div className="header-row">
          <h1>{copy.appTitle}</h1>
          <div className="header-actions">
            <button type="button" className="theme-toggle" onClick={handleResetAllInputs}>
              {copy.resetAllInputs}
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'ru' : 'en'))}
            >
              {language === 'en' ? copy.switchToRussian : copy.switchToEnglish}
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? copy.switchToLight : copy.switchToDark}
            </button>
          </div>
        </div>
        <p>{copy.appSubtitle}</p>
        <section className="app-instructions" aria-label={copy.instructionsAria}>
          <p className="app-instructions-description">
            {copy.instructionsDescription}
          </p>
          <h2>{copy.howToUse}</h2>
          <ol>
            {copy.howToUseSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </header>

      <section className="card">
        <h2>{copy.inputsTitle}</h2>
        <p className="section-intro">{copy.inputsIntro}</p>
        <div className="input-groups">
          <div className="input-group">
            <h3>{copy.section1Title}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="country">
                  {renderHelpLabel(copy.country, copy.countryHelp)}
                </label>
                <select
                  id="country"
                  name="country"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedCityId('');
                  }}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="city">
                  {renderHelpLabel(copy.cityOptional, copy.cityOptionalHelp)}
                </label>
                <select id="city" name="city" value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
                  <option value="">{copy.countryAverage}</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="outdoorPm2_5AnnualAverageConcentration">
                  {renderHelpLabel(copy.outdoorPm25Label, copy.outdoorPm25Help)}
                </label>
                <input
                  type="text"
                  id="outdoorPm2_5AnnualAverageConcentration"
                  inputMode="decimal"
                  value={formatDecimalInputString(inputDrafts[pm2_5DraftKey] ?? (outdoorPm2_5AnnualAverageConcentration ?? ''))}
                  onChange={handleOutdoorPm2_5Change}
                  onBlur={() => handleDraftInputBlur(pm2_5DraftKey)}
                  placeholder="0.0000"
                />
              </div>

              <div className="field">
                <label htmlFor="outdoorPm10AnnualAverageConcentration">
                  {renderHelpLabel(copy.outdoorPm10Label, copy.outdoorPm10Help)}
                </label>
                <input
                  type="text"
                  id="outdoorPm10AnnualAverageConcentration"
                  inputMode="decimal"
                  value={formatDecimalInputString(inputDrafts[pm10DraftKey] ?? (outdoorPm10AnnualAverageConcentration ?? ''))}
                  onChange={handleOutdoorPm10Change}
                  onBlur={() => handleDraftInputBlur(pm10DraftKey)}
                  placeholder="0.0000"
                />
                {outdoorPmHierarchyValidationMessage && (
                  <p className="message error">{outdoorPmHierarchyValidationMessage}</p>
                )}
              </div>
            </div>
          </div>

          <div className="input-group">
            <h3>{copy.section2Title}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="indoorPm2_5AnnualAverageConcentrationLimit">
                  {renderHelpLabel(copy.indoorPm25LimitLabel, copy.indoorPm25LimitHelp)}
                </label>
                <input type="text" id="indoorPm2_5AnnualAverageConcentrationLimit" name="indoorPm2_5AnnualAverageConcentrationLimit" inputMode="decimal" value={formatDecimalInputString(inputDrafts.indoorPm2_5AnnualAverageConcentrationLimit ?? form.indoorPm2_5AnnualAverageConcentrationLimit)} onChange={handleChange} onBlur={handleBlur} />
              </div>

              <div className="field">
                <label htmlFor="indoorPm10AnnualAverageConcentrationLimit">
                  {renderHelpLabel(copy.indoorPm10LimitLabel, copy.indoorPm10LimitHelp)}
                </label>
                <input type="text" id="indoorPm10AnnualAverageConcentrationLimit" name="indoorPm10AnnualAverageConcentrationLimit" inputMode="decimal" value={formatDecimalInputString(inputDrafts.indoorPm10AnnualAverageConcentrationLimit ?? form.indoorPm10AnnualAverageConcentrationLimit)} onChange={handleChange} onBlur={handleBlur} />
                {indoorLimitPmHierarchyValidationMessage && (
                  <p className="message error">{indoorLimitPmHierarchyValidationMessage}</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="indoorPm2_5GenerationRate">
                  {renderHelpLabel(copy.indoorPm25GenerationLabel, copy.indoorPm25GenerationHelp)}
                </label>
                <input type="text" id="indoorPm2_5GenerationRate" name="indoorPm2_5GenerationRate" inputMode="decimal" value={formatDecimalInputString(inputDrafts.indoorPm2_5GenerationRate ?? form.indoorPm2_5GenerationRate)} onChange={handleChange} onBlur={handleBlur} />
              </div>

              <div className="field">
                <label htmlFor="indoorPm10GenerationRate">
                  {renderHelpLabel(copy.indoorPm10GenerationLabel, copy.indoorPm10GenerationHelp)}
                </label>
                <input type="text" id="indoorPm10GenerationRate" name="indoorPm10GenerationRate" inputMode="decimal" value={formatDecimalInputString(inputDrafts.indoorPm10GenerationRate ?? form.indoorPm10GenerationRate)} onChange={handleChange} onBlur={handleBlur} />
                {indoorGenerationPmHierarchyValidationMessage && (
                  <p className="message error">{indoorGenerationPmHierarchyValidationMessage}</p>
                )}
              </div>
            </div>
          </div>

          <div className="input-group">
            <h3>{copy.section3Title}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="roomVolume">
                  {renderHelpLabel(copy.roomVolumeLabel, copy.roomVolumeHelp)}
                </label>
                <input type="text" id="roomVolume" name="roomVolume" inputMode="decimal" value={formatDecimalInputString(inputDrafts.roomVolume ?? form.roomVolume)} onChange={handleChange} onBlur={handleBlur} />
              </div>

              <div className="field">
                <label htmlFor="ventilationRate">
                  {renderHelpLabel(copy.ventilationRateLabel, copy.ventilationRateHelp)}
                </label>
                <input type="text" id="ventilationRate" name="ventilationRate" inputMode="decimal" value={formatDecimalInputString(inputDrafts.ventilationRate ?? form.ventilationRate)} onChange={handleChange} onBlur={handleBlur} />
              </div>

              <div className="field">
                <label htmlFor="maxAirPurifierCount">
                  {renderHelpLabel(copy.maxPurifierCountLabel, copy.maxPurifierCountHelp)}
                </label>
                <input type="text" id="maxAirPurifierCount" name="maxAirPurifierCount" maxLength={2} inputMode="numeric" pattern="\d*" value={formatIntegerInputString(form.maxAirPurifierCount)} onChange={handleChange} onBlur={handleBlur} />
              </div>

              <div className="field">
                <label htmlFor="maxCombinedNoiseDbA">
                  {renderHelpLabel(copy.maxNoiseLabel, copy.maxNoiseHelp)}
                </label>
                <input type="text" id="maxCombinedNoiseDbA" name="maxCombinedNoiseDbA" inputMode="decimal" value={formatDecimalInputString(inputDrafts.maxCombinedNoiseDbA ?? form.maxCombinedNoiseDbA)} onChange={handleChange} onBlur={handleBlur} />
              </div>
            </div>
          </div>

          <div className="input-group">
            <h3>{copy.section4Title}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="electricityPrice">
                  {renderHelpLabel(copy.electricityPriceLabel(selectedCountryCurrency), copy.electricityPriceHelp)}
                </label>
                <input
                  type="text"
                  id="electricityPrice"
                  inputMode="decimal"
                  value={formatDecimalInputString(inputDrafts[electricityDraftKey] ?? (currentElectricityPrice ?? ''))}
                  onChange={handleElectricityPriceChange}
                  onBlur={() => handleDraftInputBlur(electricityDraftKey)}
                  placeholder="0.0000"
                />
              </div>

              <div className="field">
                <label htmlFor="annualOperatingHours">
                  {renderHelpLabel(copy.annualOperatingHoursLabel, copy.annualOperatingHoursHelp)}
                </label>
                <input type="text" id="annualOperatingHours" name="annualOperatingHours" maxLength={4} inputMode="numeric" pattern="\d*" value={formatIntegerInputString(form.annualOperatingHours)} onChange={handleChange} onBlur={handleBlur} placeholder="8760" />
                {annualOperatingHoursValidationMessage && (
                  <p className="message error">{annualOperatingHoursValidationMessage}</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="ownershipYears">
                  {renderHelpLabel(copy.ownershipYearsLabel, copy.ownershipYearsHelp)}
                </label>
                <input type="text" id="ownershipYears" name="ownershipYears" maxLength={2} inputMode="numeric" pattern="\d*" value={formatIntegerInputString(form.ownershipYears)} onChange={handleChange} onBlur={handleBlur} />
                {ownershipYearsValidationMessage && (
                  <p className="message error">{ownershipYearsValidationMessage}</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="maxFilterUsageHoursGlobal">
                  {renderHelpLabel(copy.maxFilterUsageGlobalLabel, copy.maxFilterUsageGlobalHelp)}
                </label>
                <input
                  type="text"
                  id="maxFilterUsageHoursGlobal"
                  inputMode="decimal"
                  value={formatDecimalInputString(inputDrafts['max-filter-usage-global'] ?? (maxFilterUsageHoursGlobal ?? ''))}
                  onChange={handleMaxFilterUsageGlobalChange}
                  onBlur={() => handleDraftInputBlur('max-filter-usage-global')}
                  placeholder={copy.optional}
                />
                {maxFilterUsageHoursGlobalValidationMessage && (
                  <p className="message error">{maxFilterUsageHoursGlobalValidationMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card metric-panel">
        <h2>{copy.requiredCadrTitle}</h2>
        <div className="metrics-grid">
          {requiredPm2_5CADR === null ? <p className="metric-item">{copy.pm25LimitPositive}</p> : <p className="metric-item">{copy.requiredCadrPm25} <strong>{formatNumber(requiredPm2_5CADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong></p>}
          {requiredPm10CADR === null ? <p className="metric-item">{copy.pm10LimitPositive}</p> : <p className="metric-item">{copy.requiredCadrPm10} <strong>{formatNumber(requiredPm10CADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong></p>}
          {minimumRequiredCADR === 0 ? <p className="metric-item">{copy.oneCadrPositive}</p> : <p className="metric-item">{copy.minimumRequiredCadr} <strong>{formatNumber(minimumRequiredCADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong></p>}
        </div>
      </section>

      <section className="card table-card">
        <h2>{copy.purifierPricesTitle(selectedCountry)}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{copy.brand}</th>
                <th>{copy.model}</th>
                <th>{renderHeaderWithHelp(copy.purifierPriceHeader(selectedCountryCurrency), copy.purifierPriceHelpHeader)}</th>
                <th>{renderHeaderWithHelp(copy.filterPriceHeader(selectedCountryCurrency), copy.filterPriceHelpHeader)}</th>
                <th>{renderHeaderWithHelp(copy.maxFilterUsageHeader, copy.maxFilterUsageHelpHeader)}</th>
              </tr>
            </thead>
            <tbody>
              {airPurifiers.map((purifier) => {
                const purifierMaxFilterUsageValidationMessage = getFilterUsageLimitValidationMessage(maxFilterUsageHoursByPurifier[purifier.id], copy.filterUsageLimitPositive);

                return (
                  <tr key={purifier.id}>
                    <td>{purifier.brand}</td>
                    <td>{purifier.model}</td>
                    <td>
                      <input
                        type="text"
                        id={`purifier-price-${purifier.id}`}
                        inputMode="decimal"
                        value={
                          formatDecimalInputString(
                            inputDrafts[`purifier-${purifier.id}-${selectedCountry}`]
                            ?? (airPurifierPricesByCountry[purifier.id]?.[selectedCountry] ?? '')
                          )
                        }
                        onChange={(e) => handleAirPurifierPriceChange(purifier.id, e)}
                        onBlur={() => handleDraftInputBlur(`purifier-${purifier.id}-${selectedCountry}`)}
                        placeholder="0.0000"
                        aria-label={copy.purifierPriceAria(purifier.brand, purifier.model, selectedCountryCurrency)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        id={`filter-price-${purifier.id}`}
                        inputMode="decimal"
                        value={
                          formatDecimalInputString(
                            inputDrafts[`filter-${purifier.id}-${selectedCountry}`]
                            ?? (filterPricesByCountry[purifier.id]?.[selectedCountry] ?? '')
                          )
                        }
                        onChange={(e) => handleFilterPriceChange(purifier.id, e)}
                        onBlur={() => handleDraftInputBlur(`filter-${purifier.id}-${selectedCountry}`)}
                        placeholder="0.0000"
                        aria-label={copy.filterPriceAria(purifier.brand, purifier.model, selectedCountryCurrency)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        id={`max-filter-usage-${purifier.id}`}
                        inputMode="decimal"
                        value={
                          formatDecimalInputString(
                            inputDrafts[`max-filter-usage-${purifier.id}`]
                            ?? (maxFilterUsageHoursByPurifier[purifier.id] ?? '')
                          )
                        }
                        onChange={(e) => handleMaxFilterUsageByPurifierChange(purifier.id, e)}
                        onBlur={() => handleDraftInputBlur(`max-filter-usage-${purifier.id}`)}
                        placeholder={copy.optionalOverride}
                        aria-label={copy.maxFilterUsageOverrideAria(purifier.brand, purifier.model)}
                      />
                      {purifierMaxFilterUsageValidationMessage && (
                        <p className="message error">{purifierMaxFilterUsageValidationMessage}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card table-card">
        <h2>{copy.purifierGroupsTitle}</h2>
        {bestValueGroup && (
          <div className="summary-card" role="status" aria-live="polite">
            <p className="summary-title">
              {copy.bestValueOption} <strong>{bestValueGroup.brand} {bestValueGroup.model}</strong> ({bestValueGroup.quantity} {bestValueGroup.quantity > 1 ? copy.units : copy.unit}, {bestValueGroup.speedName})
            </p>
            <p className="summary-metrics">
              {copy.tcoLabel} <strong>{formatNumber(bestValueGroup.totalCostOfOwnership, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCountryCurrency}</strong> · {copy.startingCadrLabel} <strong>{formatNumber(bestValueGroup.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong> · {copy.noiseLabel} <strong>{formatNumber(bestValueGroup.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dBA</strong>
            </p>
          </div>
        )}
        {isCostPeriodValid ? (
          <p className="message info">
            {copy.ownershipPeriodMessage(
              formatNumber(form.ownershipYears),
              formatNumber(form.annualOperatingHours),
              formatNumber(form.ownershipYears * form.annualOperatingHours),
            )}
          </p>
        ) : (
          <p className="message error">{copy.ownershipPeriodUnavailable}</p>
        )}
        {sortedAirPurifierGroupsWithCosts.length === 0 ? (
          <p className="message info">{copy.noMatchingGroups}</p>
        ) : (
          <div className="table-wrap">
            <table className="air-purifier-groups-table">
              <thead>
                <tr>
                  <th><button type="button" className={getSortButtonClassName('brand')} onClick={() => handleSort('brand')}>{copy.brand} {getSortIndicator('brand')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('model')} onClick={() => handleSort('model')}>{copy.model} {getSortIndicator('model')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('speedName')} onClick={() => handleSort('speedName')}>{copy.speedSetting} {getSortIndicator('speedName')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('quantity')} onClick={() => handleSort('quantity')}>{renderSortableHeaderWithHelp('quantity', copy.quantity, copy.quantityHelp)}</button></th>
                  <th><button type="button" className={getSortButtonClassName('totalCadrM3PerHour')} onClick={() => handleSort('totalCadrM3PerHour')}>{renderSortableHeaderWithHelp('totalCadrM3PerHour', copy.totalStartingCadr, copy.totalStartingCadrHelp)}</button></th>
                  <th><button type="button" className={getSortButtonClassName('totalPowerWatts')} onClick={() => handleSort('totalPowerWatts')}>{copy.totalPower} {getSortIndicator('totalPowerWatts')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('combinedNoiseDbA')} onClick={() => handleSort('combinedNoiseDbA')}>{copy.combinedNoise} {getSortIndicator('combinedNoiseDbA')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('filterLifeHours')} onClick={() => handleSort('filterLifeHours')}>{renderSortableHeaderWithHelp('filterLifeHours', copy.estimatedFilterLife, copy.estimatedFilterLifeHelp)}</button></th>
                  <th><button type="button" className={getSortButtonClassName('purchaseCost')} onClick={() => handleSort('purchaseCost')}>{copy.initialPurchaseCost(selectedCountryCurrency)} {getSortIndicator('purchaseCost')}</button></th>
                  <th><button type="button" className={getSortButtonClassName('electricityCost')} onClick={() => handleSort('electricityCost')}>{renderSortableHeaderWithHelp('electricityCost', copy.totalElectricityCost(selectedCountryCurrency), copy.totalElectricityCostHelp)}</button></th>
                  <th><button type="button" className={getSortButtonClassName('filterCost')} onClick={() => handleSort('filterCost')}>{renderSortableHeaderWithHelp('filterCost', copy.totalFilterReplacementCost(selectedCountryCurrency), copy.totalFilterReplacementCostHelp)}</button></th>
                  <th><button type="button" className={getSortButtonClassName('totalCostOfOwnership')} onClick={() => handleSort('totalCostOfOwnership')}>{renderSortableHeaderWithHelp('totalCostOfOwnership', copy.totalCostOfOwnership(selectedCountryCurrency), copy.totalCostOfOwnershipHelp)}</button></th>
                </tr>
              </thead>
              <tbody>
                {sortedAirPurifierGroupsWithCosts.map((group) => (
                  <tr key={`${group.purifierId}-${group.speedId}-${group.quantity}`}>
                    <td>{group.brand}</td>
                    <td>{group.model}</td>
                    <td>{group.speedName}</td>
                    <td>{group.quantity}</td>
                    <td className="cell-tooltip" data-tooltip={copy.totalCadrTooltip(
                      `${formatNumber(group.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      `${formatNumber(group.totalCadrM3PerHour / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      group.quantity,
                    )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{formatNumber(group.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={copy.totalPowerTooltip(
                      `${formatNumber(group.totalPowerWatts, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      `${formatNumber(group.totalPowerWatts / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      group.quantity,
                    )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{formatNumber(group.totalPowerWatts, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={copy.noiseTooltip(
                      group.quantity,
                      `${formatNumber(group.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
                    )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{formatNumber(group.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={group.effectiveFilterLifeHours === null
                      ? copy.filterLifeUnavailable
                      : Number.isFinite(group.appliedMaxFilterUsageHours)
                        ? copy.cappedByUsageLimit(
                          formatNumber(group.appliedMaxFilterUsageHours, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                          group.filterLifeEstimate?.stopReason ?? copy.stopReasonFallback,
                        )
                        : copy.estimatedFromModel(group.filterLifeEstimate?.stopReason ?? copy.stopReasonFallback)} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{group.effectiveFilterLifeHours === null ? copy.notAvailable : formatNumber(group.effectiveFilterLifeHours)}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={group.purchaseCost === null
                      ? copy.purchaseUnavailable
                      : copy.purchaseTooltip(
                        formatNumber(group.purchaseCost / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        group.quantity,
                      )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{group.purchaseCost === null ? copy.notAvailable : formatNumber(group.purchaseCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={group.electricityCost === null
                      ? copy.electricityUnavailable
                      : copy.electricityTooltip(
                        formatNumber(group.ownershipPeriodHours),
                        formatNumber(currentElectricityPrice ?? 0, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
                        selectedCountryCurrency,
                      )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{group.electricityCost === null ? copy.notAvailable : formatNumber(group.electricityCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={group.filterCost === null
                      ? copy.filterCostUnavailable
                      : copy.filterTooltip(
                        formatNumber(group.filterCost / (group.quantity * (group.filterReplacements || 1)), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        group.quantity,
                        group.filterReplacements,
                      )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{group.filterCost === null ? copy.notAvailable : formatNumber(group.filterCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="cell-tooltip" data-tooltip={group.totalCostOfOwnership === null
                      ? copy.tcoUnavailable
                      : copy.tcoTooltip(
                        formatNumber(group.purchaseCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        formatNumber(group.electricityCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        formatNumber(group.filterCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                      <span className="cell-tooltip-value">{group.totalCostOfOwnership === null ? copy.notAvailable : formatNumber(group.totalCostOfOwnership, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {activeTooltip && (
        <div
          className={`floating-tooltip floating-tooltip--${activeTooltip.vertical}`}
          style={{
            left: `${activeTooltip.left}px`,
            top: `${activeTooltip.anchorY}px`,
            width: `${activeTooltip.width}px`,
            '--tooltip-arrow-left': `${activeTooltip.arrowOffset}px`,
          }}
          role="tooltip"
        >
          {activeTooltip.text}
        </div>
      )}
    </main>
  )
}

export default App

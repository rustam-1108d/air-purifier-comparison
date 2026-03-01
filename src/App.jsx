import { useEffect, useMemo, useState } from 'react'

import calculateRequiredParticulateCADR from './utils/calculateRequiredParticulateCADR';
import buildAirPurifierGroups from './utils/buildAirPurifierGroups';
import useFloatingTooltip from './hooks/useFloatingTooltip';
import AppHeader from './components/AppHeader';
import InputsPanel from './components/InputsPanel';
import RequiredCadrPanel from './components/RequiredCadrPanel';
import PurifierPricesTable from './components/PurifierPricesTable';
import PurifierGroupsTable from './components/PurifierGroupsTable';

import {
  DEFAULT_DECIMAL_PLACES,
  DEFAULT_INTEGER_DIGITS,
  MIN_ANNUAL_OPERATING_HOURS,
  MAX_ANNUAL_OPERATING_HOURS,
  MIN_OWNERSHIP_YEARS,
  MAX_OWNERSHIP_YEARS,
  FORM_DECIMAL_PLACES_BY_FIELD,
  FORM_INTEGER_DIGITS_BY_FIELD,
  LOCATION_DECIMAL_PLACES,
  LOCATION_INTEGER_DIGITS,
  FILTER_USAGE_LIMIT_DECIMAL_PLACES,
  FILTER_USAGE_LIMIT_INTEGER_DIGITS,
  THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  INITIAL_FORM,
  DEFAULT_SORT_CONFIG,
} from './constants/appConfig.js';
import {
  normalizeDecimalInput,
  isValidDecimalInput,
  parseDecimalForForm,
  parseDecimalForNullable,
  formatIntegerInputString,
  formatDecimalInputString,
  countMatchingCharacters,
  scheduleCaretPosition,
  isDigitCharacter,
  isDecimalCharacter,
  formatGroupedNumber,
} from './utils/numberInput.js';

import countries from './data/countries.js';
import cities from './data/cities.js';
import { getInitialElectricityPriceByCountry, getInitialElectricityPriceByCity } from './data/electricityPrices.js';
import { getInitialAirQualityByCountry, getInitialAirQualityByCity } from './data/airQuality.js';
import { airPurifiers } from './data/airPurifiers.js';
import { translations } from './i18n/translations.js';

import './App.css'

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
  const { activeTooltip, showTooltip, hideTooltip } = useFloatingTooltip();

  const [form, setForm] = useState(INITIAL_FORM);
  const copy = translations[language];
  const numberLocale = language === 'ru' ? 'ru-RU' : 'en-US';
  const localizedCountryNames = copy.countryNames ?? {};
  const localizedCityNames = copy.cityNames ?? {};
  const getLocalizedCountryName = (country) => localizedCountryNames[country.code] ?? country.name;
  const getLocalizedCityName = (city) => localizedCityNames[city.id] ?? city.name;
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
  const selectedCountryDisplayName = selectedCountryData
    ? getLocalizedCountryName(selectedCountryData)
    : selectedCountry;
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
      <AppHeader
        copy={copy}
        language={language}
        theme={theme}
        onResetAllInputs={handleResetAllInputs}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ru' : 'en'))}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <InputsPanel
        copy={copy}
        selectedCountry={selectedCountry}
        selectedCityId={selectedCityId}
        setSelectedCountry={setSelectedCountry}
        setSelectedCityId={setSelectedCityId}
        getLocalizedCountryName={getLocalizedCountryName}
        availableCities={availableCities}
        getLocalizedCityName={getLocalizedCityName}
        renderHelpLabel={renderHelpLabel}
        formatDecimalInputString={formatDecimalInputString}
        formatIntegerInputString={formatIntegerInputString}
        inputDrafts={inputDrafts}
        pm2_5DraftKey={pm2_5DraftKey}
        pm10DraftKey={pm10DraftKey}
        outdoorPm2_5AnnualAverageConcentration={outdoorPm2_5AnnualAverageConcentration}
        outdoorPm10AnnualAverageConcentration={outdoorPm10AnnualAverageConcentration}
        handleOutdoorPm2_5Change={handleOutdoorPm2_5Change}
        handleOutdoorPm10Change={handleOutdoorPm10Change}
        handleDraftInputBlur={handleDraftInputBlur}
        outdoorPmHierarchyValidationMessage={outdoorPmHierarchyValidationMessage}
        form={form}
        handleChange={handleChange}
        handleBlur={handleBlur}
        indoorLimitPmHierarchyValidationMessage={indoorLimitPmHierarchyValidationMessage}
        indoorGenerationPmHierarchyValidationMessage={indoorGenerationPmHierarchyValidationMessage}
        selectedCountryCurrency={selectedCountryCurrency}
        electricityDraftKey={electricityDraftKey}
        currentElectricityPrice={currentElectricityPrice}
        handleElectricityPriceChange={handleElectricityPriceChange}
        annualOperatingHoursValidationMessage={annualOperatingHoursValidationMessage}
        ownershipYearsValidationMessage={ownershipYearsValidationMessage}
        maxFilterUsageHoursGlobal={maxFilterUsageHoursGlobal}
        handleMaxFilterUsageGlobalChange={handleMaxFilterUsageGlobalChange}
        maxFilterUsageHoursGlobalValidationMessage={maxFilterUsageHoursGlobalValidationMessage}
      />

      <RequiredCadrPanel
        copy={copy}
        requiredPm2_5CADR={requiredPm2_5CADR}
        requiredPm10CADR={requiredPm10CADR}
        minimumRequiredCADR={minimumRequiredCADR}
        formatNumber={formatNumber}
      />

      <PurifierPricesTable
        copy={copy}
        selectedCountryDisplayName={selectedCountryDisplayName}
        selectedCountryCurrency={selectedCountryCurrency}
        renderHeaderWithHelp={renderHeaderWithHelp}
        getFilterUsageLimitValidationMessage={getFilterUsageLimitValidationMessage}
        maxFilterUsageHoursByPurifier={maxFilterUsageHoursByPurifier}
        inputDrafts={inputDrafts}
        selectedCountry={selectedCountry}
        airPurifierPricesByCountry={airPurifierPricesByCountry}
        filterPricesByCountry={filterPricesByCountry}
        formatDecimalInputString={formatDecimalInputString}
        handleAirPurifierPriceChange={handleAirPurifierPriceChange}
        handleFilterPriceChange={handleFilterPriceChange}
        handleMaxFilterUsageByPurifierChange={handleMaxFilterUsageByPurifierChange}
        handleDraftInputBlur={handleDraftInputBlur}
      />

      <PurifierGroupsTable
        copy={copy}
        bestValueGroup={bestValueGroup}
        selectedCountryCurrency={selectedCountryCurrency}
        formatNumber={formatNumber}
        isCostPeriodValid={isCostPeriodValid}
        form={form}
        sortedAirPurifierGroupsWithCosts={sortedAirPurifierGroupsWithCosts}
        getSortButtonClassName={getSortButtonClassName}
        handleSort={handleSort}
        getSortIndicator={getSortIndicator}
        renderSortableHeaderWithHelp={renderSortableHeaderWithHelp}
        currentElectricityPrice={currentElectricityPrice}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
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

import { useEffect, useState } from 'react'

import useFloatingTooltip from './hooks/useFloatingTooltip';
import useAppCalculations from './hooks/useAppCalculations';
import useInputHandlers from './hooks/useInputHandlers';
import AppHeader from './components/AppHeader';
import InputsPanel from './components/InputsPanel';
import RequiredCadrPanel from './components/RequiredCadrPanel';
import PurifierPricesTable from './components/PurifierPricesTable';
import PurifierGroupsTable from './components/PurifierGroupsTable';

import {
  THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  INITIAL_FORM,
  DEFAULT_SORT_CONFIG,
} from './constants/appConfig.js';
import {
  formatIntegerInputString,
  formatDecimalInputString,
  formatGroupedNumber,
} from './utils/numberInput.js';

import countries from './data/countries.js';
import { getInitialElectricityPriceByCountry, getInitialElectricityPriceByCity } from './data/electricityPrices.js';
import { getInitialAirQualityByCountry, getInitialAirQualityByCity } from './data/airQuality.js';
import { airPurifiers } from './data/airPurifiers.js';
import { translations } from './i18n/translations.js';

import './App.css'

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

  const {
    selectedCountryCurrency,
    selectedCountryDisplayName,
    availableCities,
    currentElectricityPrice,
    outdoorPm2_5AnnualAverageConcentration,
    outdoorPm10AnnualAverageConcentration,
    requiredPm2_5CADR,
    requiredPm10CADR,
    minimumRequiredCADR,
    annualOperatingHoursValidationMessage,
    ownershipYearsValidationMessage,
    outdoorPmHierarchyValidationMessage,
    indoorLimitPmHierarchyValidationMessage,
    indoorGenerationPmHierarchyValidationMessage,
    maxFilterUsageHoursGlobalValidationMessage,
    isCostPeriodValid,
    sortedAirPurifierGroupsWithCosts,
    bestValueGroup,
    electricityDraftKey,
    pm2_5DraftKey,
    pm10DraftKey,
    getFilterUsageLimitValidationMessage,
  } = useAppCalculations({
    copy,
    form,
    selectedCountry,
    selectedCityId,
    getLocalizedCountryName,
    airQualityByCountry,
    airQualityByCity,
    electricityPricesByCountry,
    electricityPricesByCity,
    airPurifierPricesByCountry,
    filterPricesByCountry,
    maxFilterUsageHoursGlobal,
    maxFilterUsageHoursByPurifier,
    sortConfig,
  });

  const {
    handleChange,
    handleBlur,
    handleElectricityPriceChange,
    handleOutdoorPm2_5Change,
    handleOutdoorPm10Change,
    handleAirPurifierPriceChange,
    handleFilterPriceChange,
    handleMaxFilterUsageGlobalChange,
    handleMaxFilterUsageByPurifierChange,
    handleDraftInputBlur,
  } = useInputHandlers({
    selectedCountry,
    selectedCityId,
    electricityDraftKey,
    pm2_5DraftKey,
    pm10DraftKey,
    setForm,
    setInputDrafts,
    setElectricityPricesByCountry,
    setElectricityPricesByCity,
    setAirQualityByCountry,
    setAirQualityByCity,
    setAirPurifierPricesByCountry,
    setFilterPricesByCountry,
    setMaxFilterUsageHoursGlobal,
    setMaxFilterUsageHoursByPurifier,
  });

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

  const appHeaderProps = {
    copy,
    language,
    theme,
    onResetAllInputs: handleResetAllInputs,
    onToggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'ru' : 'en')),
    onToggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
  };

  const inputsPanelProps = {
    copy,
    selectedCountry,
    selectedCityId,
    setSelectedCountry,
    setSelectedCityId,
    getLocalizedCountryName,
    availableCities,
    getLocalizedCityName,
    showTooltip,
    hideTooltip,
    formatDecimalInputString,
    formatIntegerInputString,
    inputDrafts,
    pm2_5DraftKey,
    pm10DraftKey,
    outdoorPm2_5AnnualAverageConcentration,
    outdoorPm10AnnualAverageConcentration,
    handleOutdoorPm2_5Change,
    handleOutdoorPm10Change,
    handleDraftInputBlur,
    outdoorPmHierarchyValidationMessage,
    form,
    handleChange,
    handleBlur,
    indoorLimitPmHierarchyValidationMessage,
    indoorGenerationPmHierarchyValidationMessage,
    selectedCountryCurrency,
    electricityDraftKey,
    currentElectricityPrice,
    handleElectricityPriceChange,
    annualOperatingHoursValidationMessage,
    ownershipYearsValidationMessage,
    maxFilterUsageHoursGlobal,
    handleMaxFilterUsageGlobalChange,
    maxFilterUsageHoursGlobalValidationMessage,
  };

  const requiredCadrPanelProps = {
    copy,
    requiredPm2_5CADR,
    requiredPm10CADR,
    minimumRequiredCADR,
    formatNumber,
  };

  const purifierPricesTableProps = {
    copy,
    selectedCountryDisplayName,
    selectedCountryCurrency,
    showTooltip,
    hideTooltip,
    getFilterUsageLimitValidationMessage,
    maxFilterUsageHoursByPurifier,
    inputDrafts,
    selectedCountry,
    airPurifierPricesByCountry,
    filterPricesByCountry,
    formatDecimalInputString,
    handleAirPurifierPriceChange,
    handleFilterPriceChange,
    handleMaxFilterUsageByPurifierChange,
    handleDraftInputBlur,
  };

  const purifierGroupsTableProps = {
    copy,
    bestValueGroup,
    selectedCountryCurrency,
    formatNumber,
    isCostPeriodValid,
    form,
    sortedAirPurifierGroupsWithCosts,
    getSortButtonClassName,
    handleSort,
    getSortIndicator,
    currentElectricityPrice,
    showTooltip,
    hideTooltip,
  };

  return (
    <main className="app-shell">
      <AppHeader {...appHeaderProps} />

      <InputsPanel {...inputsPanelProps} />

      <RequiredCadrPanel {...requiredCadrPanelProps} />

      <PurifierPricesTable {...purifierPricesTableProps} />

      <PurifierGroupsTable {...purifierGroupsTableProps} />
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

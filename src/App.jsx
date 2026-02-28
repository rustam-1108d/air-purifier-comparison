import { useMemo, useState } from 'react'

import calculateRequiredParticulateCADR from './utils/calculateRequiredParticulateCADR';
import buildAirPurifierGroups from './utils/buildAirPurifierGroups';

import countries from './data/countries.js';
import cities from './data/cities.js';
import { getInitialElectricityPriceByCountry, getInitialElectricityPriceByCity } from './data/electricityPrices.js';
import { getInitialAirQualityByCountry, getInitialAirQualityByCity } from './data/airQuality.js';
import { airPurifiers } from './data/airPurifiers.js';

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

const normalizeDecimalInput = (value) => value.replace(/,/g, '.');

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

function App() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0].code);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [electricityPricesByCountry, setElectricityPricesByCountry] = useState(
    () => {
      const initialElectricityPrices = getInitialElectricityPriceByCountry();
      return Object.fromEntries(countries.map((country) => [country.code, initialElectricityPrices[country.code] ?? null]));
    }
  );
  const [electricityPricesByCity, setElectricityPricesByCity] = useState(
    () => getInitialElectricityPriceByCity()
  );
  const [airQualityByCountry, setAirQualityByCountry] = useState(
    () => {
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
    }
  );
  const [airQualityByCity, setAirQualityByCity] = useState(
    () => getInitialAirQualityByCity()
  );
  const [airPurifierPricesByCountry, setAirPurifierPricesByCountry] = useState(
    () => Object.fromEntries(
      airPurifiers.map((purifier) => [
        purifier.id,
        Object.fromEntries(
          countries.map((country) => [
            country.code,
            purifier.purifierPrices?.[country.code]?.amount ?? null,
          ])
        ),
      ])
    )
  );
  const [filterPricesByCountry, setFilterPricesByCountry] = useState(
    () => Object.fromEntries(
      airPurifiers.map((purifier) => [
        purifier.id,
        Object.fromEntries(
          countries.map((country) => [
            country.code,
            purifier.filterPrices?.[country.code]?.amount ?? null,
          ])
        ),
      ])
    )
  );
  const [inputDrafts, setInputDrafts] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  // console.log('Electricity Prices by Country:', electricityPricesByCountry);
  // console.log('Electricity Prices by City:', electricityPricesByCity);
  // console.log('Air Purifier Prices by Country:', airPurifierPricesByCountry);
  // console.log('Filter Prices by Country:', filterPricesByCountry);

  const [form, setForm] = useState({
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
  });

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
    ? 'Annual Operating Hours is required.'
    : form.annualOperatingHours < MIN_ANNUAL_OPERATING_HOURS || form.annualOperatingHours > MAX_ANNUAL_OPERATING_HOURS
      ? `Annual Operating Hours must be between ${MIN_ANNUAL_OPERATING_HOURS} and ${MAX_ANNUAL_OPERATING_HOURS}.`
      : null;
  const isAnnualOperatingHoursValid = annualOperatingHoursValidationMessage === null;

  const ownershipYearsValidationMessage = form.ownershipYears === ''
    ? 'Ownership Years is required.'
    : form.ownershipYears < MIN_OWNERSHIP_YEARS || form.ownershipYears > MAX_OWNERSHIP_YEARS
      ? `Ownership Years must be between ${MIN_OWNERSHIP_YEARS} and ${MAX_OWNERSHIP_YEARS}.`
      : null;
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
    && form.roomVolume > 0;

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

      const purchaseCost = Number.isFinite(purifierUnitPrice)
        ? purifierUnitPrice * group.quantity
        : null;

      const electricityCost = Number.isFinite(currentElectricityPrice) && Number.isFinite(ownershipPeriodHours)
        ? (group.totalPowerWatts / 1000) * ownershipPeriodHours * currentElectricityPrice
        : null;

      const filterReplacements = Number.isFinite(group.filterLifeHours) && group.filterLifeHours > 0 && Number.isFinite(ownershipPeriodHours)
        ? Math.max(0, Math.ceil(ownershipPeriodHours / group.filterLifeHours) - 1)
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
    const { name, value } = e.target;

    if (decimalFormFieldNames.has(name)) {
      const normalizedValue = normalizeDecimalInput(value);
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
      return;
    }

    const numericValue = value.replace(/\D/g, '');

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
    draftKey,
    onCountryUpdate,
    onCityUpdate,
    maxDecimalPlaces = DEFAULT_DECIMAL_PLACES,
    maxIntegerDigits = DEFAULT_INTEGER_DIGITS,
  }) => {
    const normalizedValue = normalizeDecimalInput(value);

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
      return;
    }

    onCountryUpdate(parsedValue);
  };

  const handleElectricityPriceChange = (e) => {
    handleLocationDecimalInputChange({
      value: e.target.value,
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

  const handleAirPurifierPriceChange = (purifierId, value) => {
    const draftKey = `purifier-${purifierId}-${selectedCountry}`;

    handleLocationDecimalInputChange({
      value,
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

  const handleFilterPriceChange = (purifierId, value) => {
    const draftKey = `filter-${purifierId}-${selectedCountry}`;

    handleLocationDecimalInputChange({
      value,
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

  return (
    <>
      <div>
        <label htmlFor="country">Country</label>
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

      <div>
        <label htmlFor="city">City (optional)</label>
        <select id="city" name="city" value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
          <option value="">Country average</option>
          {availableCities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="electricityPrice">Electricity Price ({selectedCountryCurrency}/kWh)</label>
        <input
          type="text"
          id="electricityPrice"
          inputMode="decimal"
          value={inputDrafts[electricityDraftKey] ?? (currentElectricityPrice ?? '')}
          onChange={handleElectricityPriceChange}
          onBlur={() => handleDraftInputBlur(electricityDraftKey)}
          placeholder="0.0000"
        />
      </div>

      <div>
        <label htmlFor="outdoorPm2_5AnnualAverageConcentration">Outdoor PM2.5 Concentration (annual average, µg/m³)</label>
        <input
          type="text"
          id="outdoorPm2_5AnnualAverageConcentration"
          inputMode="decimal"
          value={inputDrafts[pm2_5DraftKey] ?? (outdoorPm2_5AnnualAverageConcentration ?? '')}
          onChange={handleOutdoorPm2_5Change}
          onBlur={() => handleDraftInputBlur(pm2_5DraftKey)}
          placeholder="0.0000"
        />
      </div>
      <div>
        <label htmlFor="outdoorPm10AnnualAverageConcentration">Outdoor PM10 Concentration (annual average, µg/m³)</label>
        <input
          type="text"
          id="outdoorPm10AnnualAverageConcentration"
          inputMode="decimal"
          value={inputDrafts[pm10DraftKey] ?? (outdoorPm10AnnualAverageConcentration ?? '')}
          onChange={handleOutdoorPm10Change}
          onBlur={() => handleDraftInputBlur(pm10DraftKey)}
          placeholder="0.0000"
        />
      </div>
      <div>
        <label htmlFor="indoorPm2_5AnnualAverageConcentrationLimit">Indoor PM2.5 Concentration Limit (annual average, µg/m³)</label>
        <input type="text" id="indoorPm2_5AnnualAverageConcentrationLimit" name="indoorPm2_5AnnualAverageConcentrationLimit" inputMode="decimal" value={inputDrafts.indoorPm2_5AnnualAverageConcentrationLimit ?? form.indoorPm2_5AnnualAverageConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10AnnualAverageConcentrationLimit">Indoor PM10 Concentration Limit (annual average, µg/m³)</label>
        <input type="text" id="indoorPm10AnnualAverageConcentrationLimit" name="indoorPm10AnnualAverageConcentrationLimit" inputMode="decimal" value={inputDrafts.indoorPm10AnnualAverageConcentrationLimit ?? form.indoorPm10AnnualAverageConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="ventilationRate">Ventilation Rate (m³/h)</label>
        <input type="text" id="ventilationRate" name="ventilationRate" inputMode="decimal" value={inputDrafts.ventilationRate ?? form.ventilationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm2_5GenerationRate">Indoor PM2.5 Generation Rate (µg/h)</label>
        <input type="text" id="indoorPm2_5GenerationRate" name="indoorPm2_5GenerationRate" inputMode="decimal" value={inputDrafts.indoorPm2_5GenerationRate ?? form.indoorPm2_5GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10GenerationRate">Indoor PM10 Generation Rate (µg/h)</label>
        <input type="text" id="indoorPm10GenerationRate" name="indoorPm10GenerationRate" inputMode="decimal" value={inputDrafts.indoorPm10GenerationRate ?? form.indoorPm10GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="roomVolume">Room Volume (m³)</label>
        <input type="text" id="roomVolume" name="roomVolume" inputMode="decimal" value={inputDrafts.roomVolume ?? form.roomVolume} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="maxAirPurifierCount">Max Air Purifier Count</label>
        <input type="text" id="maxAirPurifierCount" name="maxAirPurifierCount" maxLength={2} inputMode="numeric" pattern="\d*" value={form.maxAirPurifierCount} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="maxCombinedNoiseDbA">Max Combined Noise (dB)</label>
        <input type="text" id="maxCombinedNoiseDbA" name="maxCombinedNoiseDbA" inputMode="decimal" value={inputDrafts.maxCombinedNoiseDbA ?? form.maxCombinedNoiseDbA} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="annualOperatingHours">Annual Operating Hours</label>
        <input type="text" id="annualOperatingHours" name="annualOperatingHours" maxLength={4} inputMode="numeric" pattern="\d*" value={form.annualOperatingHours} onChange={handleChange} onBlur={handleBlur} placeholder="8760" />
        {annualOperatingHoursValidationMessage && (
          <p>{annualOperatingHoursValidationMessage}</p>
        )}
      </div>
      <div>
        <label htmlFor="ownershipYears">Ownership Years</label>
        <input type="text" id="ownershipYears" name="ownershipYears" maxLength={2} inputMode="numeric" pattern="\d*" value={form.ownershipYears} onChange={handleChange} onBlur={handleBlur} />
        {ownershipYearsValidationMessage && (
          <p>{ownershipYearsValidationMessage}</p>
        )}
      </div>

      <div>
        {requiredPm2_5CADR === null ? <p>Indoor PM2.5 Concentration Limit must be greater than zero</p> : <p>Required CADR for PM2.5: {requiredPm2_5CADR.toFixed(2)} m³/h</p>}
        {requiredPm10CADR === null ? <p>Indoor PM10 Concentration Limit must be greater than zero</p> : <p>Required CADR for PM10: {requiredPm10CADR.toFixed(2)} m³/h</p>}
        {minimumRequiredCADR === 0 ? <p>At least one of the required CADR values must be greater than zero</p> : <p>Minimum Required CADR: {minimumRequiredCADR.toFixed(2)} m³/h</p>}
      </div>

      <div>
        <h2>Air Purifier Prices ({selectedCountry})</h2>
        {airPurifiers.map((purifier) => {
          return (
            <div key={purifier.id}>
              <h3>{purifier.brand} {purifier.model}</h3>
              <div>
                <label htmlFor={`purifier-price-${purifier.id}`}>
                  Purifier Price ({selectedCountryCurrency})
                </label>
                <input
                  type="text"
                  id={`purifier-price-${purifier.id}`}
                  inputMode="decimal"
                  value={
                    inputDrafts[`purifier-${purifier.id}-${selectedCountry}`]
                    ?? (airPurifierPricesByCountry[purifier.id]?.[selectedCountry] ?? '')
                  }
                  onChange={(e) => handleAirPurifierPriceChange(purifier.id, e.target.value)}
                  onBlur={() => handleDraftInputBlur(`purifier-${purifier.id}-${selectedCountry}`)}
                  placeholder="0.0000"
                />
              </div>
              <div>
                <label htmlFor={`filter-price-${purifier.id}`}>
                  Filter Price ({selectedCountryCurrency})
                </label>
                <input
                  type="text"
                  id={`filter-price-${purifier.id}`}
                  inputMode="decimal"
                  value={
                    inputDrafts[`filter-${purifier.id}-${selectedCountry}`]
                    ?? (filterPricesByCountry[purifier.id]?.[selectedCountry] ?? '')
                  }
                  onChange={(e) => handleFilterPriceChange(purifier.id, e.target.value)}
                  onBlur={() => handleDraftInputBlur(`filter-${purifier.id}-${selectedCountry}`)}
                  placeholder="0.0000"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2>Air Purifier Groups</h2>
        {isCostPeriodValid ? (
          <p>
            Cost period: {form.ownershipYears} years × {form.annualOperatingHours} hours/year = {form.ownershipYears * form.annualOperatingHours} hours
          </p>
        ) : (
          <p>Cost period unavailable until Annual Operating Hours and Ownership Years are valid.</p>
        )}
        {sortedAirPurifierGroupsWithCosts.length === 0 ? (
          <p>No matching groups for the current constraints.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th><button type="button" onClick={() => handleSort('brand')}>Brand {getSortIndicator('brand')}</button></th>
                <th><button type="button" onClick={() => handleSort('model')}>Model {getSortIndicator('model')}</button></th>
                <th><button type="button" onClick={() => handleSort('speedName')}>Speed {getSortIndicator('speedName')}</button></th>
                <th><button type="button" onClick={() => handleSort('quantity')}>Qty {getSortIndicator('quantity')}</button></th>
                <th><button type="button" onClick={() => handleSort('totalCadrM3PerHour')}>Total CADR (m³/h) {getSortIndicator('totalCadrM3PerHour')}</button></th>
                <th><button type="button" onClick={() => handleSort('totalPowerWatts')}>Total Power (W) {getSortIndicator('totalPowerWatts')}</button></th>
                <th><button type="button" onClick={() => handleSort('combinedNoiseDbA')}>Noise (dBA) {getSortIndicator('combinedNoiseDbA')}</button></th>
                <th><button type="button" onClick={() => handleSort('filterLifeHours')}>Filter Life (h) {getSortIndicator('filterLifeHours')}</button></th>
                <th><button type="button" onClick={() => handleSort('purchaseCost')}>Purchase ({selectedCountryCurrency}) {getSortIndicator('purchaseCost')}</button></th>
                <th><button type="button" onClick={() => handleSort('electricityCost')}>Electricity ({selectedCountryCurrency}) {getSortIndicator('electricityCost')}</button></th>
                <th><button type="button" onClick={() => handleSort('filterCost')}>Filters ({selectedCountryCurrency}) {getSortIndicator('filterCost')}</button></th>
                <th><button type="button" onClick={() => handleSort('totalCostOfOwnership')}>TCO ({selectedCountryCurrency}) {getSortIndicator('totalCostOfOwnership')}</button></th>
              </tr>
            </thead>
            <tbody>
              {sortedAirPurifierGroupsWithCosts.map((group) => (
                <tr key={`${group.purifierId}-${group.speedId}-${group.quantity}`}>
                  <td>{group.brand}</td>
                  <td>{group.model}</td>
                  <td>{group.speedName}</td>
                  <td>{group.quantity}</td>
                  <td title={`Total CADR = ${group.totalCadrM3PerHour.toFixed(2)} m³/h (single unit ${(group.totalCadrM3PerHour / group.quantity).toFixed(2)} × quantity ${group.quantity})`}>
                    {group.totalCadrM3PerHour.toFixed(2)}
                  </td>
                  <td title={`Total power = ${group.totalPowerWatts.toFixed(2)} W (single unit ${(group.totalPowerWatts / group.quantity).toFixed(2)} × quantity ${group.quantity})`}>
                    {group.totalPowerWatts.toFixed(2)}
                  </td>
                  <td title={`Combined noise from ${group.quantity} units: ${group.combinedNoiseDbA.toFixed(1)} dBA`}>
                    {group.combinedNoiseDbA.toFixed(1)}
                  </td>
                  <td title={group.filterLifeHours === null
                    ? 'Filter life unavailable for this configuration'
                    : `Estimated from CADR decay model. Stop reason: ${group.filterLifeEstimate?.stopReason ?? 'n/a'}`}>
                    {group.filterLifeHours === null ? 'N/A' : group.filterLifeHours.toFixed(0)}
                  </td>
                  <td title={group.purchaseCost === null
                    ? 'Purchase cost unavailable: purifier price missing'
                    : `Purchase = unit price × quantity = ${(group.purchaseCost / group.quantity).toFixed(2)} × ${group.quantity}`}>
                    {group.purchaseCost === null ? 'N/A' : group.purchaseCost.toFixed(2)}
                  </td>
                  <td title={group.electricityCost === null
                    ? 'Electricity cost unavailable: electricity price missing'
                    : `Electricity = (power W / 1000) × ${group.ownershipPeriodHours} h × ${(currentElectricityPrice ?? 0).toFixed(4)} ${selectedCountryCurrency}/kWh`}>
                    {group.electricityCost === null ? 'N/A' : group.electricityCost.toFixed(2)}
                  </td>
                  <td title={group.filterCost === null
                    ? 'Filter cost unavailable: filter price or filter life missing'
                    : `Filters = unit filter price × quantity × replacements = ${(group.filterCost / (group.quantity * (group.filterReplacements || 1))).toFixed(2)} × ${group.quantity} × ${group.filterReplacements}`}>
                    {group.filterCost === null ? 'N/A' : group.filterCost.toFixed(2)}
                  </td>
                  <td title={group.totalCostOfOwnership === null
                    ? 'TCO unavailable: one or more cost components missing'
                    : `TCO = Purchase + Electricity + Filters = ${group.purchaseCost?.toFixed(2)} + ${group.electricityCost?.toFixed(2)} + ${group.filterCost?.toFixed(2)}`}>
                    {group.totalCostOfOwnership === null ? 'N/A' : group.totalCostOfOwnership.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default App

import {
  DEFAULT_DECIMAL_PLACES,
  DEFAULT_INTEGER_DIGITS,
  MAX_ANNUAL_OPERATING_HOURS,
  MAX_OWNERSHIP_YEARS,
  FORM_DECIMAL_PLACES_BY_FIELD,
  FORM_INTEGER_DIGITS_BY_FIELD,
  LOCATION_DECIMAL_PLACES,
  LOCATION_INTEGER_DIGITS,
  FILTER_USAGE_LIMIT_DECIMAL_PLACES,
  FILTER_USAGE_LIMIT_INTEGER_DIGITS,
} from '../constants/appConfig.js';
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
} from '../utils/numberInput.js';

const decimalFormFieldNames = new Set(Object.keys(FORM_DECIMAL_PLACES_BY_FIELD));

const useInputHandlers = ({
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
}) => {
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
      [name]: numericValue === '' ? '' : Number(numericValue),
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

    if (value === '') {
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
      e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length),
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
      event.target.value.slice(0, event.target.selectionStart ?? event.target.value.length),
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

  return {
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
  };
};

export default useInputHandlers;

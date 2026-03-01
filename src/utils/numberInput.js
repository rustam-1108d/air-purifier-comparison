import { DEFAULT_DECIMAL_PLACES, DEFAULT_INTEGER_DIGITS, GROUPING_SEPARATOR } from '../constants/appConfig.js';

export const normalizeDecimalInput = (value) => value.replace(/[\s\u202F]/g, '').replace(/,/g, '.');

export const isValidDecimalInput = (
  value,
  maxDecimalPlaces = DEFAULT_DECIMAL_PLACES,
  maxIntegerDigits = DEFAULT_INTEGER_DIGITS,
) => {
  const pattern = new RegExp(`^\\d{0,${maxIntegerDigits}}(\\.\\d{0,${maxDecimalPlaces}})?$`);
  return pattern.test(value);
};

export const parseDecimalForForm = (value) => (value === '' || value === '.' ? '' : Number(value));

export const parseDecimalForNullable = (value) => (value === '' || value === '.' ? null : Number(value));

export const formatIntegerInputString = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, GROUPING_SEPARATOR);
};

export const formatDecimalInputString = (value) => {
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

export const countMatchingCharacters = (value, matcher) => (
  Array.from(value).reduce((count, character) => (matcher(character) ? count + 1 : count), 0)
);

export const getCaretPositionForRawIndex = (formattedValue, rawIndex, matcher) => {
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

export const scheduleCaretPosition = ({
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

export const isDigitCharacter = (character) => /\d/.test(character);
export const isDecimalCharacter = (character) => /[\d.]/.test(character);

export const formatGroupedNumber = (
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

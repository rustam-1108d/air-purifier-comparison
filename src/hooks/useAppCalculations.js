import { useMemo } from 'react';

import calculateRequiredParticulateCADR from '../utils/calculateRequiredParticulateCADR';
import buildAirPurifierGroups from '../utils/buildAirPurifierGroups';
import countries from '../data/countries.js';
import cities from '../data/cities.js';
import { airPurifiers } from '../data/airPurifiers.js';
import {
  MIN_ANNUAL_OPERATING_HOURS,
  MAX_ANNUAL_OPERATING_HOURS,
  MIN_OWNERSHIP_YEARS,
  MAX_OWNERSHIP_YEARS,
} from '../constants/appConfig.js';

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

const useAppCalculations = ({
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
}) => {
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
    copy.pm10MustIncludePm25(copy.outdoorAnnualConcentration),
  );
  const indoorLimitPmHierarchyValidationMessage = getPm10IncludesPm2_5ValidationMessage(
    form.indoorPm2_5AnnualAverageConcentrationLimit,
    form.indoorPm10AnnualAverageConcentrationLimit,
    copy.pm10MustIncludePm25(copy.indoorConcentrationLimit),
  );
  const indoorGenerationPmHierarchyValidationMessage = getPm10IncludesPm2_5ValidationMessage(
    form.indoorPm2_5GenerationRate,
    form.indoorPm10GenerationRate,
    copy.pm10MustIncludePm25(copy.indoorGenerationRate),
  );
  const maxFilterUsageHoursGlobalValidationMessage = getFilterUsageLimitValidationMessage(
    maxFilterUsageHoursGlobal,
    copy.filterUsageLimitPositive,
  );
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
      (group) => Number.isFinite(group.totalCostOfOwnership),
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

  return {
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
    airPurifierGroupsWithCosts,
    sortedAirPurifierGroupsWithCosts,
    bestValueGroup,
    electricityDraftKey,
    pm2_5DraftKey,
    pm10DraftKey,
    getFilterUsageLimitValidationMessage,
  };
};

export default useAppCalculations;

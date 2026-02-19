import { useState } from 'react'

import calculateRequiredParticulateCADR from './utils/calculateRequiredParticulateCADR';

import countries from './data/countries.js';
import cities from './data/cities.js';
import { getInitialElectricityPriceByCountry, getInitialElectricityPriceByCity } from './data/electricityPrices.js';
import { airPurifiers } from './data/airPurifiers.js';

import './App.css'

function App() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0].code);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [electricityPricesByCountry, setElectricityPricesByCountry] = useState(
    () => {
      const initialElectricityPrices = getInitialElectricityPriceByCountry();
      return Object.fromEntries(countries.map((country) => [country.code, initialElectricityPrices[country.code] ?? '']));
    }
  );
  const [electricityPricesByCity, setElectricityPricesByCity] = useState(
    () => getInitialElectricityPriceByCity()
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
  console.log('Electricity Prices by Country:', electricityPricesByCountry);
  console.log('Electricity Prices by City:', electricityPricesByCity);
  console.log('Air Purifier Prices by Country:', airPurifierPricesByCountry);
  console.log('Filter Prices by Country:', filterPricesByCountry);

  const [form, setForm] = useState({
    outdoorPm2_5Concentration: 15,
    outdoorPm10Concentration: 40,
    indoorPm2_5ConcentrationLimit: 5,
    indoorPm10ConcentrationLimit: 15,
    ventilationRate: 30,
    indoorPm2_5GenerationRate: 0,
    indoorPm10GenerationRate: 0,
    roomVolume: 50,
    maxAirPurifierCount: 2,
    maxCombinedNoiseDbA: 37,

    annualOperatingHours: 8760,
    ownershipYears: 5,
  });

  const requiredPm2_5CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm2_5ConcentrationLimit,
    outdoorParticulateConcentration: form.outdoorPm2_5Concentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm2_5GenerationRate,
    roomVolume: form.roomVolume,
  });

  const requiredPm10CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm10ConcentrationLimit,
    outdoorParticulateConcentration: form.outdoorPm10Concentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm10GenerationRate,
    roomVolume: form.roomVolume,
  });

  const minimumRequiredCADR = Math.max(requiredPm2_5CADR ?? 0, requiredPm10CADR ?? 0);

  const selectedCountryData = countries.find((country) => country.code === selectedCountry);
  const availableCities = cities.filter((city) => city.countryCode === selectedCountry);

  const currentElectricityPrice = selectedCityId
    ? (electricityPricesByCity[selectedCityId] ?? '')
    : (electricityPricesByCountry[selectedCountry] ?? '');

  // console.log(form);
  // console.log('availableCities:', availableCities);
  // console.log('selectedCountryData:', selectedCountryData);
  console.log('Current Electricity Price:', currentElectricityPrice);


  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters

    setForm((prev) => ({
      ...prev,
      [name]: numericValue === "" ? "" : Number(numericValue),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    // If the input is empty, set it to 0 on blur
    if (value === "") {
      setForm((prev) => ({
        ...prev,
        [name]: 0,
      }));
    }
  };

  const handleElectricityPriceChange = (e) => {
    const { value } = e.target;

    if (/^\d*(\.\d{0,4})?$/.test(value)) {
      if (selectedCityId) {
        setElectricityPricesByCity((prev) => ({
          ...prev,
          [selectedCityId]: value,
        }));
      } else {
        setElectricityPricesByCountry((prev) => ({
          ...prev,
          [selectedCountry]: value,
        }));
      }
    }
  };

  const handleAirPurifierPriceChange = (purifierId, value) => {
    if (/^\d*(\.\d{0,4})?$/.test(value)) {
      setAirPurifierPricesByCountry((prev) => ({
        ...prev,
        [purifierId]: {
          ...prev[purifierId],
          [selectedCountry]: value,
        },
      }));
    }
  };

  const handleFilterPriceChange = (purifierId, value) => {
    if (/^\d*(\.\d{0,4})?$/.test(value)) {
      setFilterPricesByCountry((prev) => ({
        ...prev,
        [purifierId]: {
          ...prev[purifierId],
          [selectedCountry]: value,
        },
      }));
    }
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
        <label htmlFor="electricityPrice">Electricity Price ({selectedCountryData?.currency}/kWh)</label>
        <input
          type="text"
          id="electricityPrice"
          name="electricityPrice"
          inputMode="decimal"
          value={currentElectricityPrice}
          onChange={handleElectricityPriceChange}
          placeholder="0.0000"
        />
      </div>

      <div>
        <label htmlFor="outdoorPm2_5Concentration">Outdoor PM2.5 Concentration</label>
        <input type="text" id="outdoorPm2_5Concentration" name="outdoorPm2_5Concentration" maxLength={4} inputMode="numeric" pattern="\d*" value={form.outdoorPm2_5Concentration} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="outdoorPm10Concentration">Outdoor PM10 Concentration</label>
        <input type="text" id="outdoorPm10Concentration" name="outdoorPm10Concentration" maxLength={4} inputMode="numeric" pattern="\d*" value={form.outdoorPm10Concentration} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm2_5ConcentrationLimit">Indoor PM2.5 Concentration Limit</label>
        <input type="text" id="indoorPm2_5ConcentrationLimit" name="indoorPm2_5ConcentrationLimit" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm2_5ConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10ConcentrationLimit">Indoor PM10 Concentration Limit</label>
        <input type="text" id="indoorPm10ConcentrationLimit" name="indoorPm10ConcentrationLimit" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm10ConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="ventilationRate">Ventilation Rate</label>
        <input type="text" id="ventilationRate" name="ventilationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.ventilationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm2_5GenerationRate">Indoor PM2.5 Generation Rate</label>
        <input type="text" id="indoorPm2_5GenerationRate" name="indoorPm2_5GenerationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm2_5GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10GenerationRate">Indoor PM10 Generation Rate</label>
        <input type="text" id="indoorPm10GenerationRate" name="indoorPm10GenerationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm10GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="roomVolume">Room Volume</label>
        <input type="text" id="roomVolume" name="roomVolume" maxLength={4} inputMode="numeric" pattern="\d*" value={form.roomVolume} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="maxAirPurifierCount">Max Air Purifier Count</label>
        <input type="text" id="maxAirPurifierCount" name="maxAirPurifierCount" maxLength={2} inputMode="numeric" pattern="\d*" value={form.maxAirPurifierCount} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="maxCombinedNoiseDbA">Max Combined Noise (dB)</label>
        <input type="text" id="maxCombinedNoiseDbA" name="maxCombinedNoiseDbA" maxLength={3} inputMode="numeric" pattern="\d*" value={form.maxCombinedNoiseDbA} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="annualOperatingHours">Annual Operating Hours</label>
        <input type="text" id="annualOperatingHours" name="annualOperatingHours" maxLength={4} inputMode="numeric" pattern="\d*" value={form.annualOperatingHours} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="ownershipYears">Ownership Years</label>
        <input type="text" id="ownershipYears" name="ownershipYears" maxLength={2} inputMode="numeric" pattern="\d*" value={form.ownershipYears} onChange={handleChange} onBlur={handleBlur} />
      </div>

      <div>
        {requiredPm2_5CADR === null ? <p>Indoor PM2.5 Concentration Limit must be greater than zero</p> : <p>Required CADR for PM2.5: {requiredPm2_5CADR.toFixed(2)} m³/h</p>}
        {requiredPm10CADR === null ? <p>Indoor PM10 Concentration Limit must be greater than zero</p> : <p>Required CADR for PM10: {requiredPm10CADR.toFixed(2)} m³/h</p>}
        {minimumRequiredCADR === 0 ? <p>At least one of the required CADR values must be greater than zero</p> : <p>Minimum Required CADR: {minimumRequiredCADR.toFixed(2)} m³/h</p>}
      </div>

      <div>
        <h2>Air Purifier Prices ({selectedCountry})</h2>
        {airPurifiers.map((purifier) => {
          const purifierCurrency = selectedCountryData?.currency;
          const filterCurrency = selectedCountryData?.currency;

          return (
            <div key={purifier.id}>
              <h3>{purifier.brand} {purifier.model}</h3>
              <div>
                <label htmlFor={`purifier-price-${purifier.id}`}>
                  Purifier Price ({purifierCurrency})
                </label>
                <input
                  type="text"
                  id={`purifier-price-${purifier.id}`}
                  inputMode="decimal"
                  value={airPurifierPricesByCountry[purifier.id]?.[selectedCountry] ?? ''}
                  onChange={(e) => handleAirPurifierPriceChange(purifier.id, e.target.value)}
                  placeholder="0.0000"
                />
              </div>
              <div>
                <label htmlFor={`filter-price-${purifier.id}`}>
                  Filter Price ({filterCurrency})
                </label>
                <input
                  type="text"
                  id={`filter-price-${purifier.id}`}
                  inputMode="decimal"
                  value={filterPricesByCountry[purifier.id]?.[selectedCountry] ?? ''}
                  onChange={(e) => handleFilterPriceChange(purifier.id, e.target.value)}
                  placeholder="0.0000"
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  )
}

export default App

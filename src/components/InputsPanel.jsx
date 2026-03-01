import countries from '../data/countries.js';
import HelpTextWithTooltip from './HelpTextWithTooltip';

const InputsPanel = ({
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
}) => (
  <section className="card">
    <h2>{copy.inputsTitle}</h2>
    <p className="section-intro">{copy.inputsIntro}</p>
    <div className="input-groups">
      <div className="input-group">
        <h3>{copy.section1Title}</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="country">
              <HelpTextWithTooltip
                label={copy.country}
                helpText={copy.countryHelp}
                ariaLabel={copy.helpAria(copy.country)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
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
                  {getLocalizedCountryName(country)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="city">
              <HelpTextWithTooltip
                label={copy.cityOptional}
                helpText={copy.cityOptionalHelp}
                ariaLabel={copy.helpAria(copy.cityOptional)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <select id="city" name="city" value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
              <option value="">{copy.countryAverage}</option>
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {getLocalizedCityName(city)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="outdoorPm2_5AnnualAverageConcentration">
              <HelpTextWithTooltip
                label={copy.outdoorPm25Label}
                helpText={copy.outdoorPm25Help}
                ariaLabel={copy.helpAria(copy.outdoorPm25Label)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
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
              <HelpTextWithTooltip
                label={copy.outdoorPm10Label}
                helpText={copy.outdoorPm10Help}
                ariaLabel={copy.helpAria(copy.outdoorPm10Label)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
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
              <HelpTextWithTooltip
                label={copy.indoorPm25LimitLabel}
                helpText={copy.indoorPm25LimitHelp}
                ariaLabel={copy.helpAria(copy.indoorPm25LimitLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="indoorPm2_5AnnualAverageConcentrationLimit"
              name="indoorPm2_5AnnualAverageConcentrationLimit"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.indoorPm2_5AnnualAverageConcentrationLimit ?? form.indoorPm2_5AnnualAverageConcentrationLimit)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="indoorPm10AnnualAverageConcentrationLimit">
              <HelpTextWithTooltip
                label={copy.indoorPm10LimitLabel}
                helpText={copy.indoorPm10LimitHelp}
                ariaLabel={copy.helpAria(copy.indoorPm10LimitLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="indoorPm10AnnualAverageConcentrationLimit"
              name="indoorPm10AnnualAverageConcentrationLimit"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.indoorPm10AnnualAverageConcentrationLimit ?? form.indoorPm10AnnualAverageConcentrationLimit)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {indoorLimitPmHierarchyValidationMessage && (
              <p className="message error">{indoorLimitPmHierarchyValidationMessage}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="indoorPm2_5GenerationRate">
              <HelpTextWithTooltip
                label={copy.indoorPm25GenerationLabel}
                helpText={copy.indoorPm25GenerationHelp}
                ariaLabel={copy.helpAria(copy.indoorPm25GenerationLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="indoorPm2_5GenerationRate"
              name="indoorPm2_5GenerationRate"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.indoorPm2_5GenerationRate ?? form.indoorPm2_5GenerationRate)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="indoorPm10GenerationRate">
              <HelpTextWithTooltip
                label={copy.indoorPm10GenerationLabel}
                helpText={copy.indoorPm10GenerationHelp}
                ariaLabel={copy.helpAria(copy.indoorPm10GenerationLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="indoorPm10GenerationRate"
              name="indoorPm10GenerationRate"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.indoorPm10GenerationRate ?? form.indoorPm10GenerationRate)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
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
              <HelpTextWithTooltip
                label={copy.roomVolumeLabel}
                helpText={copy.roomVolumeHelp}
                ariaLabel={copy.helpAria(copy.roomVolumeLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="roomVolume"
              name="roomVolume"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.roomVolume ?? form.roomVolume)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="ventilationRate">
              <HelpTextWithTooltip
                label={copy.ventilationRateLabel}
                helpText={copy.ventilationRateHelp}
                ariaLabel={copy.helpAria(copy.ventilationRateLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="ventilationRate"
              name="ventilationRate"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.ventilationRate ?? form.ventilationRate)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="maxAirPurifierCount">
              <HelpTextWithTooltip
                label={copy.maxPurifierCountLabel}
                helpText={copy.maxPurifierCountHelp}
                ariaLabel={copy.helpAria(copy.maxPurifierCountLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="maxAirPurifierCount"
              name="maxAirPurifierCount"
              maxLength={2}
              inputMode="numeric"
              pattern="\d*"
              value={formatIntegerInputString(form.maxAirPurifierCount)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="maxCombinedNoiseDbA">
              <HelpTextWithTooltip
                label={copy.maxNoiseLabel}
                helpText={copy.maxNoiseHelp}
                ariaLabel={copy.helpAria(copy.maxNoiseLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="maxCombinedNoiseDbA"
              name="maxCombinedNoiseDbA"
              inputMode="decimal"
              value={formatDecimalInputString(inputDrafts.maxCombinedNoiseDbA ?? form.maxCombinedNoiseDbA)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>

      <div className="input-group">
        <h3>{copy.section4Title}</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="electricityPrice">
              <HelpTextWithTooltip
                label={copy.electricityPriceLabel(selectedCountryCurrency)}
                helpText={copy.electricityPriceHelp}
                ariaLabel={copy.helpAria(copy.electricityPriceLabel(selectedCountryCurrency))}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
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
              <HelpTextWithTooltip
                label={copy.annualOperatingHoursLabel}
                helpText={copy.annualOperatingHoursHelp}
                ariaLabel={copy.helpAria(copy.annualOperatingHoursLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="annualOperatingHours"
              name="annualOperatingHours"
              maxLength={4}
              inputMode="numeric"
              pattern="\d*"
              value={formatIntegerInputString(form.annualOperatingHours)}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="8760"
            />
            {annualOperatingHoursValidationMessage && (
              <p className="message error">{annualOperatingHoursValidationMessage}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="ownershipYears">
              <HelpTextWithTooltip
                label={copy.ownershipYearsLabel}
                helpText={copy.ownershipYearsHelp}
                ariaLabel={copy.helpAria(copy.ownershipYearsLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            </label>
            <input
              type="text"
              id="ownershipYears"
              name="ownershipYears"
              maxLength={2}
              inputMode="numeric"
              pattern="\d*"
              value={formatIntegerInputString(form.ownershipYears)}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {ownershipYearsValidationMessage && (
              <p className="message error">{ownershipYearsValidationMessage}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="maxFilterUsageHoursGlobal">
              <HelpTextWithTooltip
                label={copy.maxFilterUsageGlobalLabel}
                helpText={copy.maxFilterUsageGlobalHelp}
                ariaLabel={copy.helpAria(copy.maxFilterUsageGlobalLabel)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
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
);

export default InputsPanel;

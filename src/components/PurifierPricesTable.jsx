import { airPurifiers } from '../data/airPurifiers.js';

const PurifierPricesTable = ({
  copy,
  selectedCountryDisplayName,
  selectedCountryCurrency,
  renderHeaderWithHelp,
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
}) => (
  <section className="card table-card">
    <h2>{copy.purifierPricesTitle(selectedCountryDisplayName)}</h2>
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
            const purifierMaxFilterUsageValidationMessage = getFilterUsageLimitValidationMessage(
              maxFilterUsageHoursByPurifier[purifier.id],
              copy.filterUsageLimitPositive,
            );

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
                          ?? (airPurifierPricesByCountry[purifier.id]?.[selectedCountry] ?? ''),
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
                          ?? (filterPricesByCountry[purifier.id]?.[selectedCountry] ?? ''),
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
                          ?? (maxFilterUsageHoursByPurifier[purifier.id] ?? ''),
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
);

export default PurifierPricesTable;

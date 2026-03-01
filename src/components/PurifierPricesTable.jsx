import { airPurifiers } from '../data/airPurifiers.js';
import HelpTextWithTooltip from './HelpTextWithTooltip';

const PurifierPricesTable = ({
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
}) => (
  <section className="card table-card">
    <h2>{copy.purifierPricesTitle(selectedCountryDisplayName)}</h2>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{copy.brand}</th>
            <th>{copy.model}</th>
            <th>
              <HelpTextWithTooltip
                label={copy.purifierPriceHeader(selectedCountryCurrency)}
                helpText={copy.purifierPriceHelpHeader}
                ariaLabel={copy.helpAria(copy.purifierPriceHeader(selectedCountryCurrency))}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                className="table-header-with-help"
              />
            </th>
            <th>
              <HelpTextWithTooltip
                label={copy.filterPriceHeader(selectedCountryCurrency)}
                helpText={copy.filterPriceHelpHeader}
                ariaLabel={copy.helpAria(copy.filterPriceHeader(selectedCountryCurrency))}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                className="table-header-with-help"
              />
            </th>
            <th>
              <HelpTextWithTooltip
                label={copy.maxFilterUsageHeader}
                helpText={copy.maxFilterUsageHelpHeader}
                ariaLabel={copy.helpAria(copy.maxFilterUsageHeader)}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                className="table-header-with-help"
              />
            </th>
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

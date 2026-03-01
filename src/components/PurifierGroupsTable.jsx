import HelpTextWithTooltip from './HelpTextWithTooltip';

const PurifierGroupsTable = ({
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
}) => (
  <section className="card table-card">
    <h2>{copy.purifierGroupsTitle}</h2>
    {bestValueGroup && (
      <div className="summary-card" role="status" aria-live="polite">
        <p className="summary-title">
          {copy.bestValueOption} <strong>{bestValueGroup.brand} {bestValueGroup.model}</strong> ({bestValueGroup.quantity}{' '}
          {bestValueGroup.quantity > 1 ? copy.units : copy.unit}, {bestValueGroup.speedName})
        </p>
        <p className="summary-metrics">
          {copy.tcoLabel}{' '}
          <strong>{formatNumber(bestValueGroup.totalCostOfOwnership, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCountryCurrency}</strong>
          {' · '}
          {copy.startingCadrLabel}{' '}
          <strong>{formatNumber(bestValueGroup.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong>
          {' · '}
          {copy.noiseLabel}{' '}
          <strong>{formatNumber(bestValueGroup.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dBA</strong>
        </p>
      </div>
    )}
    {isCostPeriodValid ? (
      <p className="message info">
        {copy.ownershipPeriodMessage(
          formatNumber(form.ownershipYears),
          formatNumber(form.annualOperatingHours),
          formatNumber(form.ownershipYears * form.annualOperatingHours),
        )}
      </p>
    ) : (
      <p className="message error">{copy.ownershipPeriodUnavailable}</p>
    )}
    {sortedAirPurifierGroupsWithCosts.length === 0 ? (
      <p className="message info">{copy.noMatchingGroups}</p>
    ) : (
      <div className="table-wrap">
        <table className="air-purifier-groups-table">
          <thead>
            <tr>
              <th><button type="button" className={getSortButtonClassName('brand')} onClick={() => handleSort('brand')}>{copy.brand} {getSortIndicator('brand')}</button></th>
              <th><button type="button" className={getSortButtonClassName('model')} onClick={() => handleSort('model')}>{copy.model} {getSortIndicator('model')}</button></th>
              <th><button type="button" className={getSortButtonClassName('speedName')} onClick={() => handleSort('speedName')}>{copy.speedSetting} {getSortIndicator('speedName')}</button></th>
              <th>
                <button type="button" className={getSortButtonClassName('quantity')} onClick={() => handleSort('quantity')}>
                  <HelpTextWithTooltip
                    label={`${copy.quantity} ${getSortIndicator('quantity')}`}
                    helpText={copy.quantityHelp}
                    ariaLabel={copy.helpAria(copy.quantity)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
              <th>
                <button type="button" className={getSortButtonClassName('totalCadrM3PerHour')} onClick={() => handleSort('totalCadrM3PerHour')}>
                  <HelpTextWithTooltip
                    label={`${copy.totalStartingCadr} ${getSortIndicator('totalCadrM3PerHour')}`}
                    helpText={copy.totalStartingCadrHelp}
                    ariaLabel={copy.helpAria(copy.totalStartingCadr)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
              <th><button type="button" className={getSortButtonClassName('totalPowerWatts')} onClick={() => handleSort('totalPowerWatts')}>{copy.totalPower} {getSortIndicator('totalPowerWatts')}</button></th>
              <th><button type="button" className={getSortButtonClassName('combinedNoiseDbA')} onClick={() => handleSort('combinedNoiseDbA')}>{copy.combinedNoise} {getSortIndicator('combinedNoiseDbA')}</button></th>
              <th>
                <button type="button" className={getSortButtonClassName('filterLifeHours')} onClick={() => handleSort('filterLifeHours')}>
                  <HelpTextWithTooltip
                    label={`${copy.estimatedFilterLife} ${getSortIndicator('filterLifeHours')}`}
                    helpText={copy.estimatedFilterLifeHelp}
                    ariaLabel={copy.helpAria(copy.estimatedFilterLife)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
              <th><button type="button" className={getSortButtonClassName('purchaseCost')} onClick={() => handleSort('purchaseCost')}>{copy.initialPurchaseCost(selectedCountryCurrency)} {getSortIndicator('purchaseCost')}</button></th>
              <th>
                <button type="button" className={getSortButtonClassName('electricityCost')} onClick={() => handleSort('electricityCost')}>
                  <HelpTextWithTooltip
                    label={`${copy.totalElectricityCost(selectedCountryCurrency)} ${getSortIndicator('electricityCost')}`}
                    helpText={copy.totalElectricityCostHelp}
                    ariaLabel={copy.helpAria(copy.totalElectricityCost(selectedCountryCurrency))}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
              <th>
                <button type="button" className={getSortButtonClassName('filterCost')} onClick={() => handleSort('filterCost')}>
                  <HelpTextWithTooltip
                    label={`${copy.totalFilterReplacementCost(selectedCountryCurrency)} ${getSortIndicator('filterCost')}`}
                    helpText={copy.totalFilterReplacementCostHelp}
                    ariaLabel={copy.helpAria(copy.totalFilterReplacementCost(selectedCountryCurrency))}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
              <th>
                <button type="button" className={getSortButtonClassName('totalCostOfOwnership')} onClick={() => handleSort('totalCostOfOwnership')}>
                  <HelpTextWithTooltip
                    label={`${copy.totalCostOfOwnership(selectedCountryCurrency)} ${getSortIndicator('totalCostOfOwnership')}`}
                    helpText={copy.totalCostOfOwnershipHelp}
                    ariaLabel={copy.helpAria(copy.totalCostOfOwnership(selectedCountryCurrency))}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    className="table-header-with-help"
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAirPurifierGroupsWithCosts.map((group) => (
              <tr key={`${group.purifierId}-${group.speedId}-${group.quantity}`}>
                <td>{group.brand}</td>
                <td>{group.model}</td>
                <td>{group.speedName}</td>
                <td>{group.quantity}</td>
                <td className="cell-tooltip" data-tooltip={copy.totalCadrTooltip(
                  `${formatNumber(group.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  `${formatNumber(group.totalCadrM3PerHour / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  group.quantity,
                )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{formatNumber(group.totalCadrM3PerHour, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={copy.totalPowerTooltip(
                  `${formatNumber(group.totalPowerWatts, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  `${formatNumber(group.totalPowerWatts / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  group.quantity,
                )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{formatNumber(group.totalPowerWatts, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={copy.noiseTooltip(
                  group.quantity,
                  `${formatNumber(group.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
                )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{formatNumber(group.combinedNoiseDbA, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={group.effectiveFilterLifeHours === null
                  ? copy.filterLifeUnavailable
                  : Number.isFinite(group.appliedMaxFilterUsageHours)
                    ? copy.cappedByUsageLimit(
                      formatNumber(group.appliedMaxFilterUsageHours, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      group.filterLifeEstimate?.stopReason ?? copy.stopReasonFallback,
                    )
                    : copy.estimatedFromModel(group.filterLifeEstimate?.stopReason ?? copy.stopReasonFallback)} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{group.effectiveFilterLifeHours === null ? copy.notAvailable : formatNumber(group.effectiveFilterLifeHours)}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={group.purchaseCost === null
                  ? copy.purchaseUnavailable
                  : copy.purchaseTooltip(
                    formatNumber(group.purchaseCost / group.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    group.quantity,
                  )} data-tooltip-max-width="360" data-tooltip-estimated-height="108" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{group.purchaseCost === null ? copy.notAvailable : formatNumber(group.purchaseCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={group.electricityCost === null
                  ? copy.electricityUnavailable
                  : copy.electricityTooltip(
                    formatNumber(group.ownershipPeriodHours),
                    formatNumber(currentElectricityPrice ?? 0, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
                    selectedCountryCurrency,
                  )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{group.electricityCost === null ? copy.notAvailable : formatNumber(group.electricityCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={group.filterCost === null
                  ? copy.filterCostUnavailable
                  : copy.filterTooltip(
                    formatNumber(group.filterCost / (group.quantity * (group.filterReplacements || 1)), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    group.quantity,
                    group.filterReplacements,
                  )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{group.filterCost === null ? copy.notAvailable : formatNumber(group.filterCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="cell-tooltip" data-tooltip={group.totalCostOfOwnership === null
                  ? copy.tcoUnavailable
                  : copy.tcoTooltip(
                    formatNumber(group.purchaseCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    formatNumber(group.electricityCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    formatNumber(group.filterCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                  )} data-tooltip-max-width="360" data-tooltip-estimated-height="124" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                  <span className="cell-tooltip-value">{group.totalCostOfOwnership === null ? copy.notAvailable : formatNumber(group.totalCostOfOwnership, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default PurifierGroupsTable;

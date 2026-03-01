const RequiredCadrPanel = ({
  copy,
  requiredPm2_5CADR,
  requiredPm10CADR,
  minimumRequiredCADR,
  formatNumber,
}) => (
  <section className="card metric-panel">
    <h2>{copy.requiredCadrTitle}</h2>
    <div className="metrics-grid">
      {requiredPm2_5CADR === null ? (
        <p className="metric-item">{copy.pm25LimitPositive}</p>
      ) : (
        <p className="metric-item">
          {copy.requiredCadrPm25}{' '}
          <strong>{formatNumber(requiredPm2_5CADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong>
        </p>
      )}
      {requiredPm10CADR === null ? (
        <p className="metric-item">{copy.pm10LimitPositive}</p>
      ) : (
        <p className="metric-item">
          {copy.requiredCadrPm10}{' '}
          <strong>{formatNumber(requiredPm10CADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong>
        </p>
      )}
      {minimumRequiredCADR === 0 ? (
        <p className="metric-item">{copy.oneCadrPositive}</p>
      ) : (
        <p className="metric-item">
          {copy.minimumRequiredCadr}{' '}
          <strong>{formatNumber(minimumRequiredCADR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³/h</strong>
        </p>
      )}
    </div>
  </section>
);

export default RequiredCadrPanel;

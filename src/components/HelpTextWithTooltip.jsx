const HelpTextWithTooltip = ({
  label,
  helpText,
  ariaLabel,
  showTooltip,
  hideTooltip,
  className = 'label-with-help',
}) => (
  <span className={className}>
    <span>{label}</span>
    {helpText && (
      <span
        className="help-dot"
        aria-label={ariaLabel}
        tabIndex={0}
        data-tooltip={helpText}
        data-tooltip-max-width="320"
        data-tooltip-estimated-height="96"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        ?
      </span>
    )}
  </span>
);

export default HelpTextWithTooltip;

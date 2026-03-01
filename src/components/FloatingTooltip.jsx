const FloatingTooltip = ({ activeTooltip }) => {
  if (!activeTooltip) {
    return null;
  }

  return (
    <div
      className={`floating-tooltip floating-tooltip--${activeTooltip.vertical}`}
      style={{
        left: `${activeTooltip.left}px`,
        top: `${activeTooltip.anchorY}px`,
        width: `${activeTooltip.width}px`,
        '--tooltip-arrow-left': `${activeTooltip.arrowOffset}px`,
      }}
      role="tooltip"
    >
      {activeTooltip.text}
    </div>
  );
};

export default FloatingTooltip;

import { useEffect, useState } from 'react';

const useFloatingTooltip = () => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    if (!activeTooltip) {
      return undefined;
    }

    const hideTooltip = () => setActiveTooltip(null);

    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);

    return () => {
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('resize', hideTooltip);
    };
  }, [activeTooltip]);

  const showTooltip = (event) => {
    const element = event.currentTarget;
    const tooltipText = element.dataset.tooltip;

    if (!tooltipText) {
      setActiveTooltip(null);
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const anchorElement = element.classList.contains('cell-tooltip')
      ? (element.querySelector('.cell-tooltip-value') ?? element)
      : element;
    const rect = anchorElement.getBoundingClientRect();
    const edgePadding = 16;
    const maxWidth = Number(element.dataset.tooltipMaxWidth ?? 320);
    const estimatedHeight = Number(element.dataset.tooltipEstimatedHeight ?? 96);
    const tooltipWidth = Math.min(maxWidth, viewportWidth - (edgePadding * 2));
    const targetCenterX = rect.left + (rect.width / 2);
    const left = Math.min(
      Math.max(targetCenterX - (tooltipWidth / 2), edgePadding),
      viewportWidth - edgePadding - tooltipWidth,
    );
    const arrowOffset = Math.min(Math.max(targetCenterX - left, 10), tooltipWidth - 10);

    const spaceAbove = rect.top - edgePadding;
    const spaceBelow = viewportHeight - rect.bottom - edgePadding;
    const vertical = spaceAbove < estimatedHeight && spaceBelow > spaceAbove ? 'bottom' : 'top';
    const anchorY = vertical === 'top' ? rect.top : rect.bottom;

    setActiveTooltip({
      text: tooltipText,
      vertical,
      left,
      anchorY,
      width: tooltipWidth,
      arrowOffset,
    });
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  return {
    activeTooltip,
    showTooltip,
    hideTooltip,
  };
};

export default useFloatingTooltip;

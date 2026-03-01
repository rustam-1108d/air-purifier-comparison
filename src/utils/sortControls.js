export const getNextSortConfig = (previousSortConfig, key) => {
  if (previousSortConfig.key === key) {
    return {
      key,
      direction: previousSortConfig.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    key,
    direction: 'asc',
  };
};

export const getSortIndicator = (sortConfig, key) => {
  if (sortConfig.key !== key) return '↕';
  return sortConfig.direction === 'asc' ? '▲' : '▼';
};

export const getSortButtonClassName = (sortConfig, key) => (
  sortConfig.key === key ? 'sort-button is-active' : 'sort-button'
);

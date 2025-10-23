function getScopedWhere(user, customFilters = {}) {
  const { role, locationId } = user;

  if (role === 'admin') {
    return customFilters;
  }

  return {
    ...customFilters,
    locationId,
  };
}

module.exports = { getScopedWhere };

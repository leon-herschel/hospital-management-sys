export const sortByField = (list, field) => {
    return [...list].sort((a, b) => {
      const valueA = (a[field] || "").toLowerCase();
      const valueB = (b[field] || "").toLowerCase();
      return valueA.localeCompare(valueB);
    });
  };
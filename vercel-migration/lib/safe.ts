export const asArray = <T = any>(x: any): T[] => {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    // Intenta extraer de propiedades comunes
    if ('data' in x && Array.isArray(x.data)) return x.data;
    if ('records' in x && Array.isArray(x.records)) return x.records;
    if ('items' in x && Array.isArray(x.items)) return x.items;
  }
  return x ? [x] : [];
};

export const safeSlice = <T = any>(x: any, n?: number): T[] =>
  Array.isArray(x) ? x.slice(0, n) : [];

export const safeSort = <T = any>(x: any, cmp?: (a: T, b: T) => number): T[] => {
  const arr = asArray<T>(x);
  if (arr.length === 0) return [];
  try {
    return [...arr].sort(cmp || ((a: any, b: any) => (a > b ? 1 : -1)));
  } catch (e) {
    console.warn('[safeSort] Error sorting, returning unsorted:', e);
    return arr;
  }
};

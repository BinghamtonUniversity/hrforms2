/* Utility Functions */
export const flattenObject = (obj, parentKey) => {
    let result = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key]||'';
      const _key = parentKey ? parentKey + '.' + key : key;
      if (typeof value === 'object') {
        result = { ...result, ...flattenObject(value, _key) };
      } else {
        result[_key] = value;
      }
    });
    return result;
};

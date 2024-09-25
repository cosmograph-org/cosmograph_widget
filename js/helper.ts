export function toCamelCase (str: string): string {
  return str.replace(/_([A-z])/g, (_, group1) => group1.toUpperCase());
}

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S;

export type CamelCaseKeys<T> = T extends readonly (infer U)[]
  ? CamelCaseKeys<U>[]
  : T extends object
    ? { [K in keyof T as CamelCase<K & string>]: CamelCaseKeys<T[K]> }
    : T;

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

// 後端回傳的欄位是 snake_case（例如 distance_km），前端慣例是 camelCase（distanceKm）。
// 這支函式只轉換 key 的命名風格，不處理欄位型別或計算欄位——那些交給各資源自己的 adapt 函式。
export function toCamelCase<T>(input: unknown): CamelCaseKeys<T> {
  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item)) as CamelCaseKeys<T>;
  }
  if (input !== null && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [snakeToCamelKey(key), toCamelCase(value)])) as CamelCaseKeys<T>;
  }
  return input as CamelCaseKeys<T>;
}

export function pluralForm(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  return n === 1 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
}

export function pluralize(n: number, one: string, few: string, many: string) {
  return `${n} ${pluralForm(n, one, few, many)}`;
}

export function outOf(total: number, one: string, many: string) {
  return total === 1 ? one : many;
}

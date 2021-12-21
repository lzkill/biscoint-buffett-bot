export function percent(value1: number, value2: number) {
  return (value2 / value1 - 1) * 100;
}

export function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num);
}

export function stringify(value: any) {
  return JSON.stringify(value, (k, v) => v ?? undefined, 2);
}

export function terminate() {
  process.exit(1);
}

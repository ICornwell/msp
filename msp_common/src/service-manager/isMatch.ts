export type Matcher = string | RegExp | ((value: string) => boolean);

export function isMatch(input: string, match: Matcher): boolean {
  if (typeof match === 'string') {
    return match === '*' || input === match;
  }
  if (match instanceof RegExp) {
    return match.test(input);
  }
  if (typeof match === 'function') {
    return match(input);
  }
  return false;
}
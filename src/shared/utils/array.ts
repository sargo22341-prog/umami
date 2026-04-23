export function toggleValueInArray<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value]
}

export function toggleValuesInArray<T>(values: readonly T[], toggledValues: readonly T[]): T[] {
  if (toggledValues.length === 0) return [...values]

  const toggledSet = new Set(toggledValues)
  const allPresent = toggledValues.every((value) => values.includes(value))

  if (allPresent) {
    return values.filter((value) => !toggledSet.has(value))
  }

  const nextValues = [...values]
  for (const value of toggledValues) {
    if (!nextValues.includes(value)) {
      nextValues.push(value)
    }
  }
  return nextValues
}

export interface CollapsibleLabelGroup {
  key: string
  itemCount: number
}

export function getDefaultExpandedLabels(
  groups: CollapsibleLabelGroup[],
  maxVisibleItems = 5,
): Set<string> {
  const expandedKeys = new Set<string>()
  let visibleItems = 0

  for (const group of groups) {
    if (group.itemCount <= 0) {
      continue
    }

    if (expandedKeys.size === 0 || visibleItems < maxVisibleItems) {
      expandedKeys.add(group.key)
      visibleItems += group.itemCount
      continue
    }

    break
  }

  return expandedKeys
}

import { DefaultClassGroupIds, createConfigUtils, getDefaultConfig } from '@xmorse/tailwind-merge'

// Create utils with the default config
const configUtils = createConfigUtils(getDefaultConfig())

// Extract class group type from a class string
export function getClassGroupId(className: string): DefaultClassGroupIds | null {
  const groupId = configUtils.getClassGroupId(className)
  return groupId ? (groupId as DefaultClassGroupIds) : null
}

// Filter classes by category (class group ID)
export function filterClassesByCategory(
  classes: string[],
  targetCategory: DefaultClassGroupIds
): string[] {
  return classes.filter(className => {
    const groupId = getClassGroupId(className)
    return groupId === targetCategory
  })
}

// Get classes from an element's className and filter by category
export function getElementClassesForCategory(
  element: Element,
  targetCategory: DefaultClassGroupIds
): string[] {
  const classList = Array.from(element.classList)
  return filterClassesByCategory(classList, targetCategory)
}
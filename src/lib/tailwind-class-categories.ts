import { DefaultClassGroupIds, createConfigUtils, getDefaultConfig } from '@xmorse/tailwind-merge'

// Create utils with the default config
const configUtils = createConfigUtils(getDefaultConfig())

// Meta-categories that group multiple related class types
export const META_CATEGORIES = {
  'sizing': ['w', 'h', 'size', 'min-w', 'min-h', 'max-w', 'max-h'],
  'spacing': ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'ms', 'me'],
  'positioning': ['position', 'top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y', 'z'],
  'flexbox': ['flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'grow', 'shrink', 'basis'],
  'grid': ['grid-cols', 'grid-rows', 'grid-flow', 'col-start', 'col-end', 'row-start', 'row-end', 'gap', 'gap-x', 'gap-y'],
  'typography': ['font-family', 'font-size', 'font-weight', 'font-style', 'text-color', 'text-alignment', 'leading', 'tracking'],
  'background': ['bg-color', 'bg-image', 'bg-size', 'bg-position', 'bg-repeat', 'bg-attachment', 'bg-clip', 'bg-origin'],
  'border': ['border-w', 'border-color', 'border-style', 'border-w-t', 'border-w-b', 'border-w-l', 'border-w-r', 'border-color-t', 'border-color-b', 'border-color-l', 'border-color-r'],
  'border-radius': ['rounded', 'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r', 'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br'],
  'effects': ['shadow', 'shadow-color', 'opacity', 'blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'invert', 'saturate', 'sepia'],
  'transforms': ['scale', 'rotate', 'translate', 'skew', 'transform-origin', 'scale-x', 'scale-y', 'rotate-x', 'rotate-y', 'translate-x', 'translate-y'],
  'layout': ['display', 'overflow', 'overflow-x', 'overflow-y', 'float', 'clear', 'object-fit', 'object-position']
} as const

export type MetaCategoryKey = keyof typeof META_CATEGORIES

// Extract class group type from a class string
export function getClassGroupId(className: string): DefaultClassGroupIds | null {
  const groupId = configUtils.getClassGroupId(className)
  return groupId ? (groupId as DefaultClassGroupIds) : null
}

// Check if a category is a meta-category
export function isMetaCategory(category: string): category is MetaCategoryKey {
  return category in META_CATEGORIES
}

// Filter classes by category (class group ID or meta-category)
export function filterClassesByCategory(
  classes: string[],
  targetCategory: DefaultClassGroupIds | MetaCategoryKey
): string[] {
  if (isMetaCategory(targetCategory)) {
    // Handle meta-categories by checking all included group IDs
    const includedGroups = META_CATEGORIES[targetCategory]
    return classes.filter(className => {
      const groupId = getClassGroupId(className)
      return groupId && (includedGroups as readonly string[]).includes(groupId)
    })
  } else {
    // Handle regular categories
    return classes.filter(className => {
      const groupId = getClassGroupId(className)
      return groupId === targetCategory
    })
  }
}

// Get classes from an element's className and filter by category
export function getElementClassesForCategory(
  element: Element,
  targetCategory: DefaultClassGroupIds | MetaCategoryKey
): string[] {
  const classList = Array.from(element.classList)
  return filterClassesByCategory(classList, targetCategory)
}
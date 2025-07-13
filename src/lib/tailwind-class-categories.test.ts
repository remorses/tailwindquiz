import { describe, test, expect } from 'vitest'
import { getClassGroupId, filterClassesByCategory, getElementClassesForCategory } from './tailwind-class-categories'

// Mock DOM for Node.js testing environment
const mockElement = (className: string) => ({
  classList: className.split(' ').filter(c => c.length > 0),
  getAttribute: (name: string) => name === 'data-quiz' ? 'bg-color' : null
})

describe('tailwind class categories', () => {
  test('getClassGroupId returns correct group for various classes', () => {
    // Font family
    expect(getClassGroupId('font-sans')).toBe('font-family')
    expect(getClassGroupId('font-serif')).toBe('font-family')
    expect(getClassGroupId('font-mono')).toBe('font-family')

    // Font size
    expect(getClassGroupId('text-sm')).toBe('font-size')
    expect(getClassGroupId('text-lg')).toBe('font-size')
    expect(getClassGroupId('text-xl')).toBe('font-size')

    // Padding
    expect(getClassGroupId('p-4')).toBe('p')
    expect(getClassGroupId('px-2')).toBe('px')
    expect(getClassGroupId('py-8')).toBe('py')

    // Margin
    expect(getClassGroupId('m-4')).toBe('m')
    expect(getClassGroupId('mx-auto')).toBe('mx')
    expect(getClassGroupId('my-2')).toBe('my')

    // Background
    expect(getClassGroupId('bg-red-500')).toBe('bg-color')
    expect(getClassGroupId('bg-blue-100')).toBe('bg-color')

    // Shadow
    expect(getClassGroupId('shadow-sm')).toBe('shadow')
    expect(getClassGroupId('shadow-lg')).toBe('shadow')

    // Gap
    expect(getClassGroupId('gap-4')).toBe('gap')
    expect(getClassGroupId('gap-x-2')).toBe('gap-x')
    expect(getClassGroupId('gap-y-8')).toBe('gap-y')

    // Border
    expect(getClassGroupId('border')).toBe('border-w')
    expect(getClassGroupId('border-2')).toBe('border-w')
    expect(getClassGroupId('border-red-500')).toBe('border-color')

    // Invalid class
    expect(getClassGroupId('invalid-class')).toBe(null)
    expect(getClassGroupId('')).toBe(null)
  })

  test('filterClassesByCategory filters classes correctly', () => {
    const classes = [
      'font-sans', 'text-lg', 'p-4', 'bg-red-500', 'shadow-sm', 
      'font-serif', 'text-sm', 'mx-auto', 'border-2'
    ]

    expect(filterClassesByCategory(classes, 'font-family')).toEqual(['font-sans', 'font-serif'])
    expect(filterClassesByCategory(classes, 'font-size')).toEqual(['text-lg', 'text-sm'])
    expect(filterClassesByCategory(classes, 'p')).toEqual(['p-4'])
    expect(filterClassesByCategory(classes, 'bg-color')).toEqual(['bg-red-500'])
    expect(filterClassesByCategory(classes, 'shadow')).toEqual(['shadow-sm'])
    expect(filterClassesByCategory(classes, 'mx')).toEqual(['mx-auto'])
    expect(filterClassesByCategory(classes, 'border-w')).toEqual(['border-2'])
  })

  test('getElementClassesForCategory works with mock elements', () => {
    const element = mockElement('font-sans text-lg p-4 bg-red-500 shadow-sm mx-auto')

    expect(getElementClassesForCategory(element as any, 'font-family')).toEqual(['font-sans'])
    expect(getElementClassesForCategory(element as any, 'font-size')).toEqual(['text-lg'])
    expect(getElementClassesForCategory(element as any, 'p')).toEqual(['p-4'])
    expect(getElementClassesForCategory(element as any, 'bg-color')).toEqual(['bg-red-500'])
    expect(getElementClassesForCategory(element as any, 'shadow')).toEqual(['shadow-sm'])
    expect(getElementClassesForCategory(element as any, 'mx')).toEqual(['mx-auto'])
    
    // Test with no matching classes
    expect(getElementClassesForCategory(element as any, 'border-w')).toEqual([])
  })

  test('handles elements with multiple classes of same category', () => {
    const element = mockElement('px-4 py-2 pt-8')

    expect(getElementClassesForCategory(element as any, 'px')).toEqual(['px-4'])
    expect(getElementClassesForCategory(element as any, 'py')).toEqual(['py-2'])
    expect(getElementClassesForCategory(element as any, 'pt')).toEqual(['pt-8'])
  })

  test('handles quiz scenario with data-quiz attribute', () => {
    const element = mockElement('font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded shadow-md')
    const quizCategory = 'bg-color'
    const relevantClasses = getElementClassesForCategory(element as any, quizCategory as any)
    
    expect(relevantClasses).toEqual(['bg-blue-500'])
  })
})
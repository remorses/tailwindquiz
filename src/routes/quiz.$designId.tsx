import { useState, useEffect, useRef } from 'react'
import { data } from 'react-router'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from 'website/src/components/ui/card'
import { Button } from 'website/src/components/ui/button'
import { Progress } from 'website/src/components/ui/progress'
import { Badge } from 'website/src/components/ui/badge'
import { href } from 'react-router'
import { getElementClassesForCategory, isMetaCategory, type MetaCategoryKey } from 'website/src/lib/tailwind-class-categories'
import type { Route } from './+types/quiz.$designId'
import type { DefaultClassGroupIds } from '@xmorse/tailwind-merge'
import { LunaDomHighlighter } from '../lib/highlighter.client'



const quizDesigns = import.meta.glob('../quiz-designs/*.html', {
  query: '?raw',
  import: 'default',
})

interface QuizQuestion {
  element: string
  category: DefaultClassGroupIds | MetaCategoryKey
  correctAnswer: string
  options: string[]
  elementIndex: number
  originalCategories: string[]
}

export async function loader({ params }: Route.LoaderArgs) {
  const { designId } = params
  const designPath = `../quiz-designs/${designId}.html`

  if (!quizDesigns[designPath]) {
    throw new Response('Quiz design not found', { status: 404 })
  }

  const content = await quizDesigns[designPath]() as string

  return data({ designId, htmlContent: content })
}

// Generate placeholder options for now (will be replaced with AI generation later)
function generatePlaceholderOptions(correctAnswer: string, category: DefaultClassGroupIds | MetaCategoryKey): string[] {
  const placeholders = {
    // Individual categories
    'font-family': ['font-sans', 'font-serif', 'font-mono'],
    'font-size': ['text-sm', 'text-base', 'text-lg', 'text-xl'],
    'bg-color': ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'],
    'shadow': ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'],
    'p': ['p-2', 'p-4', 'p-6', 'p-8'],
    'px': ['px-2', 'px-4', 'px-6', 'px-8'],
    'py': ['py-2', 'py-4', 'py-6', 'py-8'],
    'gap': ['gap-2', 'gap-4', 'gap-6', 'gap-8'],
    'm': ['m-2', 'm-4', 'm-6', 'm-8'],
    'border-w': ['border', 'border-2', 'border-4', 'border-8'],
    'w': ['w-4', 'w-8', 'w-12', 'w-16'],
    'h': ['h-4', 'h-8', 'h-12', 'h-16'],

    // Meta-categories
    'sizing': ['w-4', 'h-8', 'size-12', 'max-w-md', 'min-h-screen'],
    'spacing': ['p-4', 'm-2', 'mx-auto', 'py-8', 'pl-6'],
    'positioning': ['absolute', 'relative', 'top-0', 'left-4', 'z-10'],
    'flexbox': ['flex', 'flex-col', 'justify-center', 'items-center', 'grow'],
    'grid': ['grid', 'grid-cols-3', 'gap-4', 'col-span-2', 'row-start-1'],
    'typography': ['font-bold', 'text-lg', 'text-center', 'leading-6', 'tracking-wide'],
    'background': ['bg-blue-500', 'bg-gradient-to-r', 'bg-cover', 'bg-center'],
    'border': ['border', 'border-2', 'border-gray-300', 'border-t', 'border-solid'],
    'border-radius': ['rounded', 'rounded-md', 'rounded-lg', 'rounded-full', 'rounded-t'],
    'effects': ['shadow-lg', 'opacity-50', 'blur-sm', 'brightness-110', 'contrast-125'],
    'transforms': ['scale-105', 'rotate-45', 'translate-x-2', 'skew-y-3', 'transform'],
    'layout': ['block', 'flex', 'grid', 'hidden', 'overflow-hidden']
  }

  const categoryOptions = placeholders[category as keyof typeof placeholders] || ['placeholder-1', 'placeholder-2', 'placeholder-3', 'placeholder-4']
  const otherOptions = categoryOptions.filter(opt => opt !== correctAnswer).slice(0, 3)

  return [correctAnswer, ...otherOptions].sort(() => Math.random() - 0.5)
}

export default function QuizDesign({ loaderData }: Route.ComponentProps) {
  const { designId, htmlContent } = loaderData
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Get current question index from URL params, default to 0
  const currentQuestionIndex = Math.max(0, parseInt(searchParams.get('q') || '0', 10))

  // Helper function to update question index in URL
  const updateQuestionIndex = (newIndex: number) => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (newIndex === 0) {
      newSearchParams.delete('q')
    } else {
      newSearchParams.set('q', newIndex.toString())
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [highlighterEnabled, setHighlighterEnabled] = useState(true)
  const highlighterRef = useRef<LunaDomHighlighter | null>(null)

  // Validate and clamp question index based on available questions
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      console.log(`[Quiz] Question index ${currentQuestionIndex} out of bounds, redirecting to last question`)
      updateQuestionIndex(questions.length - 1)
    }
  }, [questions.length, currentQuestionIndex])

  // Reset question state when currentQuestionIndex changes (URL navigation)
  useEffect(() => {
    setSelectedAnswer(null)
    setShowResult(false)
    setQuizComplete(false)
  }, [currentQuestionIndex])

  useEffect(() => {
    // Parse HTML and extract quiz questions
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const quizElements = doc.querySelectorAll('[data-quiz]')

    const extractedQuestions: QuizQuestion[] = []
    const skippedQuestions: Array<{element: string, category: string, reason: string}> = []
    const validElementIndices: number[] = []

    Array.from(quizElements).forEach((element, index) => {
      const dataQuizValue = element.getAttribute('data-quiz') || ''
      const categories = dataQuizValue.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0)

      if (categories.length === 0) {
        console.log(`[Quiz Skip] Skipping element ${index + 1}: no data-quiz attribute`)
        return
      }

      let hasValidQuestions = false

      categories.forEach((category) => {
        // Check if category is a meta-category or regular category
        const typedCategory = category as DefaultClassGroupIds | MetaCategoryKey
        const relevantClasses = getElementClassesForCategory(element, typedCategory)

        if (relevantClasses.length === 0) {
          // Skip this category - no relevant classes found
          const elementInfo = {
            element: element.tagName.toLowerCase(),
            category,
            reason: `No classes found for category '${category}'`
          }
          skippedQuestions.push(elementInfo)
          console.log(`[Quiz Skip] Skipping category '${category}' for element ${index + 1}:`, elementInfo)
          return
        }

        const correctAnswer = relevantClasses[0]
        hasValidQuestions = true

        extractedQuestions.push({
          element: element.outerHTML,
          category: typedCategory,
          correctAnswer,
          options: generatePlaceholderOptions(correctAnswer, typedCategory),
          elementIndex: index,
          originalCategories: categories
        })
      })

      // Track the DOM index if this element has at least one valid question
      if (hasValidQuestions) {
        validElementIndices.push(index)
      }
    })

    if (skippedQuestions.length > 0) {
      console.log(`[Quiz Info] Skipped ${skippedQuestions.length} questions out of ${quizElements.length} total elements with data-quiz attributes`)
      console.table(skippedQuestions)
    }

    if (extractedQuestions.length === 0) {
      console.error('[Quiz Error] No valid quiz questions found! All elements were skipped.')
    }

    console.log(`[Quiz Info] Created ${extractedQuestions.length} valid quiz questions`)
    console.log(`[Quiz Info] Questions by element:`, extractedQuestions.reduce((acc, q) => {
      acc[q.elementIndex] = (acc[q.elementIndex] || []).concat(q.category)
      return acc
    }, {} as Record<number, string[]>))

    setQuestions(extractedQuestions)
  }, [htmlContent])

  // Highlight current quiz element using luna-dom-highlighter
  useEffect(() => {
    if (questions.length === 0) return

    console.log(`[Quiz Debug] Attempting to highlight question ${currentQuestionIndex + 1}/${questions.length}`)

    // Hide previous highlight
    if (highlighterRef.current) {
      highlighterRef.current.hide()
    }

    // Find all quiz elements in the rendered HTML
    const allQuizElements = document.querySelectorAll('[data-quiz]')
    console.log(`[Quiz Debug] Found ${allQuizElements.length} quiz elements in rendered HTML`)

    if (allQuizElements.length === 0) {
      console.error('[Quiz Error] No quiz elements found in rendered HTML! Make sure data-quiz attributes are preserved.')
      throw new Error('No quiz elements found in rendered HTML')
    }

    // Get the DOM element index for the current question
    if (currentQuestionIndex >= questions.length) {
      console.error(`[Quiz Error] Question index ${currentQuestionIndex} is out of bounds for valid questions. Only ${questions.length} valid questions found.`)
      throw new Error(`Question index out of bounds: ${currentQuestionIndex}/${questions.length}`)
    }

    const currentQuestion = questions[currentQuestionIndex]
    const domElementIndex = currentQuestion.elementIndex
    console.log(`[Quiz Debug] Question ${currentQuestionIndex + 1} (${currentQuestion.category}) maps to DOM element ${domElementIndex + 1}`)

    // Get the current quiz element by its DOM index
    const currentElement = allQuizElements[domElementIndex]

    if (!currentElement) {
      console.error(`[Quiz Error] Could not find quiz element at DOM index ${domElementIndex}`)
      throw new Error(`Quiz element not found at DOM index ${domElementIndex}`)
    }

    console.log(`[Quiz Debug] Highlighting element:`, {
      tagName: currentElement.tagName,
      className: currentElement.className,
      dataQuiz: currentElement.getAttribute('data-quiz'),
      textContent: currentElement.textContent?.slice(0, 50) + '...'
    })

    // Create highlighter if it doesn't exist
    if (!highlighterRef.current) {
      highlighterRef.current = new LunaDomHighlighter(document.body, {showAccessibilityInfo: false,  showInfo: false, showRulers: true, theme: '' })
    }

    // Highlight current element only if highlighter is enabled
    if (highlighterEnabled) {
      highlighterRef.current.highlight(currentElement as HTMLElement, {})
    }

    // Scroll element into view
    currentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    // Cleanup on unmount
    return () => {
      console.log('[Quiz Cleanup] Cleaning up highlights on unmount')
      if (highlighterRef.current) {
        highlighterRef.current.hide()
      }
    }
  }, [currentQuestionIndex, questions, highlighterEnabled])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const handleAnswerSelect = (answer: string) => {
    // Don't allow selecting if already showing result
    if (showResult) return

    setSelectedAnswer(answer)

    // Check if answer is correct and update score
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }

    setShowResult(true)

    // Auto-advance to next question after showing result
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        updateQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        setQuizComplete(true)
      }
    }, 900)
  }

  const handleRestart = () => {
    updateQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setQuizComplete(false)
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      updateQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const toggleHighlighter = () => {
    setHighlighterEnabled(!highlighterEnabled)
    if (highlighterRef.current) {
      if (highlighterEnabled) {
        highlighterRef.current.hide()
      } else {
        // Re-highlight current element if highlighter was disabled
        const allQuizElements = document.querySelectorAll('[data-quiz]')
        const currentQuestion = questions[currentQuestionIndex]
        if (currentQuestion && allQuizElements[currentQuestion.elementIndex]) {
          highlighterRef.current.highlight(allQuizElements[currentQuestion.elementIndex] as HTMLElement, {})
        }
      }
    }
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p>Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl  font-bold mb-2">{percentage}%</div>
                <p className="text-muted-foreground">
                  You scored {score} out of {questions.length} questions correctly
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleRestart}>Try Again</Button>
                <Button variant="outline" asChild>
                  <Link to={href('/quiz')}>Back to Quiz List</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousQuestion}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}
              <h1 className="text-2xl font-bold">Quiz: {designId}</h1>
            </div>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Design Preview - Full Width */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Design Preview</h2>
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            </div>
          </div>
        </div>
        <div
        id='preview'
          className="w-full  bg-white min-h-96"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Highlighter Toggle */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHighlighter}
            className="flex items-center gap-2"
          >
            {highlighterEnabled ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                Hide Highlight
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Show Highlight
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Question Section */}
      <div className="px-4 z-50 py-8">
        <div className="max-w-4xl mx-auto">

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle>
              Which Tailwind class is used for the <strong>{currentQuestion.category}</strong> styling of the highlighted element?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrect = option === currentQuestion.correctAnswer
                const isWrong = showResult && isSelected && !isCorrect

                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    className={`justify-start text-left transition-all duration-200 ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : isWrong
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'opacity-50'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => {handleAnswerSelect(option)}}
                    disabled={showResult}
                  >
                    <code className="font-mono">{option}</code>
                  </Button>
                )
              })}
            </div>

            {showResult && (
              <div className="text-center py-4">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="space-y-2">
                    <p className="text-green-600 font-semibold text-lg">Correct! 🎉</p>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <p className="text-sm text-muted-foreground">Moving to next question...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Finishing quiz...</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-600 font-semibold text-lg">
                      Incorrect. The correct answer is <code className="bg-green-100 px-2 py-1 rounded">{currentQuestion.correctAnswer}</code>
                    </p>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <p className="text-sm text-muted-foreground">Moving to next question...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Finishing quiz...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}

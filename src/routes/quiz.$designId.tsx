import { useState, useEffect } from 'react'
import { data } from 'react-router'
import { Link, useNavigate } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from 'website/src/components/ui/card'
import { Button } from 'website/src/components/ui/button'
import { Progress } from 'website/src/components/ui/progress'
import { Badge } from 'website/src/components/ui/badge'
import { href } from 'react-router'
import { getElementClassesForCategory } from 'website/src/lib/tailwind-class-categories'
import type { Route } from './+types/quiz.$designId'
import type { DefaultClassGroupIds } from '@xmorse/tailwind-merge'

const quizDesigns = import.meta.glob('../quiz-designs/*.html', {
  query: '?raw',
  import: 'default',
})

interface QuizQuestion {
  element: string
  category: DefaultClassGroupIds
  correctAnswer: string
  options: string[]
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
function generatePlaceholderOptions(correctAnswer: string, category: DefaultClassGroupIds): string[] {
  const placeholders = {
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
  }

  const categoryOptions = placeholders[category as keyof typeof placeholders] || ['placeholder-1', 'placeholder-2', 'placeholder-3', 'placeholder-4']
  const otherOptions = categoryOptions.filter(opt => opt !== correctAnswer).slice(0, 3)

  return [correctAnswer, ...otherOptions].sort(() => Math.random() - 0.5)
}

export default function QuizDesign({ loaderData }: Route.ComponentProps) {
  const { designId, htmlContent } = loaderData
  const navigate = useNavigate()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizComplete, setQuizComplete] = useState(false)

  useEffect(() => {
    // Parse HTML and extract quiz questions
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const quizElements = doc.querySelectorAll('[data-quiz]')

    const extractedQuestions: QuizQuestion[] = Array.from(quizElements).map((element, index) => {
      const category = element.getAttribute('data-quiz') as DefaultClassGroupIds
      const relevantClasses = getElementClassesForCategory(element, category)
      const correctAnswer = relevantClasses[0] || 'unknown'

      return {
        element: element.outerHTML,
        category,
        correctAnswer,
        options: generatePlaceholderOptions(correctAnswer, category)
      }
    })

    setQuestions(extractedQuestions)
  }, [htmlContent])

  // Highlight current quiz element
  useEffect(() => {
    if (questions.length === 0) return

    console.log(`[Quiz Debug] Attempting to highlight question ${currentQuestionIndex + 1}/${questions.length}`)

    // Remove previous highlights
    const highlightedElements = document.querySelectorAll('.quiz-highlight')
    console.log(`[Quiz Debug] Removing ${highlightedElements.length} previous highlights`)
    highlightedElements.forEach(el => {
      el.classList.remove('quiz-highlight')
    })

    // Find all quiz elements in the rendered HTML
    const allQuizElements = document.querySelectorAll('[data-quiz]')
    console.log(`[Quiz Debug] Found ${allQuizElements.length} quiz elements in rendered HTML`)

    if (allQuizElements.length === 0) {
      console.error('[Quiz Error] No quiz elements found in rendered HTML! Make sure data-quiz attributes are preserved.')
      throw new Error('No quiz elements found in rendered HTML')
    }

    if (currentQuestionIndex >= allQuizElements.length) {
      console.error(`[Quiz Error] Question index ${currentQuestionIndex} is out of bounds. Only ${allQuizElements.length} quiz elements found.`)
      throw new Error(`Question index out of bounds: ${currentQuestionIndex}/${allQuizElements.length}`)
    }

    // Get the current quiz element by index (DOM order)
    const currentElement = allQuizElements[currentQuestionIndex]

    if (!currentElement) {
      console.error(`[Quiz Error] Could not find quiz element at index ${currentQuestionIndex}`)
      throw new Error(`Quiz element not found at index ${currentQuestionIndex}`)
    }

    console.log(`[Quiz Debug] Highlighting element:`, currentElement)

    // Add highlight to current element
    currentElement.classList.add('quiz-highlight')

    // Scroll element into view
    currentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    // Cleanup on unmount
    return () => {
      console.log('[Quiz Cleanup] Cleaning up highlights on unmount')
      const highlightedElements = document.querySelectorAll('.quiz-highlight')
      highlightedElements.forEach(el => {
        el.classList.remove('quiz-highlight')
      })
    }
  }, [currentQuestionIndex, questions])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }

    setShowResult(true)

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        setQuizComplete(true)
      }
    }, 1500)
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setQuizComplete(false)
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
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Quiz: {designId}</h1>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Design Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Design Preview
              <Badge>{currentQuestion.category}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>

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
                    className={`justify-start text-left ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-500 hover:bg-green-600'
                          : isWrong
                            ? 'bg-red-500 hover:bg-red-600'
                            : ''
                        : ''
                    }`}
                    onClick={() => {handleAnswerSelect(option)}}
                    disabled={showResult}
                  >
                    <code className="font-mono">{option}</code>
                  </Button>
                )
              })}
            </div>

            {selectedAnswer && !showResult && (
              <Button onClick={handleNextQuestion} className="w-full">
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            )}

            {showResult && (
              <div className="text-center py-4">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <p className="text-green-600 font-semibold">Correct! 🎉</p>
                ) : (
                  <p className="text-red-600 font-semibold">
                    Incorrect. The correct answer is <code>{currentQuestion.correctAnswer}</code>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { data } from 'react-router'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'website/src/components/ui/card'
import { Button } from 'website/src/components/ui/button'
import { Badge } from 'website/src/components/ui/badge'
import { href } from 'react-router'
import type { Route } from './+types/quiz.results'

interface QuizResult {
  designId: string
  score: number
  totalQuestions: number
  completedAt: string
}

export async function loader({ request }: Route.LoaderArgs) {
  // In a real app, this would come from a database or localStorage
  // For now, we'll return mock data
  const results: QuizResult[] = [
    {
      designId: 'button-card',
      score: 8,
      totalQuestions: 10,
      completedAt: new Date().toISOString()
    },
    {
      designId: 'landing-page',
      score: 12,
      totalQuestions: 15,
      completedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
  
  return data({ results })
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getScoreBadgeVariant(percentage: number): "default" | "secondary" | "destructive" | "outline" {
  if (percentage >= 80) return 'default'
  if (percentage >= 60) return 'secondary'
  return 'destructive'
}

export default function QuizResults({ loaderData }: Route.ComponentProps) {
  const { results } = loaderData
  
  const totalQuizzes = results.length
  const averageScore = results.length > 0 
    ? results.reduce((sum, result) => sum + (result.score / result.totalQuestions), 0) / results.length * 100
    : 0
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Quiz Results</h1>
          <p className="text-muted-foreground text-lg">
            Track your progress and see how you're improving
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.length > 0 
                  ? Math.round(Math.max(...results.map(r => (r.score / r.totalQuestions) * 100)))
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Results List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Results</h2>
          
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No quiz results yet. Take your first quiz to see your progress!
                </p>
                <Button asChild>
                  <Link to={href('/')}>Start Quiz</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => {
                const percentage = Math.round((result.score / result.totalQuestions) * 100)
                const completedDate = new Date(result.completedAt).toLocaleDateString()
                
                return (
                  <Card key={`${result.designId}-${index}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="capitalize">
                            {result.designId.replace('-', ' ')}
                          </CardTitle>
                          <CardDescription>
                            Completed on {completedDate}
                          </CardDescription>
                        </div>
                        <Badge variant={getScoreBadgeVariant(percentage)}>
                          {percentage}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {result.score} / {result.totalQuestions} questions correct
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={href('/quiz/:designId', { designId: result.designId })}>
                            Retake Quiz
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild>
            <Link to={href('/')}>Take Another Quiz</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={href('/')}>Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
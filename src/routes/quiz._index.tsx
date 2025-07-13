import { data } from 'react-router'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'website/src/components/ui/card'
import { Button } from 'website/src/components/ui/button'
import { Badge } from 'website/src/components/ui/badge'
import { href } from 'react-router'
import type { Route } from './+types/quiz._index'

// Get all quiz designs using Vite glob
const quizDesigns = import.meta.glob('../quiz-designs/*.html', {
  query: '?raw',
  import: 'default',
})

export async function loader() {
  const designs: Array<{ id: string; name: string; description: string }> = []
  
  for (const [path, moduleLoader] of Object.entries(quizDesigns)) {
    const designId = path.replace('../quiz-designs/', '').replace('.html', '')
    const content = await moduleLoader() as string
    
    // Extract title from HTML or use filename
    const titleMatch = content.match(/<title>(.*?)<\/title>/)
    const title = titleMatch ? titleMatch[1] : designId.replace('-', ' ')
    
    // Count quiz elements
    const quizElements = (content.match(/data-quiz="/g) || []).length
    
    designs.push({
      id: designId,
      name: title,
      description: `${quizElements} questions`
    })
  }
  
  return data({ designs })
}

export default function QuizIndex({ loaderData }: Route.ComponentProps) {
  const { designs } = loaderData
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Tailwind CSS Quiz</h1>
          <p className="text-muted-foreground text-lg">
            Test your knowledge of Tailwind CSS classes and utilities
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => {
            return (
              <Card key={design.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {design.name}
                    <Badge variant="secondary">{design.description}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Test your knowledge of Tailwind classes in this design
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={href('/quiz/:designId', { designId: design.id })}>
                      Start Quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {designs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No quiz designs found. Add HTML files to src/quiz-designs/ to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
import { Link } from 'react-router'
import { Button } from 'website/src/components/ui/button'
import { href } from 'react-router'
import type { Route } from "./+types/_index";

export function loader() {
  return {};
}

export default function Index() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      <div className="text-center space-y-8 px-8">
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
            Tailwind Quiz
          </h1>
          <div className="absolute -top-2 -left-2 text-6xl md:text-8xl font-bold text-purple-300 opacity-30 -z-10">
            Tailwind Quiz
          </div>
        </div>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
          Test your knowledge of Tailwind CSS classes with interactive design challenges
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild className="bg-white text-purple-600 hover:bg-white/90">
            <Link to={href('/quiz')}>Start Quiz</Link>
          </Button>
          
          <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-purple-600">
            <Link to={href('/quiz/results')}>View Results</Link>
          </Button>
        </div>
        
        <div className="flex justify-center space-x-4 mt-8">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-75"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </div>
  );
}

<div align='center'>
    <br/>
    <br/>
    <h3>Tailwind Quiz</h3>
    <p>Learn to recognize Tailwind CSS classes by looking at real designs</p>
    <a href="https://tailwindquiz.com">tailwindquiz.com</a>
    <br/>
    <br/>
</div>

## What is this?

Tailwind Quiz shows you HTML designs and highlights specific elements. Your task is to identify the correct Tailwind classes being used for typography, spacing, colors, and more.

## Why?

- **Visual Learning**: Connect visual design patterns with their Tailwind classes
- **Build Intuition**: Develop a mental model of Tailwind's sizing, spacing, and color systems
- **Better AI Prompting**: Learn precise class names to guide LLMs when building UIs
- **Real-World Practice**: Study production-ready components from Tailwind UI

## Features

- Interactive highlighting with box model visualization
- Support for meta-categories (e.g., "spacing" covers all padding/margin classes)
- Toggle highlighting to analyze elements without distraction
- URL-based navigation for sharing specific questions
- Progress tracking across quiz sessions

## Running Locally

```bash
pnpm install
pnpm dev
```

## Tech Stack

- React Router v7
- Tailwind CSS (via CDN)
- TypeScript
- luna-dom-highlighter
- shadcn/ui components
import { Figure, MiniFan } from './Figures'
import type { ExamplePart } from './ruleExamples'

function Part({ part }: { part: ExamplePart }) {
  if (part.kind === 'cards') return <MiniFan cards={part.cards} />
  if (part.kind === 'figure') return <Figure id={part.figure} />
  if (part.kind === 'text') {
    return <span className="font-pixel text-lg leading-none whitespace-nowrap">{part.text}</span>
  }
  return (
    <span className="flex shrink-0">
      {Array.from({ length: part.count }, (_, index) => (
        <span key={index} className={`block h-8 w-5.5 back-pattern ${index > 0 ? '-ml-3' : ''}`} />
      ))}
    </span>
  )
}

export function RuleExample({ parts }: { parts: ExamplePart[] }) {
  return (
    <span aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
      {parts.map((part, index) => (
        <Part key={index} part={part} />
      ))}
    </span>
  )
}

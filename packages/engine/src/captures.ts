import { TARGET_SUM, cardValue } from './cards'
import type { Card } from './cards'

export function captureOptions(card: Card, table: Card[]): Card[][] {
  const needed = TARGET_SUM - cardValue(card)
  const options: Card[][] = []
  const walk = (start: number, remaining: number, picked: Card[]) => {
    if (remaining === 0 && picked.length > 0) {
      options.push(picked)
      return
    }
    for (let index = start; index < table.length; index++) {
      const value = cardValue(table[index])
      if (value <= remaining) walk(index + 1, remaining - value, [...picked, table[index]])
    }
  }
  walk(0, needed, [])
  return options
}

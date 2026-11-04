import type { Card } from '@escoba/engine'
import type { RuleId } from '../i18n/rules'
import type { FigureId } from './Figures'

export type ExamplePart =
  | { kind: 'cards'; cards: Card[] }
  | { kind: 'backs'; count: number }
  | { kind: 'text'; text: string }
  | { kind: 'figure'; figure: FigureId }

const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })
const cards = (...items: Card[]): ExamplePart => ({ kind: 'cards', cards: items })
const text = (value: string): ExamplePart => ({ kind: 'text', text: value })
const figure = (id: FigureId): ExamplePart => ({ kind: 'figure', figure: id })
const backs = (count: number): ExamplePart => ({ kind: 'backs', count })

const SEVEN = card(7, 'oros')
const FIVE = card(5, 'oros')
const SOTA = card(10, 'espadas')
const REY = card(12, 'espadas')

export const RULE_EXAMPLES: Record<RuleId, ExamplePart[]> = {
  deck: [figure('suits'), text('× 10')],
  deal: [backs(3), text('+'), cards(card(2, 'copas'), card(6, 'oros'), card(4, 'bastos'), REY)],
  values: [figure('faces'), text('= 8 · 9 · 10')],
  target: [figure('broom'), figure('coin'), text('→ 15')],
  capture: [cards(SEVEN), text('+'), cards(card(5, 'copas'), card(3, 'bastos')), text('= 15')],
  choose: [cards(SEVEN), text('→'), cards(SOTA), text('/'), cards(card(5, 'copas'), card(3, 'bastos'))],
  drop: [cards(card(4, 'bastos')), text('→'), cards(card(2, 'copas'), card(6, 'oros'), card(4, 'bastos'))],
  escoba: [cards(FIVE), text('+'), cards(REY), text('='), figure('broom')],
  soplada: [cards(FIVE), text('+'), cards(REY), text('= 15 →'), backs(2)],
  sopladaNoEscoba: [cards(FIVE, REY), text('≠'), figure('broom')],
  leftover: [cards(card(2, 'copas'), card(6, 'oros')), text('→'), backs(3)],
  escobas: [figure('broom'), text('= 1')],
  cards: [figure('stack'), figure('coin'), figure('velo'), text('= 1 · 1 · 1')],
  primera: [cards(SEVEN, card(6, 'copas'), card(1, 'espadas'), card(5, 'bastos')), text('= 1')],
  primeraReal: [figure('primera'), text('= 2')],
  realHand: [figure('realHand'), text('= 15 → 3')],
  realTable: [figure('realTable'), text('= 15 → 4')],
  realOptional: [figure('realHand'), text('?')],
  ties: [figure('stack'), text('='), figure('stack'), text('→ 0')],
}

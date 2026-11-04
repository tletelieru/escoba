import { useState } from 'react'
import type { Level } from '@escoba/bots'
import {
  HAND_SIZE,
  MATCH_POINTS,
  TABLE_SIZE,
  canCallRealHand,
  canClaimRealTable,
  matchWinners,
  realTableActions,
  sameAction,
  sameCard,
  score,
  scoreRound,
  sideOf,
  sopladaActions,
  tallyPiles,
} from '@escoba/engine'
import type { Action, Card, MatchState, PlayerCount, Seat } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import { cardKey, seatPosition } from '../lib/cards'
import type { SeatPosition } from '../lib/cards'
import { landAt, tableAt } from '../lib/dealTiming'
import { saveRecord } from '../lib/history'
import { CAPTURE_RULES } from '../lib/captureRules'
import { isCapture, playsFor, sumLine } from '../lib/plays'
import { clearSavedMatch } from '../lib/savedMatch'
import { useDealerDraw } from '../useDealerDraw'
import { HUMAN, lastMove, shownMove, useMatch } from '../useMatch'
import { ActionBar } from './ActionBar'
import { BotHand } from './BotHand'
import { CapturesPanel } from './CapturesPanel'
import { DealAnimation } from './DealAnimation'
import { Hand } from './Hand'
import { seatName, sideNames } from './names'
import { Overlay } from './Overlay'
import { PlayerBadge } from './PlayerBadge'
import { ResultEffect } from './ResultEffect'
import { RoundSummary } from './RoundSummary'
import { ScoreTable } from './ScoreTable'
import { TableArea } from './TableArea'

interface Props {
  players: PlayerCount
  seed: number
  level: Level
  restored: MatchState | null
  showInfo: boolean
  onExit: () => void
}

const HUMAN_SIDE = 0

function tableDelays(players: number): number[] {
  return Array.from({ length: TABLE_SIZE }, (_, card) => tableAt(players, card))
}

function drawLine(t: Messages, stopped: boolean, dealer: string): string {
  return stopped ? t.dealerIs(dealer) : t.drawing
}

function hasPlays(state: MatchState): boolean {
  if (state.results.length > 0) return true
  return state.round.moves.some((move) => move.type !== 'deal')
}

function saveAbandoned(state: MatchState, seed: number, level: Level): void {
  if (state.status === 'matchOver' || !hasPlays(state)) return
  const rounds = state.status === 'playing' ? [...state.results, scoreRound(state)] : state.results
  saveRecord({
    id: seed,
    finishedAt: Date.now(),
    players: state.players,
    level,
    rounds,
    totals: score({ ...state, results: rounds }).totals,
    winners: [],
    abandoned: true,
  })
}

interface StatusInput {
  t: Messages
  notice: string | null
  draw: string | null
  showInfo: boolean
  humanTurn: boolean
  picked: Card | null
}

function statusLine({ t, notice, draw, showInfo, humanTurn, picked }: StatusInput): string {
  if (draw) return draw
  if (notice) return notice
  if (!showInfo) return ''
  if (!humanTurn) return ''
  if (!picked) return t.yourTurn
  return t.pickHint
}

function toggleCard(cards: Card[], card: Card): Card[] {
  if (cards.some((item) => sameCard(item, card))) return cards.filter((item) => !sameCard(item, card))
  return [...cards, card]
}

function sumText(cards: Card[], blowing: boolean): string {
  const minimum = blowing ? 1 : 2
  if (cards.length < minimum) return ''
  return sumLine(cards)
}

export function Table({ players, seed, level, restored, showInfo, onExit }: Props) {
  const t = useMessages()
  const match = useMatch(players, seed, level, restored)
  const { state, holding, dealing, drawing, finishDraw, sopladaOpen, legal, act, next } = match
  const [selected, setSelected] = useState<Card | null>(null)
  const [chosen, setChosen] = useState<Card[]>([])
  const [flash, setFlash] = useState<{ id: number; cards: Card[] } | null>(null)
  const [warned, setWarned] = useState<string | null>(null)
  const [sopladaLost, setSopladaLost] = useState<string | null>(null)
  const [capturesOpen, setCapturesOpen] = useState(false)
  const [notice, setNotice] = useState<{ key: string; text: string } | null>(null)
  const [scoresOpen, setScoresOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const { round } = state
  const draw = useDealerDraw({ active: drawing, players, dealer: state.dealer, onDone: finishDraw })
  const stateKey = `${state.roundIndex}:${round.moves.length}`
  const hand = round.hands[HUMAN]
  const humanTurn = !drawing && !holding && state.status === 'playing' && round.turn === HUMAN
  const dealerWindow = !drawing && canClaimRealTable(state, HUMAN)
  const canCallReal = humanTurn && canCallRealHand(state, HUMAN)
  const picked = humanTurn && selected && hand.some((card) => sameCard(card, selected)) ? selected : null
  const rules = CAPTURE_RULES[level]
  const canBlow = sopladaOpen && sopladaLost !== stateKey
  const onTable = (card: Card) => round.table.some((item) => sameCard(item, card))
  const chosenNow = humanTurn || canBlow ? chosen.filter(onTable) : []
  const playable = humanTurn && legal.some((action) => action.type === 'play')
  const mySide = sideOf(HUMAN, players)
  const myCaptures = round.moves
    .filter(isCapture)
    .filter((move) => sideOf(move.seat, players) === mySide)
  const myTally = tallyPiles(round.piles, players)[mySide]
  const names = Array.from({ length: players }, (_, seat) => seatName(t, seat, players))
  const sides = sideNames(t, players)
  const { totals } = score(state)
  const shown = holding && !drawing ? shownMove(state) : undefined
  const latest = lastMove(state)
  const dropFrom = latest?.type === 'play' && latest.captured.length === 0 ? latest.seat : null
  const ended = state.status !== 'playing' && !holding
  const matchEnded = state.status === 'matchOver' && !holding
  const winners = matchWinners(state)
  const humanWon = winners.length === 1 && winners[0] === HUMAN_SIDE
  const currentNotice = notice?.key === stateKey ? notice.text : null
  const sumCards = picked ? [picked, ...chosenNow] : chosenNow
  const drawText = drawing ? drawLine(t, draw.stopped, names[state.dealer]) : null
  const status = statusLine({
    t,
    notice: currentNotice,
    draw: drawText,
    showInfo,
    humanTurn,
    picked,
  })

  const play = (action: Action) => {
    setSelected(null)
    setChosen([])
    act(action)
  }

  const say = (text: string) => setNotice({ key: stateKey, text })

  const select = (card: Card | null) => {
    setSelected(card)
    setFlash(null)
  }

  const toggleTable = (card: Card) => {
    if (!humanTurn && !canBlow) return
    setFlash(null)
    setChosen(toggleCard(chosenNow, card))
  }

  const wrong = (cards: Card[]) => setFlash({ id: Date.now(), cards })

  const drop = (card: Card) => play({ type: 'play', seat: HUMAN, card, capture: [] })

  const playTurn = () => {
    if (!picked) return
    if (chosenNow.length === 0) {
      const warnKey = `${stateKey}:${cardKey(picked)}`
      const missed = playsFor(legal, picked).some((action) => action.capture.length > 0)
      if (missed && rules.warnMissed && warned !== warnKey) {
        setWarned(warnKey)
        return say(t.missedFifteen)
      }
      return drop(picked)
    }
    const action: Action = { type: 'play', seat: HUMAN, card: picked, capture: chosenNow }
    if (legal.some((item) => sameAction(item, action))) return play(action)
    wrong(chosenNow)
    if (rules.wrongMessage) say(t.notFifteen)
    if (rules.wrongDrops) drop(picked)
  }

  const soplar = () => {
    const action: Action = { type: 'soplar', seat: HUMAN, cards: chosenNow }
    if (sopladaActions(state, HUMAN).some((item) => sameAction(item, action))) return play(action)
    wrong(chosenNow)
    if (rules.sopladaRetry) return say(t.notFifteen)
    setChosen([])
    setSopladaLost(stateKey)
  }

  const callReal = () => {
    const handReal = canCallReal ? legal.find((action) => action.type === 'realHand') : undefined
    if (handReal) return play(handReal)
    const tableReal = dealerWindow ? realTableActions(state, HUMAN)[0] : undefined
    if (tableReal) return act(tableReal)
    say(canCallReal ? t.notReal : t.tableNotReal)
  }

  const seatAt = (position: SeatPosition) =>
    Array.from({ length: players }, (_, seat) => seat).find(
      (seat) => seatPosition(seat, players) === position,
    )

  const active = (seat: Seat) =>
    !drawing && state.status === 'playing' && !holding && round.turn === seat

  const badge = (seat: Seat) => (
    <PlayerBadge
      name={names[seat]}
      cards={drawing ? 0 : round.hands[seat].length}
      pile={round.piles[seat]}
      dealer={!drawing && state.dealer === seat}
      active={active(seat)}
      spotlight={draw.spot === seat}
    />
  )

  const line = (seat: Seat | undefined, vertical: boolean) => {
    if (seat === undefined) return vertical ? <div className="w-8 shrink-0" /> : null
    return (
      <BotHand
        key={`${state.roundIndex}-${round.deal}-${seat}`}
        cards={drawing ? 0 : round.hands[seat].length}
        active={active(seat)}
        vertical={vertical}
        delays={dealing ? landDelays(seat) : undefined}
      />
    )
  }

  const landDelays = (seat: Seat) =>
    Array.from({ length: HAND_SIZE }, (_, card) => landAt(seat, state.dealer, players, card))

  const opponents = (['left', 'top', 'right'] as const).flatMap((position) => {
    const seat = seatAt(position)
    return seat === undefined ? [] : [seat]
  })

  return (
    <main
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest('button, [role="dialog"]')) select(null)
      }}
      className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-x-clip overflow-y-auto overscroll-contain"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScoresOpen(true)}
          className="min-w-0 flex-1 pixel-box bg-surface px-3 py-1.5 text-left"
        >
          <span className="font-pixel text-xl leading-none">
            {t.round(state.roundIndex + 1)} · {t.toTarget(MATCH_POINTS)}
          </span>
          <span className="block truncate text-xs text-muted">
            {sides.map((name, side) => `${name} ${totals[side]}`).join(' · ')}
          </span>
        </button>
        {[
          { label: t.scoreTitle, onClick: () => setScoresOpen(true) },
          { label: t.exit, onClick: () => setExitOpen(true) },
        ].map(({ label, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="pixel-button bg-raised px-3 py-1 text-ink"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`flex gap-1 ${opponents.length === 1 ? 'justify-center' : 'justify-between'}`}>
        {opponents.map((seat) => (
          <div key={seat}>{badge(seat)}</div>
        ))}
      </div>

      {line(seatAt('top'), false)}

      <div className="flex flex-1 items-start gap-2">
        {line(seatAt('left'), true)}
        <div className="min-w-0 flex-1">
          <TableArea
            table={drawing ? [] : round.table}
            hidden={drawing}
            dealDelays={dealing && round.deal === 1 ? tableDelays(players) : undefined}
            players={players}
            deckCount={round.deck.length}
            lastDeal={dealing && round.deal > 1 && round.deck.length === 0}
            shown={shown}
            names={names}
            chosen={chosenNow}
            selectable={humanTurn || canBlow}
            flash={flash}
            dropFrom={dropFrom}
            onToggle={toggleTable}
          />
        </div>
        {line(seatAt('right'), true)}
      </div>

      <Hand
        header={
          <>
            {badge(HUMAN)}
            <button
              type="button"
              onClick={() => setCapturesOpen(true)}
              className="flex items-center pixel-box bg-raised px-3 text-xs font-medium"
            >
              {t.myCards(myTally.cards)}
            </button>
          </>
        }
        bar={
          <ActionBar
            status={status}
            sum={sumText(sumCards, canBlow)}
            noticeKey={currentNotice ? `${stateKey}:${currentNotice}:${flash?.id ?? 0}` : null}
            canReal={dealerWindow || canCallReal}
            canSoplar={canBlow && chosenNow.length > 0}
            onReal={callReal}
            onSoplar={soplar}
            showInfo={showInfo}
          />
        }
        hand={drawing ? [] : hand}
        playable={playable}
        selected={picked}
        dealing={dealing}
        landDelays={landDelays(HUMAN)}
        onSelect={select}
        onPlay={playTurn}
      />

      {capturesOpen && (
        <Overlay
          title={t.myCards(myTally.cards)}
          translucent
          onClose={() => setCapturesOpen(false)}
        >
          <CapturesPanel
            captures={myCaptures}
            names={names}
            showWho={players === 4}
            tally={myTally}
          />
          <button
            type="button"
            onClick={() => setCapturesOpen(false)}
            className="pixel-box bg-raised py-2 font-medium"
          >
            {t.close}
          </button>
        </Overlay>
      )}

      {dealing && <DealAnimation key={round.deal} players={players} dealer={state.dealer} />}

      {exitOpen && (
        <Overlay title={t.exitTitle} onClose={() => setExitOpen(false)}>
          <p className="font-pixel text-xl leading-tight text-muted">{t.exitBody}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExitOpen(false)}
              className="pixel-button bg-raised py-2.5 text-ink"
            >
              {t.keepPlaying}
            </button>
            <button
              type="button"
              onClick={() => {
                saveAbandoned(state, seed, level)
                clearSavedMatch()
                onExit()
              }}
              className="pixel-button bg-rose-700 py-2.5 text-white"
            >
              {t.exitConfirm}
            </button>
          </div>
        </Overlay>
      )}

      {scoresOpen && (
        <Overlay title={t.scoreTitle} onClose={() => setScoresOpen(false)}>
          <ScoreTable
            names={sides}
            rounds={state.results}
            live={state.status === 'playing' ? scoreRound(state) : undefined}
          />
          {state.status === 'playing' && <p className="text-xs text-muted">{t.liveScore}</p>}
          <button
            type="button"
            onClick={() => setScoresOpen(false)}
            className="pixel-box bg-raised py-2 font-medium"
          >
            {t.close}
          </button>
        </Overlay>
      )}

      {ended && state.status === 'roundOver' && (
        <Overlay title={t.roundFinished(state.roundIndex + 1)}>
          <RoundSummary
            names={sides}
            players={players}
            piles={round.piles}
            result={state.results[state.results.length - 1]}
          />
          <ScoreTable names={sides} rounds={state.results} />
          <button
            type="button"
            onClick={next}
            className="w-full pixel-box bg-accent py-2 font-medium text-on-accent"
          >
            {t.nextRound}
          </button>
        </Overlay>
      )}

      {matchEnded && <ResultEffect won={humanWon} />}

      {ended && state.status === 'matchOver' && (
        <Overlay title={t.matchFinished}>
          <p
            className={`text-center font-pixel text-3xl leading-none text-gold ${
              humanWon ? 'result-win' : 'result-lose'
            }`}
          >
            {humanWon
              ? t.youWon(totals[HUMAN_SIDE], players === 4)
              : t.winner(sides[winners[0]], totals[winners[0]])}
          </p>
          <RoundSummary
            names={sides}
            players={players}
            piles={round.piles}
            result={state.results[state.results.length - 1]}
          />
          <ScoreTable names={sides} rounds={state.results} />
          <button
            type="button"
            onClick={onExit}
            className="pixel-box bg-accent py-2 font-medium text-on-accent"
          >
            {t.backHome}
          </button>
        </Overlay>
      )}
    </main>
  )
}

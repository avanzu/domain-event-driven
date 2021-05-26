import { HandlerMap, State, Event, EventStream, Handler, SyncResult } from './types'
/* prettier-ignore */
const reducer = (pattern: HandlerMap<Event, State>) => (state: State, { type, data, meta }: Event): State =>
    pattern[type] ? pattern[type](state, {type, data, meta}) : state

export const eventOf = (type: string, data: object, meta?: object): Event => ({ type, data, meta })

export const matchEventsWith = (pattern: HandlerMap<Event, State>) => (state: State, eventStream: EventStream) =>
    eventStream.reduce(reducer(pattern), state)

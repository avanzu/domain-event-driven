import { Identity, State, Event, EventStream, Entity, Command, HandlerMap, Reducer, Runner, Result } from './types'
import { matchCommandWith } from './commandHandler'
import { matchEventsWith } from './eventHandler'
import { tap, assign } from './utils'

const createEntity =
    (apply: Reducer<EventStream>, run: Runner<Command>) =>
    (id: Identity, state: State, stream: EventStream = []): Entity => {
        const entity = {
            id,
            state: apply(state, stream),
            events: [],
            execute: (command: Command) =>
                run(entity.state, command)
                    .then(tap((events: EventStream) => (entity.events = entity.events.concat(events))))
                    .then((events: EventStream) => apply(entity.state, events))
                    .then((state: State) => assign(entity, { state }))
                    .then((state) => state),
        }

        return entity
    }

export const entityOf = (events: HandlerMap<Event, State>, commands: HandlerMap<Command, Result>) =>
    createEntity(matchEventsWith(events), matchCommandWith(commands))

import {
    StoreOptions,
    DomainEvents as Events,
    Identity,
    Entity,
    EntityStore,
    Meta,
    Command,
    DomainError,
} from './types'
import { EventEmitter } from 'events'
import { tap, either } from './utils'

export const createEntityStore = ({ app, crud, init, entityOf, entityType }: StoreOptions): EntityStore => {
    const store = new EventEmitter()

    const emitCreated = ([id, state, events]) => store.emit(Events.EntityCreated, { entityType, id, state })
    const emitModified = ([id, state, events]) => store.emit(Events.EntityModified, { entityType, id, state })
    const emitRemoved = ([id, state, events]) => store.emit(Events.EntityRemoved, { entityType, id, state })
    const emitEvents = ([id, state, events]) =>
        events.map(({ type, data }) => store.emit(Events.DomainEvent, { entityType, type, id, data }))

    const handleError =
        ({ id }: Entity) =>
        (error: DomainError) =>
            new Promise<Entity>((resolve, reject) => {
                store.emit(Events.DomainError, { entityType, id, event: error.event, data: error.data })
                reject(error)
            })

    const load = (id: Identity, meta?: Meta) =>
        crud.load(id, { app, ...meta }).then(([id, state, events]) => entityOf(id, state, events))

    const create = ({ id, events, state }: Entity, meta?: Meta) =>
        crud
            .identify(entityType, { app, ...meta })
            .then((id) => crud.create(id, state, events, { app, ...meta }))
            .then(tap(emitCreated))
            .then(tap(emitEvents))
            .then(([id, state]) => entityOf(id, state))

    const remove = ({ id, events, state }: Partial<Entity>, meta?: Meta) =>
        crud
            .remove(id, state, events, { app, ...meta })
            .then(tap(emitRemoved))
            .then(([id]) => id as Identity)

    const update = ({ id, events, state }: Entity, meta?: Meta) =>
        crud
            .update(id, state, events, { app, ...meta })
            .then(tap(emitModified))
            .then(tap(emitEvents))
            .then(([id, state]) => entityOf(id, state))

    const make = () => entityOf(null, init())
    const coerce = (id: Identity, state: object) => entityOf(id, { ...init(), ...state })
    const isNew = (entity: Entity) => (entity.id ? false : true)

    const save = either(isNew, create, update)

    const execute = (entity: Entity, command: Command) => entity.execute(command).catch(handleError(entity))

    return Object.assign(store, { make, coerce, load, save, remove, execute })
}

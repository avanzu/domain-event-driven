import { StoreOptions, DomainEvents as Events, Identity, Payload, Meta, Entity, EntityStore, CRUDResult } from './types'
import { EventEmitter } from 'events'
import { tap, either } from './utils'

export const createEntityStore = ({ app, crud, init, entityOf }: StoreOptions): EntityStore => {
    const store = new EventEmitter()

    const emitCreated = ([id, state, events]) => store.emit(Events.EntityCreated, id, state)
    const emitModified = ([id, state, events]) => store.emit(Events.EntityModified, id, state)
    const emitRemoved = ([id, state, events]) => store.emit(Events.EntityRemoved, id, state)
    const emitEvents = ([id, state, events]) =>
        events.map(({ name, data }) => store.emit(Events.DomainEvent, { name, id, data }))

    const commandOf = (name: string, data: Payload, meta: Meta = {}) => ({ name, data, meta: { ...meta, app } })

    const load = (id: Identity) => crud.load(id).then(([id, state, events]) => entityOf(id, state, events))

    const create = ({ id, events, state }: Entity) =>
        crud
            .identify()
            .then((id) => crud.create(id, state, events))
            .then(tap(emitCreated))
            .then(tap(emitEvents))
            .then(([id, state]) => entityOf(id, state))

    const remove = ({ id, events, state }: Partial<Entity>) =>
        crud
            .remove(id, state, events)
            .then(tap(emitRemoved))
            .then(([id]) => id as Identity)

    const update = ({ id, events, state }: Entity) =>
        crud
            .update(id, state, events)
            .then(tap(emitModified))
            .then(tap(emitEvents))
            .then(([id, state]) => entityOf(id, state))

    const make = () => entityOf(null, init())
    const isNew = (entity: Entity) => (entity.id ? false : true)

    const save = either(isNew, create, update)

    return Object.assign(store, { make, load, save, remove })
}

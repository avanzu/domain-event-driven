import { EventEmitter } from 'events'
export type State = any
export type Payload = object
export type Params = { [index: string]: any }
export type Application = { get?: (name: string) => any }
export type Meta = { app?: Application; params?: Params; [index: string]: any }
export type Identity = string | number
export type Event = { type: string; data: Payload; meta?: Meta }
export type Command = { type: string; data: Payload; meta?: Meta }
export type DomainError = Error & { type: string }
export type AsyncResult = Promise<Event | Event[] | DomainError>
export type SyncResult = Event | Event[]
export type Result = AsyncResult | SyncResult
export type EventStream = Event[]
export type CommandHandler = (state: State, data: Payload, meta?: Meta) => Result
export type EventHandler = (state: State, data: Payload, meta?: Meta) => State
export type Handler<U, T> = (state: State, payload: U) => T
export type HandlerMap<U, T> = { [index: string]: Handler<U, T> }
export type StreamReducer = (state: State, events: EventStream) => State
export type CommandRunner = (state: State, command: Command) => Result
export type Reducer<T> = (state: State, stream: T) => State
export type Runner<T> = (state: State, command: T) => AsyncResult
export type Initializer = () => State
export type EntityFactory = (id: Identity, state: State, stream?: EventStream) => Entity
export type Predicate = (x: any) => boolean
export type Callback<T> = (x: any) => T
export type CommandFactory = (...args: any[]) => Command

export type Entity = {
    id: Identity
    state: State
    events: EventStream
    execute: (command: Command) => Promise<Entity>
}

export type CRUDResult = Promise<[Identity, State, EventStream]>
export type CRUD = {
    identify: () => Promise<Identity>
    load: (id: Identity) => CRUDResult
    create: (id: Identity, state: State, stream: EventStream) => CRUDResult
    update: (id: Identity, state: State, stream: EventStream) => CRUDResult
    remove: (id: Identity, state: State, stream: EventStream) => CRUDResult
}

export type DomainEvent = {
    type: string
    id: Identity
    data: Payload
    meta?: Meta
}

export enum DomainEvents {
    EntityCreated = 'EntityCreated',
    EntityModified = 'EntityModified',
    EntityRemoved = 'EntityRemoved',
    DomainEvent = 'DomainEvent',
}

export type StoreOptions = {
    app?: Application
    crud: CRUD
    init: Initializer
    entityOf: EntityFactory
}

export interface EntityStore extends EventEmitter {
    make: () => Entity
    load: (id: Identity) => Promise<Entity>
    save: (item: Entity) => Promise<Entity>
    remove: (item: Partial<Entity>) => Promise<Identity>
}

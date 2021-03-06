import { EventEmitter } from 'events'
export type EntityType = string
export type State = any
export type Payload = object
export type Params = { [index: string]: any }
export type Application = { get?: (name: string) => any }
export type Meta = { app?: Application; params?: Params; [index: string]: any }
export type Identity = string | number
export type Event = { type: string; data: Payload; meta?: Meta }
export type Command = { type: string; data: Payload; meta?: Meta }
export type DomainError = Error & { type: string; event: string; data?: Payload; meta?: Meta }
export type AsyncResult = Promise<Event | Event[] | DomainError>
export type SyncResult = Event | Event[]
export type Result = AsyncResult | SyncResult
export type EventStream = Event[]
export type ErrorStream = DomainError[]
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
export type Predicate = (x: any, ...args: any[]) => boolean
export type Callback<T> = (x: any, ...args: any[]) => T
export type CommandFactory = (...args: any[]) => Command

export type Entity = {
    id: Identity
    state: State
    events: EventStream
    execute: (command: Command) => Promise<Entity>
}

export type CRUDResult = Promise<[Identity, State, EventStream]>
export type CRUD = {
    identify: (type: EntityType, meta?: Meta) => Promise<Identity>
    load: (id: Identity, meta?: Meta) => CRUDResult
    create: (id: Identity, state: State, stream: EventStream, meta?: Meta) => CRUDResult
    update: (id: Identity, state: State, stream: EventStream, meta?: Meta) => CRUDResult
    remove: (id: Identity, state: State, stream: EventStream, meta?: Meta) => CRUDResult
}

export type DomainEvent = {
    type: string
    id: Identity
    data: Payload
    entityType?: EntityType
    meta?: Meta
}

export enum DomainEvents {
    EntityCreated = 'EntityCreated',
    EntityModified = 'EntityModified',
    EntityRemoved = 'EntityRemoved',
    DomainEvent = 'DomainEvent',
    DomainError = 'DomainError',
}

export type StoreOptions = {
    app?: Application
    crud: CRUD
    init: Initializer
    entityOf: EntityFactory
    entityType?: EntityType
}

export interface EntityStore extends EventEmitter {
    make: () => Entity
    coerce: (id: Identity, state: object) => Entity
    load: (id: Identity, meta?: Meta) => Promise<Entity>
    save: (item: Entity, meta?: Meta) => Promise<Entity>
    remove: (item: Partial<Entity>, meta?: Meta) => Promise<Identity>
    execute: (item: Entity, command: Command) => Promise<Entity>
}

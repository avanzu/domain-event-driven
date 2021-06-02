import { eventOf } from '../eventHandler'
import { commandOf, commandError } from '../commandHandler'
import { Handler, HandlerMap, Meta, Result } from '../types'
import { entityOf } from '../entity'
import { resolveWith, rejectWith } from '../utils'

type Dummy = { name: string; tested: boolean; quantity: number }

enum Events {
    DummyCreated = 'DummyCreated',
    DummyChanged = 'DummyChanged',
    DummyRenamed = 'DummyRenamed',
    DummyTested = 'DummyTested',
}

type Created = { type: Events.DummyCreated; data: { name: string; tested: boolean }; meta: Meta }
type Changed = { type: Events.DummyChanged; data: { quanity: number }; meta: Meta }
type Renamed = { type: Events.DummyRenamed; data: { name: string }; meta: Meta }
type Tested = { type: Events.DummyTested; data: { tested: boolean }; meta: Meta }

export type DummyEvents = Created | Changed | Renamed | Tested

export const created = (name: string, tested: boolean, meta?: Meta) =>
    eventOf(Events.DummyCreated, { name, tested }, meta)
export const changed = (quanity: number, meta?: Meta) => eventOf(Events.DummyChanged, { quanity }, meta)
export const renamed = (name: string, meta?: Meta) => eventOf(Events.DummyRenamed, { name }, meta)
export const tested = (meta?: Meta) => eventOf(Events.DummyTested, { tested: true }, meta)
export const unTested = (meta?: Meta) => eventOf(Events.DummyTested, { tested: false }, meta)

export const events = { created, changed, renamed, tested, unTested }

type Create = { type: 'CreateDummy'; data: { name: string; tested: boolean }; meta: Meta }
type Change = { type: 'ChangeDummy'; data: { quantity: number }; meta: Meta }
type Rename = { type: 'RenameDummy'; data: { name: string }; meta: Meta }
type Test = { type: 'TestDummy'; data: unknown; meta: Meta }
type ChangeAndTest = { type: 'ChangeAndTest'; data: { quantity: number; tested: boolean }; meta: Meta }

export type DummyCommands = Create | Change | Rename | Test

export const create = (name: string, tested: boolean, meta?: Meta) => commandOf('CreateDummy', { name, tested }, meta)
export const change = (quantity: number, meta?: Meta) => commandOf('ChangeDummy', { quantity }, meta)
export const rename = (name: string, meta?: Meta) => commandOf('RenameDummy', { name }, meta)
export const test = (meta?: Meta) => commandOf('TestDummy', {}, meta)
export const changeAndTest = (quantity: number, tested: boolean, meta?: Meta) =>
    commandOf('ChangeAndTest', { quantity, tested }, meta)

export const commands = { create, change, rename, test, changeAndTest }

export const init = (): Dummy => ({ name: '', tested: false, quantity: 0 })

const commandHandler: HandlerMap<any, Result> = {
    CreateDummy: (state: Dummy, { data, meta }: Create) => resolveWith(created(data.name, false, meta)),
    ChangeDummy: (state: Dummy, { data, meta }: Change) => resolveWith(changed(data.quantity, meta)),
    RenameDummy: (state: Dummy, { data, meta }: Rename) => resolveWith(renamed(data.name, meta)),
    TestDummy: (state: Dummy, { data, meta }: Test) =>
        state.tested
            ? rejectWith(commandError('Dummy is already tested', 'DummyAlreadyTested'))
            : resolveWith(tested(meta)),
    ChangeAndTest: (state: Dummy, { data, meta }: ChangeAndTest) => [changed(data.quantity, meta), tested(meta)],
}

const eventHandler: HandlerMap<any, Dummy> = {
    DummyCreated: (state: Dummy, { data, meta }: Created) => ({
        ...state,
        name: data.name,
        tested: data.tested,
    }),
    DummyChanged: (state: Dummy, { data, meta }: Changed) => ({
        ...state,
        quantity: state.quantity + data.quanity,
    }),
    DummyRenamed: (state: Dummy, { data, meta }: Renamed) => ({
        ...state,
        name: data.name,
    }),
    DummyTested: (state: Dummy, { data, meta }: Tested) => ({
        ...state,
        tested: data.tested,
    }),
}

export const dummyOf = entityOf(eventHandler, commandHandler)

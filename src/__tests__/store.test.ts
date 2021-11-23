import { DomainEvents } from '..'
import { createEntityStore } from '../store'
import { dummyOf, init, commands, Events } from './dummy'

describe('The aggregate store', () => {
    const app = {}
    const crud = {
        identify: jest.fn(),
        create: jest.fn(),
        load: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    }

    const dummyStore = createEntityStore({ app, crud, init, entityOf: dummyOf, entityType: 'Dummy' })

    beforeEach(() => jest.clearAllMocks())

    it('should generate new aggregates', () => {
        const aggregate = dummyStore.make()
        expect(aggregate).toEqual({
            id: null,
            state: { name: '', tested: false, quantity: 0 },
            events: [],
            execute: expect.any(Function),
        })
    })

    it('should save new aggregates', async () => {
        crud.identify.mockResolvedValue('12345')
        crud.create.mockImplementation((id, state, events) => Promise.resolve([id, state, events]))

        const aggregate = dummyStore.make()
        const promise = dummyStore.save(aggregate)

        await expect(promise).resolves.toMatchObject({
            id: '12345',
            state: { name: '', tested: false },
            events: [],
        })

        expect(crud.identify).toHaveBeenCalled()
        expect(crud.create).toHaveBeenCalled()
    })

    it('should load existing aggregates', async () => {
        crud.load.mockImplementation((id) => Promise.resolve([id, { name: 'foo', tested: true }]))
        const promise = dummyStore.load(12345)
        await expect(promise).resolves.toMatchObject({
            id: 12345,
            state: { name: 'foo', tested: true },
            events: [],
        })
        expect(crud.load).toHaveBeenCalled()
    })

    it('should update existing aggregates', async () => {
        crud.load.mockImplementation((id) => Promise.resolve([id, { name: 'foo', tested: true, quantity: 0 }]))
        crud.update.mockImplementation((id, state, events) => Promise.resolve([id, state, events]))
        const changeOnce = commands.change(10, { app, params: { foo: 'bar' } })
        const onDomainEvent = jest.fn()

        dummyStore.on(DomainEvents.DomainEvent, onDomainEvent)

        const promise = dummyStore
            .load(12345)
            .then(({ execute }) => execute(changeOnce))
            .then((aggregate) => dummyStore.save(aggregate))

        await expect(promise).resolves.toMatchObject({
            id: 12345,
            state: { name: 'foo', tested: true, quantity: 10 },
            events: [],
        })

        expect(crud.update).toHaveBeenCalled()
        expect(onDomainEvent).toHaveBeenCalledWith({
            type: Events.DummyChanged,
            entityType: 'Dummy',
            id: 12345,
            data: { quantity: 10 },
            meta: { app: {}, params: { foo: 'bar' } },
        })

        dummyStore.off(DomainEvents.DomainEvent, onDomainEvent)
    })

    it('should remove aggregates', async () => {
        crud.remove.mockImplementation((id, events, state) => Promise.resolve([id, events, state]))

        const promise = dummyStore.remove({ id: 1234567, events: [], state: null })
        await expect(promise).resolves.toEqual(1234567)
    })

    it('should allow to coerce an arbitrary state into an entity', async () => {
        const entity = dummyStore.coerce('12345', { name: 'coerced', foo: 'bar' })
        expect(entity).toMatchObject({
            id: '12345',
            state: { foo: 'bar', name: 'coerced', tested: false, quantity: 0 },
            events: [],
            execute: expect.any(Function),
        })
    })

    it('should run commands on entities', async () => {
        const entity = dummyStore.coerce('999', { name: '', tested: false, quantity: 0 })
        await dummyStore.execute(entity, commands.rename('foo-bar'))

        expect(entity).toMatchObject({
            id: '999',
            state: { name: 'foo-bar', tested: false, quantity: 0 },
            events: [{ data: { name: 'foo-bar' }, type: 'DummyRenamed', meta: undefined }],
        })
    })

    it('should catch command errors and emit them as "DomainError"', async () => {
        const entity = dummyStore.coerce('999', { name: '', tested: true, quantity: 0 })
        const onDomainError = jest.fn()
        dummyStore.once('DomainError', onDomainError)
        const promise = dummyStore.execute(entity, commands.test())

        await expect(promise).rejects.toMatchObject({
            type: 'ECOMMAND',
            event: 'DummyAlreadyTested',
            data: undefined,
        })
        expect(onDomainError).toHaveBeenCalled()
    })
})

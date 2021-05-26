import { createEntityStore } from '../store'
import { dummyOf, init, commands } from './dummy'

describe('The aggregate store', () => {
    const app = {}
    const crud = {
        identify: jest.fn(),
        create: jest.fn(),
        load: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    }

    const dummyStore = createEntityStore({ app, crud, init, entityOf: dummyOf })

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
    })

    it('should remove aggregates', async () => {
        crud.remove.mockImplementation((id, events, state) => Promise.resolve([id, events, state]))

        const promise = dummyStore.remove({ id: 1234567, events: [], state: null })
        await expect(promise).resolves.toEqual(1234567)
    })
})

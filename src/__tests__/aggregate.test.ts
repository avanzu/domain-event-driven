import { commandOf } from '../commandHandler'
import * as entity from './dummy'

describe('The aggregate', () => {
    it('should generate aggregates with command handlers', () => {
        const dummy = entity.dummyOf('12345', { name: 'a dummy', tested: false })
        expect(dummy).toEqual({
            id: '12345',
            state: { name: 'a dummy', tested: false },
            events: [],

            execute: expect.any(Function),
        })
    })

    it('should be able to reconstitute state from an event stream', () => {
        const events = [
            entity.changed(10),
            entity.tested(),
            entity.unTested(),
            entity.renamed('renamed-once'),
            entity.renamed('renamed-twice'),
            entity.tested(),
        ]
        const dummy = entity.dummyOf('999', { name: null, tested: false, quantity: 0 }, events)

        expect(dummy).toEqual({
            id: '999',
            state: { name: 'renamed-twice', tested: true, quantity: 10 },
            events: [],

            execute: expect.any(Function),
        })
    })

    it('should handle commands', async () => {
        const dummy = entity.dummyOf('12345', { name: 'a dummy', tested: false, quantity: 5 })
        const promise = dummy
            .execute(entity.rename('foo-bar'))
            .then((dummy) => dummy.execute(entity.change(5)))
            .then((dummy) => dummy.execute(entity.test()))

        await expect(promise).resolves.toEqual({
            id: '12345',
            state: { name: 'foo-bar', tested: true, quantity: 10 },
            events: [entity.renamed('foo-bar'), entity.changed(5), entity.tested()],

            execute: expect.any(Function),
        })
    })

    it('should handle rejected commands', async () => {
        const dummy = entity.dummyOf('12345', { name: 'a dummy', tested: false, quantity: 0 })

        const promise = dummy
            .execute(entity.rename('foo-bar'))
            .then(({ execute }) => execute(entity.test()))
            .then(({ execute }) => execute(entity.test()))

        await expect(promise).rejects.toMatchObject({
            message: 'Dummy is already tested',
            type: 'ECOMMAND',
        })

        expect(dummy).toEqual({
            id: '12345',
            state: { name: 'foo-bar', tested: true, quantity: 0 },
            events: [entity.renamed('foo-bar'), entity.tested()],

            execute: expect.any(Function),
        })
    })

    it('should reject commands without a command handler', async () => {
        const dummy = entity.dummyOf('12345', { name: 'a dummy', tested: false })
        const voidDummy = commandOf('VoidIt', null)

        const promise = dummy.execute(voidDummy)

        await expect(promise).rejects.toMatchObject({
            message: 'Command not found: "VoidIt"',
            type: 'ECOMMAND',
        })

        expect(dummy).toEqual({
            id: '12345',
            state: { name: 'a dummy', tested: false },
            events: [],

            execute: expect.any(Function),
        })
    })

    it('should handle event streams from commands', async () => {
        const dummy = entity.dummyOf('12345', { name: 'a dummy', tested: false, quantity: 0 })

        const promise = dummy.execute(entity.changeAndTest(10, true))

        await expect(promise).resolves.toMatchObject({
            id: '12345',
            state: { name: 'a dummy', quantity: 10, tested: true },
            events: [entity.changed(10), entity.tested()],
        })
    })
})

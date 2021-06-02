import { Command, HandlerMap, State, Result, Payload } from './types'

const toEventStream = (result) => (Array.isArray(result) ? result : [result])
export const commandError = (message: string, event: string, data?: Payload) =>
    Object.assign(new Error(message), { type: 'ECOMMAND', event, data })

export const throwCommandError = (message: string, event: string, data?: Payload) => {
    throw commandError(message, event, data)
}

export const commandOf = (type: string, data: object, meta?: object): Command => ({ type, data, meta })

export const matchCommandWith =
    (pattern: HandlerMap<Command, Result>) =>
    (state: State, { type, data, meta }: Command) =>
        (pattern[type]
            ? Promise.resolve(pattern[type])
            : Promise.reject(commandError(`Command not found: "${type}"`, 'CommandNotFound'))
        )
            .then((handle) => handle(state, { type, data, meta }))
            .then(toEventStream)

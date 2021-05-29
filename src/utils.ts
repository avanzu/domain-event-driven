import { Predicate, Callback } from './types'

export const assign = Object.assign
/* prettier-ignore */
export const tap = (fn: Function) => (x: any) => (fn(x), x)
export const either =
    <T>(when: Predicate, yes: Callback<T>, no: Callback<T>) =>
    (item: any, ...args: any[]) =>
        when(item, ...args) ? yes(item, ...args) : no(item, ...args)

export const resolveWith = <T>(value: T): Promise<T> => Promise.resolve(value)
export const rejectWith = <T>(value: T): Promise<T> => Promise.reject(value)

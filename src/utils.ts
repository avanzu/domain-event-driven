import { Predicate, Callback } from './types'

export const assign = Object.assign
/* prettier-ignore */
export const tap = (fn: Function) => (x: any) => (fn(x), x)
export const either =
    <T>(when: Predicate, yes: Callback<T>, no: Callback<T>) =>
    (item: any) =>
        when(item) ? yes(item) : no(item)

export const resolveWith = <T>(value: T): Promise<T> => Promise.resolve(value)
export const rejectWith = <T>(value: T): Promise<T> => Promise.reject(value)

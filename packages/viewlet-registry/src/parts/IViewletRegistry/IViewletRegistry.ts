import type { StateTuple } from '../StateTuple/StateTuple.ts'

export interface WrappedFn {
  (uid: number, ...args: readonly any[]): Promise<void>
}

export interface Fn<T> {
  (state: T, ...args: readonly any[]): T | Promise<T>
}

export interface DiffModule<T> {
  (oldState: T, newState: T): boolean
}

export interface IViewletRegistry<T> {
  readonly get: (uid: number) => StateTuple<T>
  readonly set: (uid: number, oldState: T, newState: T) => void
  readonly dispose: (uid: number) => void
  readonly getKeys: () => readonly number[]
  readonly clear: () => void
  readonly wrapCommand: (fn: Fn<T>) => WrappedFn
  readonly diff: (uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]) => readonly number[]
}

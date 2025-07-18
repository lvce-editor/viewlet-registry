import type { StateTuple } from '../StateTuple/StateTuple.ts'

export interface WrappedFn {
  (uid: number, ...args: readonly any[]): Promise<void>
}

export interface WrappedGetter {
  (uid: number, ...args: readonly any[]): any
}

export interface Fn<T> {
  (state: T, ...args: readonly any[]): T | Promise<T>
}

export interface DiffModule<T> {
  (oldState: T, newState: T): boolean
}

export interface IViewletRegistry<T> {
  readonly clear: () => void
  readonly diff: (uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]) => readonly number[]
  readonly dispose: (uid: number) => void
  readonly get: (uid: number) => StateTuple<T>
  readonly getCommandIds: () => readonly string[]
  readonly getKeys: () => readonly number[]
  readonly registerCommands: (commandMap: any) => void
  readonly set: (uid: number, oldState: T, newState: T) => void
  readonly wrapCommand: (fn: Fn<T>) => WrappedFn
  readonly wrapGetter: (fn: Fn<T>) => WrappedGetter
}

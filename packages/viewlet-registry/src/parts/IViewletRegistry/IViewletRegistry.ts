import type { StateTuple } from '../StateTuple/StateTuple.ts'

export interface WrappedFn {
  (uid: number, ...args: readonly any[]): Promise<void>
}

interface WrappedGetter {
  (uid: number, ...args: readonly any[]): any
}

export interface WrappedLoadContent {
  (uid: number, ...args: readonly any[]): any
}

export interface StateUpdater<T> {
  (state: T): T
}

export interface AsyncCommandContext<T> {
  readonly getState: () => T
  readonly updateState: (updater: StateUpdater<T>) => Promise<T>
}

export interface AsyncCommand<T> {
  (context: AsyncCommandContext<T>, ...args: readonly any[]): Promise<void>
}

interface LoadContentResult<T> {
  readonly error: undefined
  readonly state: T
}

export interface LoadContentFunction<T> {
  (state: T, ...args: readonly any[]): Promise<LoadContentResult<T>>
}

interface Getter<T> {
  (state: T, ...args: readonly any[]): any
}

export interface Fn<T> {
  (state: T, ...args: readonly any[]): T | Promise<T>
}

export interface DiffModule<T> {
  (oldState: T, newState: T): boolean
}

export interface RequestRender {
  (uid: number): Promise<void>
}

export interface DirectEventCommandMap {
  readonly 'Viewlet.executeViewletCommand': (uid: number, command: string, ...args: readonly any[]) => Promise<void>
}

export interface IViewletRegistry<T> {
  readonly clear: () => void
  readonly createDirectEventCommandMap: (requestRender: RequestRender) => DirectEventCommandMap
  readonly diff: (uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]) => readonly number[]
  readonly dispose: (uid: number) => void
  readonly get: (uid: number) => StateTuple<T>
  readonly getCommandIds: () => readonly string[]
  readonly getKeys: () => readonly number[]
  readonly registerCommands: (commandMap: any) => void
  readonly set: (uid: number, oldState: T, newState: T, scheduledState?: T) => void
  readonly wrapAsyncCommand: (fn: AsyncCommand<T>) => WrappedFn
  readonly wrapCommand: (fn: Fn<T>) => WrappedFn
  readonly wrapGetter: (fn: Getter<T>) => WrappedGetter
  readonly wrapLoadContent: (fn: LoadContentFunction<T>) => WrappedLoadContent
  readonly wrapSerialAsyncCommand: (fn: AsyncCommand<T>) => WrappedFn
  readonly wrapSerialCommand: (fn: Fn<T>) => WrappedFn
}

import type {
  DiffModule,
  Fn,
  IViewletRegistry,
  LoadContentFunction,
  WrappedFn,
  WrappedLoadContent,
} from '../IViewletRegistry/IViewletRegistry.ts'
import type { StateTuple } from '../StateTuple/StateTuple.ts'

const toCommandId = (key: string): string => {
  const dotIndex = key.indexOf('.')
  return key.slice(dotIndex + 1)
}

export const create = <T>(): IViewletRegistry<T> => {
  const states: Record<number | string, StateTuple<T>> = Object.create(null)
  const commandMapRef = {}
  return {
    clear(): void {
      for (const key of Object.keys(states)) {
        delete states[key]
      }
    },
    diff(uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]): readonly number[] {
      const { newState, oldState } = states[uid]
      const diffResult: number[] = []
      for (let i = 0; i < modules.length; i++) {
        const fn = modules[i]
        if (!fn(oldState, newState)) {
          diffResult.push(numbers[i])
        }
      }
      return diffResult
    },
    dispose(uid: number): void {
      delete states[uid]
    },
    get(uid: number): StateTuple<T> {
      return states[uid]
    },
    getCommandIds(): readonly string[] {
      const keys = Object.keys(commandMapRef)
      const ids = keys.map(toCommandId)
      return ids
    },
    getKeys(): readonly number[] {
      return Object.keys(states).map((key) => {
        return Number.parseFloat(key)
      })
    },
    registerCommands(commandMap): void {
      Object.assign(commandMapRef, commandMap)
    },
    set(uid, oldState: T, newState: T): void {
      states[uid] = { newState, oldState }
    },
    wrapCommand(fn: Fn<T>): WrappedFn {
      const wrapped = async (uid: number, ...args: readonly any[]): Promise<void> => {
        const { newState, oldState } = states[uid]
        const newerState = await fn(newState, ...args)
        if (oldState === newerState || newState === newerState) {
          return
        }
        const latestOld = states[uid]
        const latestNew = { ...latestOld.newState, ...newerState }
        states[uid] = {
          newState: latestNew,
          oldState: latestOld.oldState,
        }
      }
      return wrapped
    },
    wrapGetter(fn: Fn<T>): WrappedFn {
      const wrapped = (uid: number, ...args: readonly any[]): any => {
        const { newState } = states[uid]
        return fn(newState, ...args)
      }
      return wrapped
    },
    wrapLoadContent(fn: LoadContentFunction<T>): WrappedLoadContent {
      const wrapped = async (uid: number, ...args: readonly any[]): Promise<any> => {
        const { newState, oldState } = states[uid]
        const result = await fn(newState, ...args)
        const { error, state } = result
        if (oldState === state || newState === state) {
          return {
            error,
          }
        }
        const latestOld = states[uid]
        const latestNew = { ...latestOld.newState, ...state }
        states[uid] = {
          newState: latestNew,
          oldState: latestOld.oldState,
        }
        return {
          error,
        }
      }
      return wrapped
    },
  }
}

export const terminate = (): void => {
  globalThis.close()
}

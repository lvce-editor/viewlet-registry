import type {
  AsyncCommand,
  AsyncCommandContext,
  DiffModule,
  Fn,
  IViewletRegistry,
  LoadContentFunction,
  StateUpdater,
  WrappedFn,
  WrappedLoadContent,
} from '../IViewletRegistry/IViewletRegistry.ts'
import type { StateTuple } from '../StateTuple/StateTuple.ts'

const toCommandId = (key: string): string => {
  const dotIndex = key.indexOf('.')
  return key.slice(dotIndex + 1)
}

export const create = <T>(): IViewletRegistry<T> => {
  const generations: Record<number | string, number> = Object.create(null)
  const states: Record<number | string, StateTuple<T>> = Object.create(null)
  const commandMapRef = {}

  const getGeneration = (uid: number): number => generations[uid] || 0

  const isCurrentGeneration = (uid: number, generation: number): boolean => {
    return states[uid] !== undefined && getGeneration(uid) === generation
  }

  const updateState = (uid: number, generation: number, fallbackState: T, updater: StateUpdater<T>): Promise<T> => {
    if (!isCurrentGeneration(uid, generation)) {
      return Promise.resolve(fallbackState)
    }
    const current = states[uid]
    const updatedState = updater(current.newState)
    if (updatedState !== current.newState) {
      states[uid] = {
        newState: updatedState,
        oldState: current.oldState,
        scheduledState: updatedState,
      }
    }
    return Promise.resolve(updatedState)
  }

  return {
    clear(): void {
      for (const key of Object.keys(states)) {
        delete states[key]
      }
    },
    diff(uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]): readonly number[] {
      const { oldState, scheduledState } = states[uid]
      const diffResult: number[] = []
      for (let i = 0; i < modules.length; i++) {
        const fn = modules[i]
        if (!fn(oldState, scheduledState)) {
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
      return Object.keys(states).map(Number)
    },
    registerCommands(commandMap): void {
      Object.assign(commandMapRef, commandMap)
    },
    set(uid, oldState: T, newState: T, scheduledState?: T): void {
      const current = states[uid]
      if (!current || (oldState === newState && newState !== current.newState)) {
        generations[uid] = getGeneration(uid) + 1
      }
      states[uid] = { newState, oldState, scheduledState: scheduledState ?? newState }
    },
    wrapAsyncCommand(fn: AsyncCommand<T>): WrappedFn {
      const wrapped = async (uid: number, ...args: readonly any[]): Promise<void> => {
        const generation = getGeneration(uid)
        let latestState = states[uid].newState
        const context: AsyncCommandContext<T> = {
          getState: () => {
            if (isCurrentGeneration(uid, generation)) {
              latestState = states[uid].newState
            }
            return latestState
          },
          updateState: async (updater) => {
            latestState = await updateState(uid, generation, latestState, updater)
            return latestState
          },
        }
        await fn(context, ...args)
      }
      return wrapped
    },
    wrapCommand(fn: Fn<T>): WrappedFn {
      const wrapped = async (uid: number, ...args: readonly any[]): Promise<void> => {
        const generation = getGeneration(uid)
        const { newState, oldState } = states[uid]
        const newerState = await fn(newState, ...args)
        if (oldState === newerState || newState === newerState) {
          return
        }
        if (!isCurrentGeneration(uid, generation)) {
          return
        }
        const latestOld = states[uid]
        const latestNew = { ...latestOld.newState, ...newerState }
        states[uid] = {
          newState: latestNew,
          oldState: latestOld.oldState,
          scheduledState: latestNew,
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
        const generation = getGeneration(uid)
        const { newState, oldState } = states[uid]
        const result = await fn(newState, ...args)
        const { error, state } = result
        if (oldState === state || newState === state) {
          return {
            error,
          }
        }
        if (!isCurrentGeneration(uid, generation)) {
          return {
            error,
          }
        }
        const latestOld = states[uid]
        const latestNew = { ...latestOld.newState, ...state }
        states[uid] = {
          newState: latestNew,
          oldState: latestOld.oldState,
          scheduledState: latestNew,
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

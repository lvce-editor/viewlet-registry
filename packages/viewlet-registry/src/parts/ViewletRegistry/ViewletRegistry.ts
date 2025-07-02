import type { DiffModule, Fn, IViewletRegistry, WrappedFn } from '../IViewletRegistry/IViewletRegistry.ts'
import type { StateTuple } from '../StateTuple/StateTuple.ts'

export const create = <T>(): IViewletRegistry<T> => {
  const states = Object.create(null)

  return {
    get(uid: number): StateTuple<T> {
      return states[uid]
    },
    set(uid, oldState: T, newState: T): void {
      states[uid] = { oldState, newState }
    },
    dispose(uid: number): void {
      delete states[uid]
    },
    getKeys(): readonly number[] {
      return Object.keys(states).map((key) => {
        return Number.parseInt(key)
      })
    },
    clear(): void {
      for (const key of Object.keys(states)) {
        delete states[key]
      }
    },
    wrapCommand(fn: Fn<T>): WrappedFn {
      const wrapped = async (uid: number, ...args: readonly any[]): Promise<void> => {
        const { newState } = states[uid]
        const newerState = await fn(newState, ...args)
        if (newState === newerState) {
          return
        }
        const latest = states[uid]
        states[uid] = { oldState: latest.oldState, newState: newerState }
      }
      return wrapped
    },

    diff(uid: number, modules: readonly DiffModule<T>[], numbers: readonly number[]): readonly number[] {
      const { oldState, newState } = states[uid]
      const diffResult: number[] = []
      for (let i = 0; i < modules.length; i++) {
        const fn = modules[i]
        if (!fn(oldState, newState)) {
          diffResult.push(numbers[i])
        }
      }
      return diffResult
    },
  }
}

export const terminate = (): void => {
  globalThis.close()
}

import type { IViewletRegistry } from '../IViewletRegistry/IViewletRegistry.ts'
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
  }
}

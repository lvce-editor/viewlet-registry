import * as AboutStates from '../ViewletStates/ViewletStates.ts'

export interface WrappedFn {
  (uid: number, ...args: readonly any[]): Promise<void>
}

interface Fn {
  (state: any, ...args: readonly any[]): any
}

export const wrapCommand = (fn: Fn): WrappedFn => {
  const wrapped = async (uid: number, ...args: readonly any[]): Promise<void> => {
    const { newState } = AboutStates.get(uid)
    const newerState = await fn(newState, ...args)
    if (newState === newerState) {
      return
    }
    const latest = AboutStates.get(uid)
    AboutStates.set(uid, latest.oldState, newerState)
  }
  return wrapped
}

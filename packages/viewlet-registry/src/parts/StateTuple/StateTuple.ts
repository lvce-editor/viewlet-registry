export interface StateTuple<T> {
  readonly newState: T
  readonly oldState: T
}

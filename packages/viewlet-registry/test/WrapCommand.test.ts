import { expect, test } from '@jest/globals'
import * as AboutStates from '../src/parts/ViewletStates/ViewletStates.ts'
import { wrapCommand } from '../src/parts/WrapCommand/WrapCommand.ts'

const createState = (uid: number): any => ({
  productName: 'test',
  lines: [],
  focusId: 0,
  uid,
})

const fn1 = async (state: any): Promise<any> => {
  return { ...state, productName: 'new' }
}

test('wrapCommand should update state when function returns new state', async () => {
  const uid = 123
  const oldState = createState(uid)
  const newState = { ...oldState, productName: 'new' }

  AboutStates.set(uid, oldState, oldState)

  const wrapped = wrapCommand(fn1)
  await wrapped(uid)

  const { newState: currentState } = AboutStates.get(uid)
  expect(currentState).toEqual(newState)
})

const fn2 = async (state: any): Promise<any> => state

test('wrapCommand should not update state when function returns same state', async () => {
  const uid = 123
  const state = createState(uid)

  AboutStates.set(uid, state, state)

  const wrapped = wrapCommand(fn2)
  await wrapped(uid)

  const { newState: currentState } = AboutStates.get(uid)
  expect(currentState).toEqual(state)
})

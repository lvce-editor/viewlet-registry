import { expect, test } from '@jest/globals'
import * as ViewletRegistry from '../src/parts/ViewletRegistry/ViewletRegistry.ts'

interface TestState {
  readonly count: number
  readonly values: readonly string[]
}

const createState = (): TestState => ({
  count: 0,
  values: [],
})

test('create', () => {
  expect(ViewletRegistry.create).toBeDefined()
})

test('wrapAsyncCommand should update state', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const command = registry.wrapAsyncCommand(async (context, count: number) => {
    await context.updateState((latestState) => ({
      ...latestState,
      count,
    }))
  })

  await command(1, 42)

  expect(registry.get(1).newState).toEqual({
    count: 42,
    values: [],
  })
})

test('wrapAsyncCommand should apply updates to the latest state', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const { promise: firstCommandStarted, resolve: notifyFirstCommandStarted } = Promise.withResolvers<void>()
  const { promise: waitForSecondCommand, resolve: continueFirstCommand } = Promise.withResolvers<void>()
  const command = registry.wrapAsyncCommand(async (context, value: string) => {
    if (value === 'first') {
      notifyFirstCommandStarted()
      await waitForSecondCommand
    }
    await context.updateState((latestState) => ({
      ...latestState,
      values: [...latestState.values, value],
    }))
  })

  const firstCommand = command(1, 'first')
  await firstCommandStarted
  await command(1, 'second')
  continueFirstCommand()
  await firstCommand

  expect(registry.get(1).newState.values).toEqual(['second', 'first'])
})

test('wrapAsyncCommand getState should return the latest state', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const command = registry.wrapAsyncCommand(async (context) => {
    await context.updateState((latestState) => ({
      ...latestState,
      count: latestState.count + 1,
    }))
    expect(context.getState().count).toBe(1)
  })

  await command(1)
})

test('wrapAsyncCommand should preserve the current state when the updater returns it', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const command = registry.wrapAsyncCommand(async (context) => {
    await context.updateState((latestState) => latestState)
  })

  await command(1)

  expect(registry.get(1).newState).toBe(state)
})

test('wrapAsyncCommand should not update a replacement view with the same uid', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const { promise: commandStarted, resolve: notifyCommandStarted } = Promise.withResolvers<void>()
  const { promise: waitForReplacement, resolve: continueCommand } = Promise.withResolvers<void>()
  const command = registry.wrapAsyncCommand(async (context) => {
    notifyCommandStarted()
    await waitForReplacement
    await context.updateState((latestState) => ({
      ...latestState,
      count: 42,
    }))
  })

  const pendingCommand = command(1)
  await commandStarted
  const replacementState: TestState = {
    count: 1,
    values: ['replacement'],
  }
  registry.set(1, replacementState, replacementState)
  continueCommand()
  await pendingCommand

  expect(registry.get(1).newState).toBe(replacementState)
})

test('wrapAsyncCommand should continue after the current view is rendered', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const { promise: commandStarted, resolve: notifyCommandStarted } = Promise.withResolvers<void>()
  const { promise: waitForRender, resolve: continueCommand } = Promise.withResolvers<void>()
  const command = registry.wrapAsyncCommand(async (context) => {
    notifyCommandStarted()
    await waitForRender
    await context.updateState((latestState) => ({
      ...latestState,
      count: 42,
    }))
  })

  const pendingCommand = command(1)
  await commandStarted
  const currentState = registry.get(1).newState
  registry.set(1, currentState, currentState)
  continueCommand()
  await pendingCommand

  expect(registry.get(1).newState.count).toBe(42)
})

test('wrapAsyncCommand should propagate command errors', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const command = registry.wrapAsyncCommand(async () => {
    throw new Error('command failed')
  })

  await expect(command(1)).rejects.toThrow('command failed')
})

test('wrapSerialCommand should run commands in invocation order', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const { promise: firstCommandStarted, resolve: notifyFirstCommandStarted } = Promise.withResolvers<void>()
  const { promise: waitForFirstCommand, resolve: continueFirstCommand } = Promise.withResolvers<void>()
  const command = registry.wrapSerialCommand(async (currentState, value: string) => {
    if (value === 'first') {
      notifyFirstCommandStarted()
      await waitForFirstCommand
    }
    return {
      ...currentState,
      values: [...currentState.values, value],
    }
  })

  const firstCommand = command(1, 'first')
  await firstCommandStarted
  const secondCommand = command(1, 'second')
  continueFirstCommand()
  await Promise.all([firstCommand, secondCommand])

  expect(registry.get(1).newState.values).toEqual(['first', 'second'])
})

test('wrapSerialCommand should continue the queue after a command error', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const command = registry.wrapSerialCommand(async (currentState, value: string) => {
    if (value === 'first') {
      throw new Error('command failed')
    }
    return {
      ...currentState,
      values: [...currentState.values, value],
    }
  })

  const firstCommand = command(1, 'first')
  const secondCommand = command(1, 'second')
  await expect(firstCommand).rejects.toThrow('command failed')
  await secondCommand

  expect(registry.get(1).newState.values).toEqual(['second'])
})

test('wrapSerialCommand should run queued commands against the current view lifecycle', async () => {
  const registry = ViewletRegistry.create<TestState>()
  const state = createState()
  registry.set(1, state, state)
  const { promise: firstCommandStarted, resolve: notifyFirstCommandStarted } = Promise.withResolvers<void>()
  const { promise: waitForReplacement, resolve: continueFirstCommand } = Promise.withResolvers<void>()
  const command = registry.wrapSerialCommand(async (currentState, value: string) => {
    if (value === 'first') {
      notifyFirstCommandStarted()
      await waitForReplacement
    }
    return {
      ...currentState,
      values: [...currentState.values, value],
    }
  })

  const firstCommand = command(1, 'first')
  await firstCommandStarted
  const secondCommand = command(1, 'second')
  const replacementState: TestState = {
    count: 1,
    values: ['replacement'],
  }
  registry.set(1, replacementState, replacementState)
  continueFirstCommand()
  await Promise.all([firstCommand, secondCommand])

  expect(registry.get(1).newState).toEqual({
    count: 1,
    values: ['replacement', 'second'],
  })
})

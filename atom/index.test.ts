import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import { atom } from '../index.js'

let clock = FakeTimers.install()

test('listens', () => {
  let calls = 0
  let $store = atom({ some: { path: 0 } })
  let unbind = $store.listen(value => {
    calls += 1
    equal(value, $store.get())
  })

  $store.set({ some: { path: 1 } })
  $store.set({ some: { path: 2 } })
  deepStrictEqual($store.get(), { some: { path: 2 } })
  equal(calls, 2)
  unbind()
})

test('subscribes', () => {
  let calls = 0
  let $store = atom({ some: { path: 0 } })
  let unbind = $store.subscribe(value => {
    calls += 1
    equal(value, $store.get())
  })

  $store.set({ some: { path: 1 } })
  $store.set({ some: { path: 2 } })
  deepStrictEqual($store.get(), { some: { path: 2 } })
  equal(calls, 3)
  unbind()
})

test('has default value', () => {
  let events: any[] = []
  let $time = atom()
  equal($time.value, undefined)
  $time.listen(() => {})
  $time.listen(() => {})
  $time.listen(() => {})
  let unbind = $time.subscribe(value => {
    events.push(value)
  })
  $time.set({ test: 2 })
  $time.set({ test: 3 })
  deepStrictEqual($time.value, { test: 3 })
  deepStrictEqual(events, [undefined, { test: 2 }, { test: 3 }])
  unbind()
})

test('works without initializer', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>()

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, [undefined])

  $store.set('new')
  deepStrictEqual(events, [undefined, 'new'])

  unbind()
  clock.runAll()
})

test('does not run queued listeners after they are unsubscribed', () => {
  let events: string[] = []
  let $store = atom<number>(0)

  $store.listen(value => {
    events.push(`a${value}`)
    $store.listen(v => {
      events.push(`c${v}`)
    })
    if (value > 1) {
      unbindB()
    }
  })

  let unbindB = $store.listen(value => {
    events.push(`b${value}`)
  })

  $store.set(1)
  deepStrictEqual(events, ['a1', 'b1'])

  $store.set(2)
  deepStrictEqual(events, ['a1', 'b1', 'a2', 'c2'])
})

test('does not run queued listeners after they are unsubscribed when queue index is different from listener index', () => {
  let events: string[] = []
  let $storeA = atom<number>(0)
  let $storeB = atom<number>(0)

  $storeA.listen(value => {
    events.push(`a1_${value}`)
    $storeB.set(1)
    unbindB()
  })

  $storeA.listen(value => {
    events.push(`a2_${value}`)
  })

  let unbindB = $storeB.listen(value => {
    events.push(`b1_${value}`)
  })

  $storeA.set(1)
  deepStrictEqual(events, ['a1_1', 'a2_1'])
})

test('does not run queued listeners after they are unsubscribed after the store is modified multiple times during the same batch', () => {
  let events: string[] = []
  let $storeA = atom<number>(0)
  let $storeB = atom<number>(0)

  $storeA.listen(value => {
    events.push(`a1_${value}`)
    $storeB.set(1)
    $storeB.set(2)
    unbindB()
  })

  $storeA.listen(value => {
    events.push(`a2_${value}`)
  })

  let unbindB = $storeB.listen(value => {
    events.push(`b1_${value}`)
  })

  $storeA.set(1)
  deepStrictEqual(events, ['a1_1', 'a2_1'])
})

test('runs the right listeners after a listener in the queue that has already been called is unsubscribed', () => {
  let events: string[] = []
  let $store = atom<number>(0)

  let unbindA = $store.listen(value => {
    events.push(`a${value}`)
  })

  $store.listen(value => {
    events.push(`b${value}`)
    unbindA()
  })

  $store.listen(value => {
    events.push(`c${value}`)
  })

  $store.set(1)
  deepStrictEqual(events, ['a1', 'b1', 'c1'])

  events.length = 0
  $store.set(2)
  deepStrictEqual(events, ['b2', 'c2'])
})

test('unsubscribe works with listenerQueue when atom value contains other listener function', () => {
  let events: string[] = []
  let $store = atom<any>()

  $store.listen(() => {
    events.push('a')
    unbindC()
  })
  $store.listen(() => {
    events.push('b')
  })
  let listenerC = (): void => {
    events.push('c')
  }
  let unbindC = $store.listen(listenerC)
  $store.set(listenerC)
  deepStrictEqual(events, ['a', 'b'])
})

test('prevents notifying when new value is referentially equal to old one', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>('old')

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['old'])

  $store.set('old')
  deepStrictEqual(events, ['old'])

  $store.set('new')
  deepStrictEqual(events, ['old', 'new'])

  unbind()
  clock.runAll()
})

test('can use previous value in listeners', () => {
  let events: (number | undefined)[] = []
  let $store = atom(0)
  let unbind = $store.listen((value, oldValue) => {
    events.push(oldValue)
  })

  $store.set(1)
  $store.set(2)
  deepStrictEqual(events, [0, 1])
  unbind()
  clock.runAll()
})

test('can use previous value in subscribers', () => {
  let events: (number | undefined)[] = []
  let $store = atom(0)
  let unbind = $store.subscribe((value, oldValue) => {
    events.push(oldValue)
  })

  $store.set(1)
  $store.set(2)
  deepStrictEqual(events, [undefined, 0, 1])
  unbind()
  clock.runAll()
})

test('supports immer producer functions', () => {
  let calls = 0
  let $store = atom({ some: { path: 0 } })
  let unbind = $store.subscribe(value => {
    calls += 1
    equal(value, $store.get())
  })

  $store.mut(draft => {
    draft.some.path = 1
  })
  
  deepStrictEqual($store.get(), { some: { path: 1 } })
  equal(calls, 2)

  $store.mut(draft => {
    draft.some.path = 2
  })
  
  deepStrictEqual($store.get(), { some: { path: 2 } })
  equal(calls, 3)
  unbind()
})

test('supports both direct values and immer producers', () => {
  let $store = atom({ nested: { count: 1 }, value: 1 })
  
  // Direct value
  $store.set({ nested: { count: 2 }, value: 2 })
  deepStrictEqual($store.get(), { nested: { count: 2 }, value: 2 })
  
  // Immer producer
  $store.mut(draft => {
    draft.nested.count = 3
    draft.value = 3
  })
  deepStrictEqual($store.get(), { nested: { count: 3 }, value: 3 })
})

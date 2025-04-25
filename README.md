# Nanostores Immer

<img align="right" width="92" height="92" title="Nano Stores logo"
     src="https://nanostores.github.io/nanostores/logo.svg">

Immer integration for [nanostores](https://github.com/nanostores/nanostores), providing immutable state updates with mutable syntax.

* **Small.** Zero dependencies except for nanostores and immer.
* **Simple.** Just use `mut()` method to update state with Immer.
* **Type Safe.** Written in TypeScript with good type inference.

```ts
import { atom } from '@illuxiza/nanostores-immer'

// Create a store
const $users = atom({ 
  admins: [
    { id: 1, name: 'John' }
  ],
  users: [
    { id: 2, name: 'Jane' }
  ]
})

// Update with Immer's mutable syntax
$users.mut(draft => {
  draft.admins.push({ id: 3, name: 'Bob' })
  draft.users[0].name = 'Jane Doe'
})
```

## Install

```sh
npm install @illuxiza/nanostores-immer
```

## Usage

### Basic Usage

Import the `atom` from this package instead of nanostores:

```ts
import { atom } from '@illuxiza/nanostores-immer'

const $store = atom({ count: 0 })

// Update state with Immer
$store.mut(draft => {
  draft.count++
})

// Regular updates still work
$store.set({ count: 2 })
```

### With React

```tsx
import { useStore } from '@nanostores/react'
import { atom } from '@illuxiza/nanostores-immer'

const $todos = atom([
  { id: 1, text: 'Buy milk', done: false }
])

export const TodoList = () => {
  const todos = useStore($todos)
  
  const toggleTodo = (id: number) => {
    $todos.mut(draft => {
      const todo = draft.find(t => t.id === id)
      if (todo) todo.done = !todo.done
    })
  }

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id} onClick={() => toggleTodo(todo.id)}>
          {todo.text} {todo.done ? '✓' : ''}
        </li>
      ))}
    </ul>
  )
}
```

### TypeScript Support

The package is written in TypeScript and provides good type inference:

```ts
interface User {
  id: number
  name: string
  settings: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

const $user = atom<User>({
  id: 1,
  name: 'John',
  settings: {
    theme: 'light',
    notifications: true
  }
})

// TypeScript will ensure type safety
$user.mut(draft => {
  draft.settings.theme = 'dark' // ✓ OK
  draft.settings.theme = 'blue' // ✗ Type Error
})
```

## License

MIT

## Credits

- [Nanostores](https://github.com/nanostores/nanostores) - The original state manager
- [Immer](https://github.com/immerjs/immer) - Immutable state with a mutable API

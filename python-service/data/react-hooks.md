# React Hooks - Complete Guide for Placements

## What are React Hooks?
React Hooks are functions that let you "hook into" React state and lifecycle features from functional components. Introduced in React 16.8, they eliminate the need for class components in most cases.

## useState Hook
The most basic hook for adding state to functional components.

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**Key Points:**
- `useState` returns an array: [currentValue, setterFunction]
- State updates trigger re-renders
- Never mutate state directly — always use the setter

## useEffect Hook
Handles side effects like data fetching, subscriptions, and DOM manipulation.

```javascript
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));

    return () => {
      // Cleanup function runs on unmount or before re-run
    };
  }, [userId]); // Dependency array — runs when userId changes
}
```

**Dependency Array Rules:**
- Empty `[]` → runs once after mount
- `[value]` → runs when value changes
- No array → runs after every render

## useContext Hook
Consume React context without wrapper components.

```javascript
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Button />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click me</button>;
}
```

## useRef Hook
Access DOM elements or store mutable values that don't trigger re-renders.

```javascript
function TextInput() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current.focus();
  }

  return <input ref={inputRef} />;
}
```

## useMemo and useCallback
Optimization hooks to prevent unnecessary recalculations and re-renders.

```javascript
// useMemo - memoize expensive calculations
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback - memoize functions
const handleClick = useCallback(() => {
  doSomething(a);
}, [a]);
```

## Common Interview Questions on Hooks
1. What is the difference between `useEffect` and `componentDidMount`?
2. When would you use `useRef` over `useState`?
3. What are the rules of hooks? (only call at top level, only in React functions)
4. How do you prevent infinite loops in `useEffect`?
5. What is the purpose of the cleanup function in `useEffect`?

## Key Takeaways
- Hooks make functional components as powerful as class components
- Always follow the Rules of Hooks: no conditional calls, no loops
- `useEffect` cleanup prevents memory leaks

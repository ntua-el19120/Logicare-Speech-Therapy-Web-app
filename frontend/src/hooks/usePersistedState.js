/*With this React hook a piece of state in my React component
remembers what it was even if we refresh the page
(using the browser's localStorage)
and behaves just like a normal useState variable in React */





import { useState, useEffect } from 'react'
/*useState for component state.

useEffect for running side-effects after render. */

export function usePersistedState(key, defaultValue) {
//key (string): the localStorage key under which to store/retrieve data.
//defaultValue: the fallback value if nothing is in localStorage yet.
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
//If raw is non-null, we JSON.parse it,Otherwise we fall back to the defaultValue
  })

/*useState with lazy initializer:React calls that once on the first render to get the initial state.
 useEffect hook: runs after every render where its dependencies change*/

  useEffect(() => {
    //localStorage only stores strings, so you must serialize non-string data.
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

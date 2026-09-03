import { useState, useEffect } from 'react'

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    const root = document.documentElement

    // Momentarily kill all transitions so every element switches instantly
    // instead of flashing between old/new colors mid-transition.
    root.classList.add('theme-transitioning')

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('darkMode', isDark)

    // Double rAF guarantees the browser has actually painted the
    // no-transition state before we re-enable transitions.
    // A single setTimeout(0) doesn't guarantee a paint has happened first.
    let raf1, raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        root.classList.remove('theme-transitioning')
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [isDark])

  const toggle = () => setIsDark(prev => !prev)

  return { isDark, toggle }
}

export default useDarkMode
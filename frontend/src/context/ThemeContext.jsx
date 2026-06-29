import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ tema: 'oscuro', setTema: () => {} });

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(
    () => localStorage.getItem('partgo_tema') || 'oscuro'
  );

  useEffect(() => {
    const html = document.documentElement;
    if (tema === 'claro') {
      html.classList.add('light-mode');
    } else {
      html.classList.remove('light-mode');
    }
    localStorage.setItem('partgo_tema', tema);
  }, [tema]);

  return (
    <ThemeContext.Provider value={{ tema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

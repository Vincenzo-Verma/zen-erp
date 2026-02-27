import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext'
import { App } from './App'

/* Bootstrap first, then template styles, then our overrides */
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/template.css'
import './styles/theme-variables.css'
import './styles/bootstrap-overrides.css'
import './styles/utilities.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </StrictMode>,
)

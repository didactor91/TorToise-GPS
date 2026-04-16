import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './components/App'
import { BrowserRouter as Router } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo/client'
import { IconoirProvider } from 'iconoir-react'
import './i18n'

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)
root.render(
  <Router>
    <ApolloProvider client={client}>
      <IconoirProvider
        iconProps={{
          color: 'currentColor',
          width: '20',
          height: '20',
          strokeWidth: 1.8
        }}
      >
        <App />
      </IconoirProvider>
    </ApolloProvider>
  </Router>
)

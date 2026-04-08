import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './components/App'
import { BrowserRouter as Router } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo/client'

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)
root.render(
  <Router>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </Router>
)

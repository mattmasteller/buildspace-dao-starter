import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App.jsx'

// Import ThirdWeb
import { ThirdwebWeb3Provider } from '@3rdweb/hooks'

// Include what chains you want to support.
// 4 = Rinkeby
const supportedChainIds = [4]

// Include what type of wallet you want to support.
// In this case, support Metamask which is an "injected wallet".
const connectors = {
  injected: {},
}

// Render the App component to the DOM
ReactDOM.render(
  <React.StrictMode>
    {/* Finally, wrap App with ThirdwebWeb3Provider */}
    <ThirdwebWeb3Provider
      connectors={connectors}
      supportedChainIds={supportedChainIds}
    >
      <App />
    </ThirdwebWeb3Provider>
  </React.StrictMode>,
  document.getElementById('root')
)

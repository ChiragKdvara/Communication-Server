import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TemplateProvider } from './components/TemplateContext'
import ErrorBoundary from './components/ErrorBoundary'
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TemplateProvider>
        <Router>
          <div className="font-poppins">
            <App />
          </div>
        </Router>
      </TemplateProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)

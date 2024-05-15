import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

// Create the Template Context
const TemplateContext = createContext()

// Template Provider Component
export const TemplateProvider = ({ children }) => {
  const [templateData, setTemplateData] = useState({
    template_name: '',
    message_title: '',
    message_content: '',
  })

  return <TemplateContext.Provider value={{ templateData, setTemplateData }}>{children}</TemplateContext.Provider>
}

// Add propTypes for `children`
TemplateProvider.propTypes = {
  children: PropTypes.node.isRequired, // Specify that `children` is required
}

// Custom hook to use the TemplateContext
export const useTemplate = () => useContext(TemplateContext)

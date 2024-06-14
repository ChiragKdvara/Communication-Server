import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTemplate } from './TemplateContext'
import Header from './Header'
import { ArrowBigLeft, CirclePlus, FilePlus2 } from 'lucide-react'
import axios from 'axios'

const CreateTemplate = () => {
  const BASE_URL = import.meta.env.VITE_URL
  const navigate = useNavigate()
  const { templateData, setTemplateData } = useTemplate()
  const [errors, setErrors] = useState({})
  const location = useLocation()
  const textAreaRef = useRef(null)

  useEffect(() => {
    if (location?.state) {
      setTemplateData(location?.state)
    }
  }, [location?.state, setTemplateData])

  const validateForm = () => {
    const validationErrors = {}
    setErrors({})

    // Template name validation
    if (!templateData.template_name || templateData.template_name === false) {
      validationErrors.template_name = 'Template name is required'
    } else if (templateData.template_name.length > 50) {
      validationErrors.template_name = 'Template name should not exceed 50 characters'
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(templateData.template_name)) {
      validationErrors.template_name = 'Template name should not contain special characters except for -, _, and /'
    }

    // Message title validation
    if (!templateData.message_title || templateData.message_title === false) {
      validationErrors.message_title = 'Message title is required'
    } else if (templateData.message_title.length > 100) {
      validationErrors.message_title = 'Message title should not exceed 100 characters'
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(templateData.message_title)) {
      validationErrors.message_title = 'Message title should not contain special characters except for -, _, and /'
    }

    // Message content validation
    if (!templateData.message_content || templateData.message_content === false) {
      validationErrors.message_content = 'Message content is required'
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleBack = () => {
    if (location?.state?.templates_len) {
      navigate('/templates', {
        state: {
          template_name: '',
          message_title: '',
          message_content: '',
          previousPage: 'create-template',
        },
      })
    } else {
      navigate('/admin', {
        state: {
          template_name: '',
          message_title: '',
          message_content: '',
          previousPage: 'create-template',
        },
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        const response = await axios.post(`${BASE_URL}/api/v1/templates/`, {
          template_name: templateData.template_name,
          message_title: templateData.message_title,
          message_content: templateData.message_content,
        })

        console.log('Template saved:', response.data)
        navigate('/select-filter', {
          state: { ...templateData, previousPage: '/create-template', templates_len: location?.state?.templates_len },
        })
        setTemplateData({
          template_name: '',
          message_title: '',
          message_content: '',
        })
      } catch (error) {
        // setErrors({ unique_temp_name_error: error.response.data.detail })
        console.error('Error saving template:', error)
      }
    }
  }

  const handleAdd = (variable) => {
    const { message_content } = templateData
    const textArea = textAreaRef.current
    const cursorPosition = textArea.selectionStart // Get the cursor position

    // Ensure the regular expression is global by adding the 'g' flag
    const variablePattern = /\{\{.*?\}\}/g // Regex to find variables

    let newPosition = cursorPosition

    // Find all variables in the current message content
    const matches = [...message_content.matchAll(variablePattern)]

    // Check if the cursor is within a variable
    for (const match of matches) {
      if (cursorPosition >= match.index && cursorPosition <= match.index + match[0].length) {
        newPosition = match.index + match[0].length // Set to the end of the current variable
        break
      }
    }

    // Insert the new variable at the correct position
    const newContent = `${message_content.slice(0, newPosition)} {{${variable}}} ${message_content.slice(newPosition)}`

    setTemplateData({ ...templateData, message_content: newContent })
  }

  const handleBackspace = (e) => {
    const { message_content } = templateData
    const caretPosition = e.target.selectionStart

    if (e.key === 'Backspace') {
      const textBeforeCursor = message_content.slice(0, caretPosition)
      const lastTwoChars = textBeforeCursor.slice(-2)

      if (lastTwoChars === '}}') {
        // If the user is deleting the closing braces of a variable
        const startOfVariable = textBeforeCursor.lastIndexOf('{{')
        const newContent = message_content.slice(0, startOfVariable) + message_content.slice(caretPosition)
        setTemplateData({ ...templateData, message_content: newContent })
      }
    }
  }

  const variables = ['username', 'email', 'role']

  return (
    <div className="h-screen w-full font-poppins">
      <Header />

      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Create Template</h1>
      </div>
      <div className="flex w-full">
        <div className="flex justify-between items-start px-4 gap-10 w-full">
          <div className="inputs w-3/4">
            <h2 className="font-semibold uppercase text-secondary mx-1">Enter Template Details</h2>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <label htmlFor="temp_name">
                Enter Template Name:
                {errors.template_name && <span className="text-red-500 font-medium m-0"> ({errors.template_name})</span>}
                {errors.unique_temp_name_error && <span className="text-red-500 font-medium m-0"> ({errors.unique_temp_name_error})</span>}
              </label>
              <input
                type="text"
                id="temp_name"
                value={templateData.template_name}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    template_name: e.target.value,
                  })
                }
                className={`border-accent border-2 border-solid rounded-[8px] p-2  font-medium  font-poppins
                  ${errors.template_name ? 'border-red-500' : 'border-accent'}`}
              />
              <label htmlFor="msg_title">Enter Message Title: {errors.message_title && <span className="text-red-500 font-medium m-0">({errors.message_title})</span>}</label>
              <input
                type="text"
                id="msg_title"
                value={templateData.message_title}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    message_title: e.target.value,
                  })
                }
                className={`border-accent border-2 border-solid rounded-[8px] p-2 font-medium font-poppins
                  ${errors.message_title ? 'border-red-500' : 'border-accent'}`}
              />

              <label htmlFor="msg_content">Enter Message Content: {errors.message_content && <span className="text-red-500 font-medium m-0">({errors.message_content})</span>}</label>
              <textarea
                id="msg_content"
                rows="10"
                ref={textAreaRef}
                value={templateData.message_content}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    message_content: e.target.value,
                  })
                }
                onKeyDown={handleBackspace}
                className={`border-accent border-2 border-solid rounded-[8px] p-2 font-poppins font-medium
                  ${errors.message_content ? 'border-red-500' : 'border-accent'}`}
              />

              <div className="flex gap-3 mt-3">
                <button type="submit" className="bg-secondary text-white rounded-[8px] text-[16px] p-3 font-poppins font-medium cursor-pointer flex gap-2 items-center">
                  Save Template <FilePlus2 size="18px" />
                </button>
                <button
                  onClick={handleBack}
                  className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3  font-medium font-poppins hover:cursor-pointer">
                  Back <ArrowBigLeft size="18px" />
                </button>
              </div>
            </form>
          </div>
          <div className="variables w-1/4">
            <h2 className="font-semibold uppercase text-secondary mx-1">Add Variables</h2>
            <p className="text-base">
              To add variables click on <span className="font-bold text-secondary">+</span> button
            </p>
            <div className="flex flex-col justify-between">
              {variables.map((vars, index) => (
                <div key={index} className="flex flex-col w-3/4 px-2">
                  <div className="flex items-center justify-between h-10">
                    <p className="font-medium font-poppins">{vars}</p>
                    <button onClick={() => handleAdd(vars)} className="rounded-full cursor-pointer text-secondary font-bold flex items-center justify-center bg-transparent">
                      <CirclePlus size="20px" />
                    </button>
                  </div>
                  <hr className="w-full border-1 border-solid border-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateTemplate

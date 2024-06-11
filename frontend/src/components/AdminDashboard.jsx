import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Header from './Header'
import Sidebar from './Sidebar'
import { LayoutPanelTop, MessageSquareShare, Send, TrendingUp } from 'lucide-react'

const AdminDashboard = () => {
  const BASE_URL = import.meta.env.VITE_URL.startsWith('http://') ? import.meta.env.VITE_URL.replace('http://', 'https://') : import.meta.env.VITE_URL

  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [validationLoading, setValidationLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/templates/`, {
          params: { limit: 5 },
        })
        const data = Array.isArray(response.data) ? response.data : []
        console.log('API Response:', data) // Debugging line
        setTemplates(data)
      } catch (error) {
        console.error('Error fetching templates:', error)
        setError('No Templates Found')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [BASE_URL])

  useEffect(() => {
    const validateData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/validate/`)
        setValidationResult(response.data)
      } catch (error) {
        console.error('Error validating data:', error)
        setValidationResult(false)
      } finally {
        setValidationLoading(false)
      }
    }

    validateData()
  }, [BASE_URL])

  const onSendMessageClick = () => {
    if (templates.length == 0) {
      navigate('/create-template', {
        state: {
          template_name: '',
          message_title: '',
          message_content: '',
          selected_branch: '',
          previousPage: '/admin', // Set the previous page
        },
      })
    } else {
      navigate('/templates')
    }
  }

  const onViewMessageClick = () => {
    navigate('/sent-messages')
  }

  const onTemplateUseClick = (templateData) => {
    navigate(`/template/${templateData.template_id}`, {
      state: { ...templateData, previousPage: '/admin' }, // Set the previous page and pass the template data
    })
  }

  const handleUploadLinkClick = () => {
    navigate('/upload')
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Admin Dashboard</h1>
        <Sidebar />
      </div>
      {/* Stats and Template Start */}
      <div className="flex w-full">
        {/* Stats Start */}
        <div className="flex flex-col px-4 w-1/2 h-full">
          <h2 className="font-semibold uppercase text-secondary flex gap-2 items-center">
            This Weeks Statistics <TrendingUp size="24px" />
          </h2>
          <div className="flex w-full gap-5 justify-between">
            <div className="w-3/4 bg-primary rounded-[8px]"></div>
            <div className="flex flex-col w-1/4 gap-5 text-white font-medium justify-between">
              <div className="bg-primary h-1/2 rounded-[8px] text-start px-4">
                <p>Messages Read</p>
                <h3 className="font-bold text-29xl m-0">73.3%</h3>
              </div>
              <div className="bg-primary h-1/2 rounded-[8px] text-start px-4">
                <p>Accounts Reached</p>
                <h3 className="font-bold text-29xl m-0">1.7k</h3>
              </div>
            </div>
          </div>
        </div>
        {/* Stats End */}

        {/* Template Start */}
        <div className="flex flex-col px-4 w-1/2 h-full">
          <h2 className="font-semibold uppercase text-secondary flex gap-2 items-center">
            Frequently Used Templates <LayoutPanelTop size="24px" />
          </h2>
          <div className="flex">
            <div className="rounded-[8px] w-full">
              {loading ? (
                <p className="m-0 font-medium">
                  Loading templates<span className="animate-pulse">...</span>
                </p>
              ) : error ? (
                <p className="m-0 font-medium">{error}</p>
              ) : templates.length === 0 ? (
                <p className="m-0 font-medium">No templates found</p>
              ) : (
                templates?.map((template) => (
                  <div disabled={!validationResult} key={template.template_id} className="flex items-center justify-between text-white px-4 bg-primary mb-2 rounded-[8px] disabled:cursor-not-allowed">
                    <p>{template.template_name}</p>
                    <a
                      disabled={!validationResult}
                      className="text-secondary cursor-pointer font-medium underline underline-offset-2 disabled:cursor-not-allowed"
                      onClick={() => onTemplateUseClick(template)}>
                      Use Template
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex p-4 gap-3">
        <button
          disabled={!validationResult}
          className="bg-secondary flex gap-2 items-center text-white rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer disabled:cursor-not-allowed"
          onClick={onSendMessageClick}>
          Send Message <Send size="18px" />
        </button>
        <button
          disabled={!validationResult}
          className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer disabled:cursor-not-allowed"
          onClick={onViewMessageClick}>
          View Messages <MessageSquareShare size="18px" />
        </button>
      </div>
      {!validationLoading && !validationResult && (
        <div className="px-4">
          <p className="font-medium">
            <span onClick={handleUploadLinkClick} className="text-primary underline hover:cursor-pointer">
              Click Here
            </span>{' '}
            to Upload Data to be able to Send Messages...
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

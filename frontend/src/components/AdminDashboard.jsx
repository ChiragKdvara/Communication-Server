import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Header from './Header'
import Sidebar from './Sidebar'
import { LayoutPanelTop, MessageSquareShare, Send, TrendingUp } from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/templates/', {
          params: { limit: 5 },
        })
        setTemplates(response.data)
      } catch (error) {
        console.error('Error fetching templates:', error)
        setError('Failed to fetch templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const onCreateTemplateClick = () => {
    navigate('/create-template', {
      state: {
        template_name: '',
        message_title: '',
        message_content: '',
        selected_branch: '',
        previousPage: '/admin', // Set the previous page
      },
    })
  }

  const onViewMessageClick = () => {
    navigate('/sent-messages')
  }

  const onTemplateUseClick = (templateData) => {
    navigate('/select-filter', {
      state: { ...templateData, previousPage: '/admin' }, // Set the previous page
    })
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
              {/* Display Templates Start */}
              {loading ? (
                <p className="m-0 font-medium">
                  Loading templates<span className="animate-pulse">...</span>
                </p>
              ) : error ? (
                <p className="m-0 font-medium">{error}</p>
              ) : templates.length === 0 ? (
                <p className="m-0 font-medium">No templates found</p>
              ) : (
                templates.map((template) => (
                  <div key={template.template_id} className="flex items-center justify-between text-white px-4 bg-primary mb-2 rounded-[8px]">
                    <p>{template.template_name}</p>
                    <a className="text-secondary cursor-pointer font-medium underline underline-offset-2" onClick={() => onTemplateUseClick(template)}>
                      Use Template
                    </a>
                  </div>
                ))
              )}
              {/* Display Templates End */}
            </div>
          </div>
        </div>
        {/* Template End */}
      </div>
      {/* Stats and Template End */}

      {/* Actions Start */}
      <div className="flex p-4 gap-3">
        <button className="bg-secondary flex gap-2 items-center text-white rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer" onClick={onCreateTemplateClick}>
          Send Message <Send size="18px" />
        </button>
        <button
          className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer"
          onClick={onViewMessageClick}>
          View Messages <MessageSquareShare size="18px" />
        </button>
      </div>
      {/* Actions End */}
    </div>
  )
}

export default AdminDashboard

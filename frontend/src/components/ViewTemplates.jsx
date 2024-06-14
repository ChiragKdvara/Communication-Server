import { ArrowBigLeft, BookTemplate, SlidersHorizontal } from 'lucide-react'
import Header from './Header'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ViewTemplates = () => {
  const BASE_URL = import.meta.env.VITE_URL
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const templatesPerPage = 6 // Set the number of templates to display per page

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/templates/`)
        setTemplates(response.data)
        setTotalPages(Math.ceil(response.data.length / templatesPerPage))
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [BASE_URL, currentPage])

  const handleBack = () => {
    navigate('/admin')
  }

  const onNewTemplateClick = () => {
    navigate('/create-template', {
      state: {
        template_name: '',
        message_title: '',
        message_content: '',
        selected_branch: '',
        templates_len: templates.length,
      },
    })
  }

  const onTemplateUseClick = (templateData) => {
    navigate(`/template/${templateData.template_id}`, {
      state: { ...templateData, previousPage: '/templates', templates_len: templates.length }, // Set the previous page and pass the template data
    })
  }

  const indexOfLastTemplate = currentPage * templatesPerPage
  const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage
  const currentTemplates = templates?.slice(indexOfFirstTemplate, indexOfLastTemplate)

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      {/* Header */}
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Templates</h1>
      </div>
      {/* Search */}
      <div className="flex">
        <div className="flex flex-col px-4 mt-4 w-1/2 h-full">
          <div className="mb-2">
            <label htmlFor="search_filter" className="font-medium">
              Template Name
            </label>
            <div className="flex w-full justify-between gap-2">
              <input type="search" name="search_filter" id="search_filter" className="w-full font-poppins border-2 border-accent rounded-[8px] p-2 my-2" placeholder="Search for a Template" />
              <button className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-2 my-2 font-medium font-poppins hover:cursor-pointer">
                Filter <SlidersHorizontal size="18px" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full mb-8 font-medium">
            <div className="flex justify-between items-center border-accent border-2 border-solid text-black rounded-[8px] p-3">
              <p className="m-0 q-1/2 px-1">Template Name</p>
              <p className="m-0">Action</p>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : currentTemplates?.length === 0 ? (
              <p className="font-medium px-2 text-xl mt-1">No Templates Found</p>
            ) : (
              currentTemplates?.map((template) => (
                <div key={template.template_id} className="flex justify-between items-center bg-primary text-white rounded-[8px] p-3">
                  <p className="m-0 w-1/3 truncate">{template.template_name}</p>
                  <a className="text-white cursor-pointer font-medium underline underline-offset-2 disabled:cursor-not-allowed" onClick={() => onTemplateUseClick(template)}>
                    Use Template
                  </a>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-center mt-4">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] px-2 py-1 font-medium font-poppins hover:cursor-pointer">
              Prev
            </button>
            <span className="mx-4">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] px-2 py-1 font-medium font-poppins hover:cursor-pointer">
              Next
            </button>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              className="bg-secondary flex gap-2 items-center text-white rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer disabled:cursor-not-allowed"
              onClick={onNewTemplateClick}>
              New Template <BookTemplate size="18px" />
            </button>
            <button
              onClick={handleBack}
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer">
              Back <ArrowBigLeft size="18px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewTemplates

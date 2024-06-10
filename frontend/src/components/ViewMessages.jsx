import { ArrowBigLeft, SlidersHorizontal } from 'lucide-react'
import Header from './Header'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ViewMessages = () => {
  const BASE_URL = import.meta.env.VITE_URL
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const messagesPerPage = 6 // Set the number of messages to display per page

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/viewMessages/`)
        setMessages(response.data.messages)
        setTotalPages(Math.ceil(response.data.messages.length / messagesPerPage))
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [BASE_URL, currentPage])

  const handleBack = () => {
    navigate('/admin')
  }

  const handleViewClick = (id) => {
    navigate(`/sent-messages/${id}`)
  }

  const indexOfLastMessage = currentPage * messagesPerPage
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage
  const currentMessages = messages.slice(indexOfFirstMessage, indexOfLastMessage)

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      {/* Header */}
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Sent Messages</h1>
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
          <div className="flex flex-col gap-2 w-full mb-8">
            <div className="flex justify-between items-center bg-secondary text-white rounded-[8px] p-3">
              <p className="m-0 q-1/2 px-1">Template Name</p>
              <p className="m-0">Sent Time</p>
              <p className="m-0">Action</p>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : currentMessages?.length === 0 ? (
              <p className="font-medium px-2 text-xl mt-1">No Messages Found</p>
            ) : (
              currentMessages?.map((message) => (
                <div key={message.reference_id} className="flex justify-between items-center bg-primary text-white rounded-[8px] p-3">
                  <p className="m-0 w-1/3 truncate">{message.template_name}</p>
                  <div className="w-1/2 flex justify-between items-center">
                    <p className="m-0">{message.sent_time}</p>
                    <a className="text-secondary cursor-pointer font-medium underline underline-offset-2" onClick={() => handleViewClick(message.reference_id)}>
                      View Message
                    </a>
                  </div>
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
          <div>
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

export default ViewMessages

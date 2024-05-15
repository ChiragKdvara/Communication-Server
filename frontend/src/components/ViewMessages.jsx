import { ArrowBigLeft, SlidersHorizontal } from 'lucide-react'
import Header from './Header'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ViewMessages = () => {
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/v1/viewMessages/')
      .then((response) => {
        setMessages(response.data.messages)
      })
      .catch((error) => {
        console.error('Error fetching messages:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleBack = () => {
    navigate('/admin')
  }

  const handleViewClick = (id) => {
    navigate(`/sent-messages/${id}`)
  }

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
              <button className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-2 my-2  font-medium font-poppins hover:cursor-pointer">
                Filter <SlidersHorizontal size="18px" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full mb-8">
            <div className="flex justify-between bg-gray-200/50 rounded-[8px] p-3">
              <p className="m-0 q-1/2 px-1">Template Name</p>
              <div className="w-1/2 flex justify-between px-1">
                <p className="m-0">Sent Time</p>
                <p className="m-0">Action</p>
              </div>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : messages?.length == 0 ? (
              <p className="font-medium px-2 text-xl mt-1">No Messages Found</p>
            ) : (
              messages?.map((message) => (
                <div key={message.reference_id} className="flex justify-between items-center border-b-2 border-0 border-accent border-solid rounded-[8px] p-3">
                  <p className="m-0 w-1/3 truncate">{message.template_name}</p>
                  <div className="w-1/2 flex justify-between items-center">
                    <p className="m-0">{message.sent_time}</p>
                    <button className="bg-secondary text-white rounded-[8px] text-[16px] px-2 font-poppins hover:cursor-pointer" onClick={() => handleViewClick(message.reference_id)}>
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
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

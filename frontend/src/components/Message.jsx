import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

const Message = () => {
  const BASE_URL = import.meta.env.VITE_URL.startsWith('http://') ? import.meta.env.VITE_URL.replace('http://', 'https://') : import.meta.env.VITE_URL
  const { id } = useParams() // Get the message_id from the URL
  const [messageData, setMessageData] = useState(null) // State to hold the fetched data

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/users/messages/${id}`) // Fetch the data
        setMessageData(response.data) // Store the fetched data
      } catch (error) {
        console.error('Error fetching message data:', error) // Log any errors
      }
    }

    fetchReferenceData() // Fetch the data when the component is mounted
  }, [id, BASE_URL]) // Dependency on `message_id`

  if (!messageData) {
    return <div className="flex w-full h-screen items-center justify-center font-poppins font-bold text-10xl">Loading...</div> // Display loading message while fetching data
  }

  return (
    <div className="flex flex-col p-6 items-center justify-center">
      <h1 className="text-2xl font-bold">Message Details</h1>
      <div className="w-1/2 flex flex-col bg-slate-800 text-white py-6 px-4 rounded-lg">
        <div className="flex justify-between">
          <p>
            <span className="font-bold">Message Title:</span> {messageData.message_title}
          </p>
          <p className="text-base/6 text-slate-300">{messageData.sent_time}</p>
        </div>
        <hr className="w-full border-t-2 bg-white border-white" />
        <p>{messageData.message_content}</p>
      </div>
    </div>
  )
}

export default Message

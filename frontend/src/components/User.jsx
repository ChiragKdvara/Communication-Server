import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const User = () => {
  const BASE_URL = import.meta.env.VITE_URL
  const location = useLocation()
  const user_data = location.state
  const navigate = useNavigate()

  const [expMsgData, setExpMsgData] = useState([])

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/users?username=${user_data.username}`)
        let data = response.data.exp_messages
        console.log(data)
        setExpMsgData(data)
      } catch (error) {
        console.error('Error fetching reference data:', error)
      }
    }

    fetchReferenceData()
  }, [BASE_URL, user_data.username])

  const handleClick = (message_id) => {
    navigate(`/messages/${message_id}`) // Navigate to the new page with `message_id`
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Hey, {user_data.username}</h1>

      {expMsgData?.length > 0 ? (
        <div className="w-2/3">
          <h2 className="text-xl font-semibold">Messages:</h2>
          {expMsgData?.map((exp) => (
            <div key={exp.exp_message_id} onClick={() => handleClick(exp.id)}>
              <div className="flex justify-between bg-primary my-3 px-4 rounded-md cursor-pointer">
                <p>{exp.msg_title}</p>
                <p>{exp.sent_time}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No messages found.</p>
      )}
    </div>
  )
}

export default User

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const User = () => {
  const location = useLocation()
  const user_data = location.state
  const navigate = useNavigate()

  const [referenceData, setReferenceData] = useState([])

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/users/${user_data.user_id}`)
        let data = response.data.reference_data
        console.log(data)
        setReferenceData(data)
      } catch (error) {
        console.error('Error fetching reference data:', error)
      }
    }

    fetchReferenceData()
  }, [user_data.user_id])

  const handleClick = (message_id) => {
    navigate(`/messages/${message_id}`) // Navigate to the new page with `message_id`
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Hey, {user_data.username}</h1>

      {referenceData.length > 0 ? (
        <div className="w-2/3">
          <h2 className="text-xl font-semibold">Messages:</h2>
          {referenceData.map((ref) => (
            <div key={ref.exp_message_id} onClick={() => handleClick(ref.exp_message_id)}>
              <div className="flex justify-between bg-primary my-3 px-4 rounded-md cursor-pointer">
                <p>{ref.message_title}</p>
                <p>{ref.sent_time}</p>
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

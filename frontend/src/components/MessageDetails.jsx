// MessageDetails.js
import { useLocation, useNavigate } from 'react-router-dom'
import Header from './Header'

const MessageDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { id, title, content, reference_id } = location.state || {}

  if (!id || !title || !content || !reference_id) {
    return <div>Message Not Found</div>
  }

  const handleBack = () => {
    navigate(`/sent-messages/${reference_id}`)
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold truncate w-3/4">Title: {title}</h1>
      </div>
      <div className="px-4 py-6">
        <div className="flex flex-col border-accent border-2 border-solid px-4 py-4">
          <p className="font-semibold mb-2">Message Content:</p>
          <div className="h-56 overflow-y-auto">
            <p>{content}</p>
          </div>
        </div>
        <div className="flex justify-start mt-4">
          <button
            className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer"
            onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageDetails

// MessageDetails.js
import { useLocation } from 'react-router-dom'
import Header from './Header'

const MessageDetails = () => {
  const location = useLocation()
  const { id, title, content } = location.state || {}

  if (!id || !title || !content) {
    return <div>Message Not Found</div>
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold truncate w-3/4">Title: {title}</h1>
      </div>
      <div className="px-2">
        <div className="flex flex-col border-accent border-2 border-solid px-4 mt-4">
          <p className="font-semibold mb-2">Message Content:</p>
          <p>{content}</p>
        </div>
      </div>
    </div>
  )
}

export default MessageDetails

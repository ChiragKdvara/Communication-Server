import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Modal from 'react-modal'
import { useState } from 'react'
import Header from './Header'
import { ArrowBigLeft, CircleCheckBig, CircleX, Send } from 'lucide-react'

const Preview = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [isModalOpen, setIsModalOpen] = useState(false) // State to control modal visibility
  const [userCount, setUserCount] = useState(0) // State to hold the user count

  const handleBack = () => {
    // Navigate back to `SelectFilter`, passing the current state
    navigate('/select-filter', {
      state: {
        template_name: data.template_name,
        message_title: data.message_title,
        message_content: data.message_content,
        selected_branch: data.selected_branch, // Include the selected btm_lvl
      },
    })
  }

  const openModal = async () => {
    try {
      console.log(data)
      // Call API endpoint to get user count for the selected branch
      const response = await axios.get(`http://localhost:8000/api/v1/users/user_filter`, {
        params: {
          btm_lvl_name: data.selected_branch, // Pass branch name as query parameter
        },
      })

      setUserCount(response.data.users.length) // Set the user count
      setIsModalOpen(true) // Open the modal
    } catch (error) {
      console.error('Error fetching user count:', error) // Handle error
    }
  }

  const closeModal = () => {
    setIsModalOpen(false) // Close the modal
  }

  const sendMessage = async () => {
    try {
      if (userCount == 0) {
        alert('No Users for Selected Filter')
        closeModal()
        return
      } else {
        const response = await axios.post('http://localhost:8000/api/v1/expMessages/', {
          template_name: data.template_name,
          message_title: data.message_title,
          message_content: data.message_content,
          btm_lvl: data.selected_branch,
          user_count: userCount,
        })

        if (response.data.exp_message_count) {
          alert('Message Sent Successfully..')
          navigate('/admin', {
            state: {
              template_name: '',
              message_title: '',
              message_content: '',
              selected_branch: '', // Include the selected branch
            },
          })
        }
        setIsModalOpen(false) // Close the modal after successful operation
      }
    } catch (error) {
      console.error('Error creating template and exp_messages:', error)
    }
  }

  const languages = ['Kannada', 'Telugu', 'Marathi', 'Tamil', 'Malayalam']

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Preview</h1>
      </div>
      <div className="preview flex">
        {/* Message Start */}
        <div className="message border-solid border-2 border-primary w-3/4 mx-4 mt-4 rounded-[8px]">
          <div className="flex flex-col justify-between px-4">
            <div className="flex mt-4">
              <button className="font-poppins my-2 mr-2 border-2 border-solid bg-transparent font-medium border-secondary text-secondary rounded-[8px] cursor-pointer">English</button>
              {languages.map((lang, index) => {
                return (
                  <button className="p-2 font-poppins my-2 mx-2 border-2 border-accent bg-zinc-100 rounded-[8px] opacity-[0.3] cursor-not-allowed" key={index}>
                    {lang}
                  </button>
                )
              })}
            </div>
            <div className="rounded-md">
              <p>
                <span className="font-bold">Template Name:</span> {data.template_name}
              </p>
              <p>
                <span className="font-bold">Message Title:</span> {data.message_title}
              </p>
              <p>
                <span className="font-bold">Message Content:</span> {data.message_content}
              </p>
            </div>
          </div>
        </div>
        {/* Message End */}
        {/* Filter Preview Start */}
        <div className="px-4 rounded-md w-1/4">
          <p className="font-bold text-xl mb-2">Selected Filter:</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 opacity-30">
              <p className="font-medium m-0 text-lg">Region:</p>
              <button className="w-1/2 text-start m-0 border-2 border-accent font-bold font-poppins rounded-[8px] p-2">None</button>
            </div>
            <div className="flex flex-col gap-2 opacity-30">
              <p className="font-medium m-0">Zone:</p>
              <button className="w-1/2 text-start m-0 border-2 border-accent font-bold font-poppins rounded-[8px] p-2">None</button>
            </div>
            <div className="flex flex-col gap-2 opacity-30">
              <p className="font-medium m-0">Cluster:</p>
              <button className="w-1/2 text-start m-0 border-2 border-accent font-bold font-poppins rounded-[8px] p-2">None</button>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium m-0">Branch:</p>
              <button className="w-1/2 text-start m-0 border-secondary border-2 font-bold text-secondary bg-white font-poppins rounded-[8px] p-2">{data.selected_branch}</button>
            </div>
          </div>
        </div>
        {/* Filter Preview End */}
      </div>

      <div className="flex px-4 mt-4 gap-3">
        <button
          onClick={openModal} // Open the modal on click
          className="bg-secondary text-white rounded-[8px] text-[16px] p-3 font-poppins font-medium cursor-pointer flex gap-2 items-center">
          Send Message <Send size="18px" />
        </button>
        <button
          onClick={handleBack}
          className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3  font-medium font-poppins hover:cursor-pointer">
          Back <ArrowBigLeft size="18px" />
        </button>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Confirm Send" className="w-full h-screen flex flex-col items-center justify-center glass">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-bold font-poppins mb-1">Confirm Send</h2>
          <p className="font-poppins">You are about to send a message to {userCount} user(s). Are you sure you want to continue?</p>
          <div className="flex gap-3 mt-2">
            <button
              className="bg-secondary text-white rounded-[8px] text-[16px] p-3 font-poppins font-medium cursor-pointer flex gap-2 items-center"
              onClick={sendMessage} // Confirm sending message
            >
              Confirm <CircleCheckBig size="18px" />
            </button>
            <button
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3  font-medium font-poppins hover:cursor-pointer"
              onClick={closeModal} // Cancel and close the modal
            >
              Cancel <CircleX size="18px" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Preview

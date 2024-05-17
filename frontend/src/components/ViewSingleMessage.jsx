import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Header from './Header'
import { ArrowBigLeft, Search } from 'lucide-react'
import Fuse from 'fuse.js'

const ViewSingleMessage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [referenceDetails, setReferenceDetails] = useState(null)
  const [userIds, setUserIds] = useState([])
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const [selectedLanguage, setSelectedLanguage] = useState('English')

  const languages = ['English', 'Kannada', 'Telugu', 'Marathi', 'Tamil', 'Malayalam']

  const handleChange = (event) => {
    setSelectedLanguage(event.target.value)
  }

  // Accordian toggle
  const [isOpen, setIsOpen] = useState(false)

  const toggleAccordion = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const fetchReferenceDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/viewMessages/${id}`)
        setReferenceDetails(response.data[0].reference_data)
        setUserIds(response.data[1].users.join(',')) // Join user IDs into a comma-separated string
      } catch (error) {
        console.error('Error fetching reference details:', error)
      }
    }
    fetchReferenceDetails()
  }, [id])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/users/user-search/', {
          params: { user_ids: userIds, reference_id: id }, // Pass userIds as a string
        })
        setUsers(response.data)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    if (userIds.length > 0) {
      fetchUsers()
    }
  }, [id, userIds])

  const handleSearch = () => {
    setSearching(true)
    setSearchPerformed(true)
    if (searchTerm === '') {
      setFilteredUsers([])
      setSearching(false)
    } else {
      const fuse = new Fuse(users, {
        keys: ['username'],
      })
      const result = fuse.search(searchTerm)
      setFilteredUsers(result.map(({ item }) => item))
      setSearching(false)
    }
  }

  const handleUserViewMessage = (id, title, content) => {
    navigate(`/message-details/${id}`, { state: { id, title, content } })
  }

  const handleBack = () => {
    navigate('/sent-messages')
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      {/* Header */}
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold truncate w-1/2">{referenceDetails ? referenceDetails.template_name : 'Loading...'}</h1>
      </div>
      {/* Selected Filter Start */}
      <div className="px-4 rounded-md">
        <div className="flex w-full gap-6">
          <div className="w-1/2">
            <p className="font-bold text-xl mb-2">Selected Filter:</p>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-full opacity-30">
                <button className="text-start m-0 border-2 border-accent font-poppins rounded-[8px] p-2">
                  Region: <span className="font-bold">None</span>
                </button>
              </div>
              <div className="flex flex-col gap-2 w-full opacity-30">
                <button className="text-start m-0 border-2 border-accent font-poppins rounded-[8px] p-2">
                  Zone: <span className="font-bold">None</span>
                </button>
              </div>
              <div className="flex flex-col gap-2 w-full opacity-30">
                <button className="text-start m-0 border-2 border-accent font-poppins rounded-[8px] p-2">
                  Cluster: <span className="font-bold">None</span>
                </button>
              </div>
              <div className="flex flex-col w-full gap-2">
                <button className="text-start m-0 border-secondary border-2 text-secondary bg-white font-poppins rounded-[8px] p-2 truncate">
                  Branch: <span className="font-bold">{referenceDetails ? referenceDetails.btm_lvl : 'Loading...'}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <p className="font-bold text-xl mb-2">Message Statistics:</p>
            <div className="flex gap-4 items-center justify-between w-full">
              <div className="flex flex-col gap-2 w-1/3">
                <p className="text-start m-0 bg-primary flex items-center justify-between text-[14px] font-bold text-white font-poppins rounded-[8px] p-2">
                  <span className="font-medium">View Percentage</span> <span>66%</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <p className="text-start m-0 bg-primary flex items-center justify-between text-[14px] font-bold text-white font-poppins rounded-[8px] p-2">
                  <span className="font-medium">Languages Translated</span> <span>{languages.length}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <p className="text-start m-0 bg-primary flex items-center justify-between text-[14px] font-bold text-white font-poppins rounded-[8px] p-2">
                  <span className="font-medium">User Count</span> <span>{referenceDetails ? referenceDetails.user_count : 'Loading...'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Selected Filter End */}
      {/* Message Details Start */}
      <div className="mb-2 px-4">
        <div
          className={`border-primary border-solid border-2 flex justify-between items-center px-4 mt-4 rounded-tr-[8px] rounded-tl-[8px] ${
            isOpen ? ' border-b-0' : 'rounded-br-[8px] rounded-bl-[8px]'
          } cursor-pointer`}
          onClick={toggleAccordion}>
          <h2 className="text-lg font-semibold">Title: {referenceDetails ? referenceDetails.message_title : 'Loading...'}</h2>
          <svg className={`h-6 w-6 ${isOpen ? 'transform rotate-[-180]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        </div>
        {isOpen && (
          <div
            className={`flex items-start justify-between px-4 m-0 border-primary border-solid border-2 rounded-br-[8px] rounded-bl-[8px]
          ${isOpen ? ' border-t-0' : ''}
          `}>
            <p className="mt-0 w-3/4">{referenceDetails ? referenceDetails.message_content : 'Loading...'}</p>
            <div className="flex flex-col gap-2">
              <label htmlFor="languages" className="font-medium">
                Language:
              </label>
              <select disabled id="languages" value={selectedLanguage} onChange={handleChange} className="select select-bordered font-poppins w-48 border-2 border-accent rounded-[8px] p-2">
                {languages.map((language, index) => (
                  <option key={index} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      {/* Message Details End */}
      {/* Search Start */}
      <div className="flex items-start justify-between px-4 mb-2">
        <div className="w-1/2 my-1">
          <div className="mb-2">
            <label htmlFor="search_filter" className="font-medium">
              Username
            </label>
            <div className="flex w-full justify-between gap-2">
              <input
                type="search"
                name="search_filter"
                id="search_filter"
                className="w-full font-poppins border-2 border-accent rounded-[8px] p-2 my-2"
                placeholder="Search for a User"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="w-fit flex items-center justify-between font-medium font-poppins  gap-2 p-2 my-2 bg-transparent border-accent border-solid border-2 rounded-[8px] hover:cursor-pointer"
                onClick={handleSearch}>
                Search <Search size="16px" />
              </button>
            </div>
            {/* User Print */}
            <div className="w-full">
              {searchPerformed && !searching && filteredUsers.length === 0 && <p>No users found</p>}
              {!searching &&
                filteredUsers.map((user) => (
                  <div key={user.exp_message_id} className="flex items-center justify-between">
                    <div className="w-full flex items-center justify-between">
                      <p>
                        {user.username} ({user.read_status})
                      </p>
                      <p className="btn-link text-secondary font-medium font-poppins hover:cursor-pointer" onClick={() => handleUserViewMessage(user.exp_message_id, user.msg_title, user.msg_content)}>
                        View Message
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {/* Search End */}
      <div className="px-4">
        <button onClick={handleBack} className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer">
          Back <ArrowBigLeft size="18px" />
        </button>
      </div>
    </div>
  )
}

export default ViewSingleMessage

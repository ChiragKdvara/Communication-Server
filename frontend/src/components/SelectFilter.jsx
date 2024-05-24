import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTemplate } from './TemplateContext'
import Header from './Header'
import { ArrowBigLeft, ChevronDown, Sparkles } from 'lucide-react'
import axios from 'axios'

const SelectFilter = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTemplateData } = useTemplate()

  // Retrieve the state passed through `navigate`
  const passedState = location.state

  const [selectedBranch, setSelectedBranch] = useState(passedState?.selected_branch || '') // Initialize with passed branch
  const [apiResponse, setApiResponse] = useState({})

  useEffect(() => {
    if (passedState) {
      // Set context state with the passed data
      setTemplateData(passedState)
    }
  }, [passedState, setTemplateData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/hierarchy/lvl-values')
        setApiResponse(response.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Set the previous page from where the user navigated
    if (location.state?.previousPage) {
      // setPreviousPage(location.state.previousPage)
    }
  }, [location.state])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (selectedBranch === '') {
      alert('Please select a branch.')
      return
    }

    // Navigate to the confirmation page with the selected branch and template data
    navigate('/confirmation', {
      state: {
        ...passedState,
        selected_branch: selectedBranch,
        previousPage: '/select-filter', // Set the current page as the previous page
      },
    })
  }

  const handleBack = () => {
    // Navigate back to the previous page dynamically
    navigate(location?.state?.previousPage, {
      state: {
        template_name: passedState?.template_name,
        message_title: passedState?.message_title,
        message_content: passedState?.message_content,
        previousPage: location?.state?.previousPage, // Set the current page as the previous page
      },
    })
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />

      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Select Filter</h1>
      </div>

      <div className="flex w-full">
        {/* Modify Existing Start*/}
        <div className="flex flex-col px-4 w-1/2 h-full opacity-30">
          <h2 className="font-semibold uppercase text-secondary mb-1">Modify a Filter</h2>
          <label htmlFor="search_filter" className="font-medium">
            Filter Name
          </label>
          <input type="search" name="search_filter" id="search_filter" className="font-poppins border-2 border-accent rounded-[8px] p-2 my-2" placeholder="Search for a Filter" />
          <div className="flex flex-col gap-2">
            {/* Sample Filters Start */}
            <div className="flex justify-between items-center border-2 border-accent rounded-[8px] bg-gray-400/25 px-2">
              <p>Sample Filter</p>
              <ChevronDown />
            </div>
            <div className="flex justify-between items-center border-2 border-accent rounded-[8px] bg-gray-400/25 px-2">
              <p>Sample Filter</p>
              <ChevronDown />
            </div>
            <div className="flex justify-between items-center border-2 border-accent rounded-[8px] bg-gray-400/25 px-2">
              <p>Sample Filter</p>
              <ChevronDown />
            </div>
            <div className="flex justify-between items-center border-2 border-accent rounded-[8px] bg-gray-400/25 px-2">
              <p>Sample Filter</p>
              <ChevronDown />
            </div>
            <div className="flex justify-between items-center border-2 border-accent rounded-[8px] bg-gray-400/25 px-2">
              <p>Sample Filter</p>
              <ChevronDown />
            </div>
            {/* Sample Filters End */}
          </div>
        </div>
        {/* Modify Existing End*/}

        {/* Create Template Start*/}
        <div className="flex flex-col px-4 w-1/2 h-full">
          <h2 className="font-semibold uppercase text-secondary">Create New Filter</h2>
          <label htmlFor="search_filter" className="font-medium">
            Filter Name <span className="text-red-500">*</span>
          </label>
          <input
            type="search"
            name="search_filter"
            id="search_filter"
            className="input input-bordered input-md font-poppins border-2 border-accent rounded-[8px] p-2 my-2 w-1/2"
            placeholder="Enter Filter Name"
            disabled
          />

          <div className="flex flex-col items-start mt-2">
            <form className="flex flex-col" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(apiResponse).map((level, index) => (
                  <div key={level} className={`${level} flex justify-between gap-4`}>
                    <label htmlFor={`${level}_select`} className="mt-2">
                      Select a {level.charAt(4).toUpperCase() + level.slice(5)}:
                    </label>
                    <select
                      id={`${level}_select`}
                      className="select select-bordered font-poppins w-48 border-2 border-accent rounded-[8px] p-2"
                      disabled={index !== Object.keys(apiResponse).length - 1} // Disable if not the last level
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value)
                      }}>
                      <option value="">-- Select --</option>
                      {apiResponse[level].map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="bg-secondary text-white rounded-[8px] text-[16px] p-3 font-poppins font-medium cursor-pointer flex gap-2 items-center">
                  Create Filter <Sparkles size="18px" />
                </button>
                <button
                  onClick={handleBack}
                  className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer">
                  Back <ArrowBigLeft size="18px" />
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Create Filter End*/}
      </div>
    </div>
  )
}

export default SelectFilter

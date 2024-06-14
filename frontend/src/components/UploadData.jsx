import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import axios from 'axios'

const Upload = () => {
  const BASE_URL = import.meta.env.VITE_URL
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadStep, setUploadStep] = useState(1) // 1 for branch upload, 2 for user upload
  const [isUploading, setIsUploading] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false) // New state for loading screen

  const handleBack = () => {
    navigate('/admin')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    const fileExtension = file.name.split('.').pop().toLowerCase()

    if (file.size === 0) {
      setUploadStatus('Error: File is empty. Please select a non-empty file.')
      setSelectedFile(null)
      setSelectedFileName(null)
    } else if (fileExtension === 'json') {
      setSelectedFile(file)
      setSelectedFileName(file.name)
    } else {
      setUploadStatus('Error: Wrong File Format. Accepted format is .json')
      setSelectedFile(null)
      setSelectedFileName(null)
    }
  }

  const downloadHierarchyDataStructure = () => {
    const branchData = {
      hierarchy: ['Region', 'Zone', 'Cluster', 'Branch'],
      data: [
        {
          region: '',
          zone: '',
          cluster: '',
          branch: '',
        },
      ],
    }

    const jsonString = JSON.stringify(branchData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hierarchy-data-structure.json'
    link.click()
  }

  const downloadUserDataStructure = () => {
    const userData = {
      users: [
        {
          username: '',
          email: '',
          role: '',
          btm_lvl_id: 1,
        },
      ],
    }

    const jsonString = JSON.stringify(userData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'user-data-structure.json'
    link.click()
  }

  const validateStructure = (jsonData, uploadStep) => {
    if (uploadStep === 1) {
      // Validate the structure for branch data
      const hasHierarchy = Array.isArray(jsonData.hierarchy) && jsonData.hierarchy.every((item) => typeof item === 'string')
      const hasData =
        Array.isArray(jsonData.data) &&
        jsonData.data.every((item) => typeof item.region === 'string' && typeof item.zone === 'string' && typeof item.cluster === 'string' && typeof item.branch === 'string')

      return hasHierarchy && hasData
    } else if (uploadStep === 2) {
      // Validate the structure for user data
      const hasUsers =
        Array.isArray(jsonData.users) &&
        jsonData.users.every((user) => typeof user.username === 'string' && typeof user.email === 'string' && typeof user.role === 'string' && typeof user.btm_lvl_id === 'number')

      return hasUsers
    }

    return false // Invalid uploadStep
  }

  const checkForNullOrEmpty = (jsonData, uploadStep) => {
    if (uploadStep === 1) {
      // Check for null or empty values in branch data
      const { data } = jsonData
      for (const item of data) {
        if (Object.values(item).some((value) => value === null || value === '')) {
          return true // Found null or empty value
        }
      }
    } else if (uploadStep === 2) {
      // Check for null or empty values in user data
      const { users } = jsonData
      for (const user of users) {
        if (Object.values(user).some((value) => value === null || value === '')) {
          return true // Found null or empty value
        }
      }
    }

    return false // No null or empty values found
  }

  const uploadData = async () => {
    if (selectedFile) {
      setShowLoadingScreen(true) // Set showLoadingScreen to true before starting the upload
      setIsUploading(true) // Set isUploading to true before starting the upload

      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target.result
          const jsonData = JSON.parse(content)

          // Validate the structure of the JSON data
          const isValidStructure = validateStructure(jsonData, uploadStep)
          if (!isValidStructure) {
            setUploadStatus('Error: Invalid file structure. Please check the file and try again.')
            return
          }

          // Validate for null or empty values
          const hasNullOrEmpty = checkForNullOrEmpty(jsonData, uploadStep)
          if (hasNullOrEmpty) {
            setUploadStatus('Error: File contains null or empty values. Please fix and try again.')
            return
          }

          // If the structure and values are valid, proceed with the upload
          let endpoint
          if (uploadStep === 1) {
            endpoint = `${BASE_URL}/api/v1/hierarchy/upload-hierarchy-data`
          } else if (uploadStep === 2) {
            endpoint = `${BASE_URL}/api/v1/users/add-users`
          }

          const response = await axios.post(endpoint, jsonData, {
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (uploadStep === 1) {
            setUploadStatus('Hierarchy data uploaded successfully.')
            setUploadStep(2) // Move to the next step (user upload)
          } else if (uploadStep === 2) {
            setUploadStatus(response.data.message)
            setUploadStep(1) // Reset to the initial step (branch upload)
          }

          console.log('Response:', response.data)
        } catch (error) {
          console.error('Error during upload:', error)
          setUploadStatus(`Error during upload., ${error?.response?.data?.message ? error?.response?.data?.message : error}`)
        } finally {
          setIsUploading(false) // Set isUploading to false after the upload completes
          setShowLoadingScreen(false) // Set showLoadingScreen to false after the upload completes
        }
      }

      reader.readAsText(selectedFile)
    } else {
      console.warn('No file selected.')
      setIsUploading(false) // Set isUploading to false if no file is selected
    }

    setSelectedFile(null)
    setSelectedFileName(null)
  }

  return (
    <div className="h-screen w-full font-poppins">
      {showLoadingScreen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-3xl font-bold text-white">Uploading Your File...</div>
        </div>
      )}
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Upload</h1>
      </div>
      <div className="flex h-[40rem]">
        <div className="w-1/2 p-20 h-full">
          <div className="border-2 border-dashed rounded-2xl border-gray-400 h-[20rem] flex flex-col items-center justify-center relative">
            <div className="absolute top-[-4rem] left-0 right-0 text-center">
              <p className="text-center text-3xl font-bold mb-4">{uploadStep === 1 ? 'Please Upload Hierarchy Data.' : 'Now you can Upload User Data'}</p>
            </div>
            {!selectedFileName && (
              <div className="flex flex-col items-center justify-center">
                <p className="text-center">Drag and drop your files here</p>
                <p className="text-center">or</p>
                <label className="bg-gray-200 text-gray-800 font-semibold rounded-md mx-40 px-4 py-2 w-[10rem] h-[3rem] flex items-center justify-center cursor-pointer">
                  <span>Browse Files</span>
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            )}
            {selectedFileName && (
              <div className="flex flex-col items-center gap-5 justify-center py-10">
                <p className="m-0 font-semibold">
                  Selected File: <span className="font-medium">{selectedFileName}</span>
                </p>
                <div className="flex justify-center">
                  <button className="bg-red-700 text-white rounded-[8px] text-[16px] p-2 font-medium font-poppins hover:cursor-pointer mr-2 px-4 py-2" onClick={uploadData}>
                    {uploadStep === 1 ? 'Upload Hierarchy Data' : 'Upload User Data'}
                  </button>
                </div>
              </div>
            )}
            {uploadStatus && <p className="text-lg font-bold mt-4 text-center absolute bottom-[-4rem] left-0 right-0">{uploadStatus}</p>}
            {isUploading && (
              <div className="absolute bottom-[-4rem] left-0right-0 text-center">
                <p className="text-lg font-bold">Uploading your files...</p>
              </div>
            )}
          </div>
          <div className="flex justify-start mt-20">
            <button
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer"
              onClick={handleBack}>
              Back
            </button>
          </div>
        </div>
        <div className="w-1 h-3/4 bg-primary mx-4 mt-20"></div>
        <div className="w-1/2 p-4 pl-[4rem] pt-[4rem]">
          <h2 className="text-md font-semibold mb-2">Instructions</h2>
          <h3 className="text-lg font-semibold mb-1">File Upload:</h3>
          <p>
            Click on the <span className="text-secondary font-bold">Upload</span> button or Drag and Drop the file to be uploaded.
          </p>
          <h3 className="text-lg font-semibold mb-1">Supported File Formats:</h3>
          <p>Ensure that the file you are uploading is of JSON format.</p>
          <h3 className="text-lg font-semibold mb-1">
            <a href="#" onClick={downloadHierarchyDataStructure} className="text-secondary font-bold">
              Download Hierarchy Structure
            </a>
          </h3>
          <h3 className="text-lg font-semibold mb-1">
            <a href="#" onClick={downloadUserDataStructure} className="text-secondary font-bold">
              Download User Structure
            </a>
          </h3>
          <p>Use the downloaded file structure as a reference to ensure that the file you are preparing for upload follows the same format and structure.</p>
        </div>
      </div>
    </div>
  )
}
export default Upload

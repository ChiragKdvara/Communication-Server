import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import { saveAs } from 'file-saver'
import axios from 'axios'

const Upload = () => {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadStep, setUploadStep] = useState(1) // 1 for branch upload, 2 for user upload

  const handleBack = () => {
    navigate('/admin')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    const fileExtension = file.name.split('.').pop().toLowerCase()

    if (fileExtension === 'json') {
      setSelectedFile(file)
      setSelectedFileName(file.name)
    } else {
      setUploadStatus('Error: Wrong File Format. Accepted formats is .json')
    }
  }

  const fileStructureData = 'Column1,Column2,Column3\nValue1,Value2,Value3'

  const handleDownloadFileStructure = () => {
    const blob = new Blob([fileStructureData], {
      type: 'text/csv;charset=utf-8',
    })
    saveAs(blob, 'file-structure.csv')
  }

  const uploadData = async () => {
    if (selectedFile) {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target.result
          const jsonData = JSON.parse(content)

          let endpoint
          if (uploadStep === 1) {
            endpoint = 'http://localhost:8000/api/v1/hierarchy/upload-branch-data'
          } else if (uploadStep === 2) {
            endpoint = 'http://localhost:8000/api/v1/users/add-users'
          }

          const response = await axios.post(endpoint, jsonData, {
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (uploadStep === 1) {
            setUploadStatus('Branch data uploaded successfully.')
            setUploadStep(2) // Move to the next step (user upload)
          } else if (uploadStep === 2) {
            setUploadStatus('User data uploaded successfully.')
            setUploadStep(1) // Reset to the initial step (branch upload)
          }

          console.log('Response:', response.data)
        } catch (error) {
          console.error('Error during upload:', error)
          setUploadStatus(`Error during upload., ${error?.response?.data?.detail}`)
        }
      }

      reader.readAsText(selectedFile)
    } else {
      console.warn('No file selected.')
    }

    setSelectedFile(null)
    setSelectedFileName(null)
  }

  return (
    <div className="h-screen w-full font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Upload</h1>
      </div>
      <div className="flex">
        <div className="w-1/2 px-4 my-4 h-full">
          <p className="text-3xl font-semibold mb-4">{uploadStep === 1 ? `Please Upload Hierarchy Data.` : `Now you can Upload User Data`}</p>
          <div className="border-2 border-dashed rounded-[8px] border-gray-400 flex flex-col items-center justify-center">
            {!selectedFileName && (
              <div className="flex flex-col items-center gap-5 justify-center py-10">
                <p className="m-0 font-semibold">Drag and drop your files here</p>
                <p className="m-0">or</p>
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
                    {uploadStep === 1 ? 'Upload Branch Data' : 'Upload User Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {uploadStatus && <p className="text-lg font-bold mt-4">{uploadStatus}</p>}
          <div className="flex justify-start mt-4">
            <button
              className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3 font-medium font-poppins hover:cursor-pointer"
              onClick={handleBack}>
              Back
            </button>
          </div>
        </div>
        {/* Divider */}
        <div className="w-1/2 p-4">
          <h2 className="text-md font-semibold mb-2">Instructions</h2>
          <h3 className="text-lg font-semibold mb-1">File Upload:</h3>
          <p>Click on the Browse Files button or Drag and Drop the file to be uploaded.</p>
          <h3 className="text-lg font-semibold mb-1">Supported File Formats:</h3>
          <p>Ensure that the file you are uploading is of JSON format.</p>
          <h3 className="text-lg font-semibold mb-1 text-secondary hover:cursor-pointer">
            <a onClick={handleDownloadFileStructure} className="underline">
              Download File Structure
            </a>
            <span className="text-red-500 no-underline"> *</span>
          </h3>
          <p> Use the downloaded file structure as a reference to ensure that the file you are preparing for upload follows the same format and structure. </p>
        </div>
      </div>
    </div>
  )
}

export default Upload

import { useState } from 'react'
import { FileTrigger, Button } from 'react-aria-components'
import axios from 'axios'

const UploadData = () => {
  const [branchFile, setBranchFile] = useState(null)
  const [branchUploadStatus, setBranchUploadStatus] = useState(null)
  const [userFiles, setUserFiles] = useState([])
  const [userUploadStatus, setUserUploadStatus] = useState(null)

  const handleBranchFileSelect = (fileArray) => {
    setBranchFile(fileArray[0]) // Store the actual branch file object
  }

  const handleUserFileSelect = (fileArray) => {
    setUserFiles(fileArray) // Store the actual user file objects
  }

  const uploadBranchFile = async (e) => {
    e.preventDefault()

    if (branchFile) {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target.result // File content as text
          const jsonData = JSON.parse(content) // Parse JSON content
          console.log(jsonData)

          // Send POST request to the specified branch endpoint
          const response = await axios.post(
            'http://localhost:8000/api/v1/hierarchy/upload-branch-data', // Branch endpoint
            jsonData,
            {
              headers: {
                'Content-Type': 'application/json', // Ensure correct content type
              },
            }
          )

          setBranchUploadStatus('Branch data uploaded successfully.')
          console.log('Response:', response.data)
        } catch (error) {
          console.error('Error during branch upload:', error)
          setBranchUploadStatus('Error during branch upload.')
        }
      }

      reader.readAsText(branchFile) // Read the branch file as text
    } else {
      console.warn('No branch file selected.')
    }

    setBranchFile(null) // Clear the branch file state
  }

  const uploadUserFiles = async (e) => {
    e.preventDefault()

    if (userFiles.length > 0) {
      const userFile = userFiles[0] // First user file in the array
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target.result // File content as text
          const jsonData = JSON.parse(content) // Parse JSON content

          // Send POST request to the specified user endpoint
          const response = await axios.post(
            'http://localhost:8000/api/v1/users/add-users', // User endpoint
            jsonData,
            {
              headers: {
                'Content-Type': 'application/json', // Ensure correct content type
              },
            }
          )

          setUserUploadStatus('User data uploaded successfully.')
          console.log('Response:', response.data)
        } catch (error) {
          console.error('Error during user upload:', error)
          setUserUploadStatus(`Error during user upload., ${error?.response?.data?.detail}`)
        }
      }

      reader.readAsText(userFile) // Read the user file as text
    } else {
      console.warn('No user file selected.')
    }

    setUserFiles([]) // Clear the user file state
  }

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold font-space">Upload Branch and User Data</h1>
      {!branchUploadStatus && (
        <form className="text-center" onSubmit={uploadBranchFile}>
          <FileTrigger
            acceptedFileTypes={['application/json']}
            onSelect={(event) => {
              const fileArray = Array.from(event) // Ensure it's an array
              handleBranchFileSelect(fileArray)
            }}>
            <Button className="border-accent border-2 p-5 rounded-lg font-poppins font-medium text-lg">Select Branch Data</Button>
            {branchFile && (
              <>
                <p className="m-2">{branchFile.name}</p>
                <button type="submit" className="p-2 rounded-[8px] font-poppins font-medium">
                  Submit
                </button>
              </>
            )}
          </FileTrigger>
        </form>
      )}
      {branchUploadStatus && (
        <div className="text-center">
          <p className="text-lg font-bold mt-4">{branchUploadStatus}</p>
          <p>Now, please upload user data:</p>
          <form onSubmit={uploadUserFiles}>
            <FileTrigger
              acceptedFileTypes={['application/json']}
              onSelect={(event) => {
                const fileArray = Array.from(event)
                handleUserFileSelect(fileArray)
              }}>
              <Button className="border-accent border-2 p-5 rounded-lg font-poppins font-medium text-lg">Select User Data</Button>
              {userFiles.length > 0 && (
                <>
                  <p className="m-2">{userFiles.map((f) => f.name).join(', ')}</p>
                  <button type="submit" className="p-2 rounded-[8px] font-poppins font-medium">
                    Submit
                  </button>
                </>
              )}
            </FileTrigger>
          </form>
        </div>
      )}
      {userUploadStatus && <p className="text-lg font-bold mt-4 text-center">{userUploadStatus}</p>}
    </div>
  )
}

export default UploadData

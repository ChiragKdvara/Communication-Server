import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const [email, setEmail] = useState('') // Email state
  const navigate = useNavigate() // For navigation

  const handleLogin = async (e) => {
    e.preventDefault() // Prevent default form submission

    try {
      const response = await axios.post('http://localhost:8000/api/v1/users/login', {
        email, // Send email to the FastAPI endpoint
      })

      const user_data = response.data // Get the user data from the response
      // Navigate to the next page with the returned data
      navigate('/user', { state: user_data })
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert('User not found') // Alert if user not found
      } else {
        console.error('Error during login:', error) // Log any other error
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold font-space">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col w-96">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Capture email input
          required
          className="border-2 border-accent rounded-md p-2 font-poppins"
        />
        <button type="submit" className="p-2 mt-4 bg-primary text-white rounded-md font-poppins cursor-pointer">
          Login
        </button>
      </form>
    </div>
  )
}

export default Login

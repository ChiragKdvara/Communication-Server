import { Link } from 'react-router-dom'
import { Home, LogOut } from 'lucide-react'

const Header = () => {
  return (
    <header className="flex justify-between p-4 items-center">
      <img src="/dvara_logo.png" className="w-16" />
      <div className="flex gap-6 items-center justify-between">
        <Link to="/admin" className="text-accent flex items-center gap-2">
          <Home size="18px" /> Home
        </Link>
        <Link className="text-accent flex items-center gap-2">
          <LogOut size="18px" /> Logout
        </Link>
      </div>
    </header>
  )
}

export default Header

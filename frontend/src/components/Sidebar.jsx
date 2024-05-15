import { Menu, X, Upload, LayoutTemplate, ListFilter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Sidebar = () => {
  const navigate = useNavigate()

  const handleUploadLinkClick = () => {
    navigate('/upload')
  }
  return (
    <div className="px-4 z-40">
      <div className="drawer drawer-end font-poppins">
        <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {/* Page content here */}
          <label htmlFor="my-drawer-4" className="drawer-button btn">
            <Menu />
          </label>
        </div>
        <div className="drawer-side">
          <ul className="menu p-4 w-80 min-h-full glass text-base-content gap-2">
            <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay text-right w-fit hover:cursor-pointer p-4 text-secondary">
              <X />
            </label>
            <h2 className="m-0 p-3">Options</h2>
            <li>
              <a className="hover:glass hover:shadow-md" onClick={handleUploadLinkClick}>
                <Upload size="20px" /> Upload Data
              </a>
            </li>
            <li>
              <a className="hover:glass hover:shadow-md">
                <LayoutTemplate size="20px" /> Manage Templates
              </a>
            </li>
            <li>
              <a className="hover:glass hover:shadow-md">
                <ListFilter size="20px" /> Manage Filters
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

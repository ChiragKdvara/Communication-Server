import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const UploadData = lazy(() => import('./components/UploadData'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const CreateTemplate = lazy(() => import('./components/CreateTemplate'))
const SelectFilter = lazy(() => import('./components/SelectFilter'))
const Preview = lazy(() => import('./components/Preview'))
const Login = lazy(() => import('./components/Login'))
const User = lazy(() => import('./components/User'))
const Message = lazy(() => import('./components/Message'))
const ViewMessages = lazy(() => import('./components/ViewMessages'))
const ViewTemplates = lazy(() => import('./components/ViewTemplates'))
const ViewSingleMessage = lazy(() => import('./components/ViewSingleMessage'))
const MessageDetails = lazy(() => import('./components/MessageDetails'))
const TemplateReuse = lazy(() => import('./components/TemplateReuse'))

const App = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen w-full text-3xl font-bold">Loading...</div>}>
      <Routes>
        <Route path="/upload" element={<UploadData />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create-template" element={<CreateTemplate />} />
        <Route path="/select-filter" element={<SelectFilter />} />
        <Route path="/confirmation" element={<Preview />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<User />} />
        <Route path="/messages/:id" element={<Message />} />
        <Route path="/sent-messages" element={<ViewMessages />} />
        <Route path="/templates" element={<ViewTemplates />} />
        <Route path="/sent-messages/:id" element={<ViewSingleMessage />} />
        <Route path="/message-details/:id" element={<MessageDetails />} />
        <Route path="/template/:id" element={<TemplateReuse />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

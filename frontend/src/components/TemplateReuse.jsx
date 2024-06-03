import { useNavigate, useLocation } from 'react-router-dom'
import Header from './Header'
import { ArrowBigLeft, Send } from 'lucide-react'

const TemplateReuse = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location?.state
  console.log(location?.state)

  const handleBack = () => {
    navigate('/admin', {
      state: {
        template_name: '',
        message_title: '',
        message_content: '',
        selected_branch: '',
        previousPage: '',
      },
    })
  }

  const handleContinue = () => {
    navigate('/select-filter', {
      state: { ...data, previousPage: `/template/${data.template_id}` },
    })
  }

  const languages = ['Kannada', 'Telugu', 'Marathi', 'Tamil', 'Malayalam']

  return (
    <div className="h-screen w-full flex flex-col font-poppins">
      <Header />
      <div className="bg-primary w-full h-20 flex items-center justify-between">
        <h1 className="m-0 p-4 text-white font-semibold">Template Preview</h1>
      </div>
      <div className="flex flex-col px-4 mt-4">
        {/* Message Start */}
        <div className="message border-solid border-2 border-primary rounded-[8px] overflow-hidden">
          <div className="flex flex-col h-full justify-between">
            <div className="flex mt-4 px-4">
              <button className="font-poppins my-2 mr-2 border-2 border-solid bg-transparent font-medium border-secondary text-secondary rounded-[8px] cursor-pointer">English</button>
              {languages.map((lang, index) => {
                return (
                  <button className="p-2 font-poppins my-2 mx-2 border-2 border-accent bg-zinc-100 rounded-[8px] opacity-[0.3] cursor-not-allowed" key={index}>
                    {lang}
                  </button>
                )
              })}
            </div>
            <div className="flex-1 px-4 overflow-auto">
              <p>
                <span className="font-bold">Template Name:</span> {data.template_name}
              </p>
              <p>
                <span className="font-bold">Message Title:</span> {data.message_title}
              </p>
              <div className="mt-2">
                <span className="font-bold">Message Content:</span>
                <div className="mt-1 border border-gray-300 rounded-md max-h-[250px] overflow-auto">{data.message_content}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Message End */}
      </div>
      <div className="flex px-4 gap-3 mt-4">
        <button onClick={handleContinue} className="bg-secondary text-white rounded-[8px] text-[16px] p-3 font-poppins font-medium cursor-pointer flex gap-2 items-center">
          Continue <Send size="18px" />
        </button>
        <button
          onClick={handleBack}
          className="border-accent border-2 border-solid flex gap-2 items-center bg-transparent rounded-[8px] text-[16px] p-3  font-medium font-poppins hover:cursor-pointer">
          Back <ArrowBigLeft size="18px" />
        </button>
      </div>
    </div>
  )
}

export default TemplateReuse

import { createContext, useContext, useState } from 'react'

const ClientContext = createContext()

export function ClientProvider({ children }) {
  const [client, setClient] = useState(null)
  const [consultation, setConsultation] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [aiResponses, setAiResponses] = useState([])
  const [capturedPhoto, setCapturedPhoto] = useState(null)

  const resetSession = () => {
    setClient(null)
    setConsultation(null)
    setSelectedServices([])
    setAiResponses([])
    setCapturedPhoto(null)
  }

  return (
    <ClientContext.Provider value={{
      client, setClient,
      consultation, setConsultation,
      selectedServices, setSelectedServices,
      aiResponses, setAiResponses,
      capturedPhoto, setCapturedPhoto,
      resetSession
    }}>
      {children}
    </ClientContext.Provider>
  )
}

export const useClient = () => useContext(ClientContext)

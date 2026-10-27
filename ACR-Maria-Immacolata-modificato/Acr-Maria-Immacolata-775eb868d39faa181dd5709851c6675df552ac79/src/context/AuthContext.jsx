import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const STORAGE_KEY = 'acr_educatore_id'

// Non scarichiamo mai la password nel client: si seleziona solo ciò che serve.
const CAMPI = 'id, nome, moderatore'

export function AuthProvider({ children }) {
  const [educatore, setEducatore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (!savedId) {
      setLoading(false)
      return
    }
    supabase
      .from('educatori')
      .select(CAMPI)
      .eq('id', savedId)
      .single()
      .then(({ data, error }) => {
        if (error) console.warn('Ripristino sessione non riuscito:', error.message)
        if (data) setEducatore(data)
        setLoading(false)
      })
  }, [])

  async function login({ nome, password, ricordami }) {
    // ilike interpreta % e _ come jolly: li neutralizziamo
    const nomePulito = nome.trim().replace(/\s+/g, ' ').replace(/[\\%_]/g, '\\$&')

    const { data, error } = await supabase
      .from('educatori')
      .select(CAMPI)
      .ilike('nome', nomePulito)
      .eq('password', password.trim())
      .maybeSingle()

    if (error) {
      console.error('Login: errore Supabase', error)
      throw new Error(`Errore di connessione al database: ${error.message}. Controlla le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.`)
    }

    if (!data) {
      // Nome/password sbagliati oppure tabella vuota/non leggibile? Lo verifichiamo.
      const { count, error: errCount } = await supabase
        .from('educatori')
        .select('id', { count: 'exact', head: true })
      if (errCount || !count) {
        console.error('Login: la tabella educatori risulta vuota o non leggibile', errCount)
        throw new Error('La tabella educatori risulta vuota o non leggibile: controlla di aver eseguito setup.sql e che la RLS sia disattivata su Supabase.')
      }
      throw new Error('Educatore/educatrice non trovato/a. Controlla nome, cognome e password.')
    }

    setEducatore(data)
    if (ricordami) {
      localStorage.setItem(STORAGE_KEY, data.id)
    }
    return data
  }

  function logout() {
    setEducatore(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ educatore, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}

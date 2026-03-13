import React, { createContext, useContext } from 'react'
import { Firestore } from 'firebase/firestore'
import { Database } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'

interface FirebaseContextType {
  db: Firestore
  rtdb: Database
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ db, rtdb }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider')
  }
  return context
}

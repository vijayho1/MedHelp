import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';
import { db } from '@/integrations/firebase/client';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  loading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load patients from Firestore on mount
  useEffect(() => {
    if (user) {
      loadPatients();
    } else {
      setPatients([]);
      setLoading(false);
    }
  }, [user]);

  const loadPatients = async () => {
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loadedPatients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Patient;
      });
      setPatients(loadedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPatient = {
        ...patientData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'patients'), newPatient);
      
      const addedPatient: Patient = {
        ...patientData,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setPatients(prev => [addedPatient, ...prev]);
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      setPatients(prev =>
        prev.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patients', id));
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  };

  const getPatient = (id: string) => {
    return patients.find(p => p.id === id);
  };

  const searchPatients = (query: string) => {
    if (!query.trim()) return patients;
    const lowerQuery = query.toLowerCase();
    return patients.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.symptoms.toLowerCase().includes(lowerQuery) ||
        p.history.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <PatientContext.Provider
      value={{ patients, addPatient, updatePatient, deletePatient, getPatient, searchPatients, loading }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient } from '@/types/patient';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);

  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      )
    );
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
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
      value={{ patients, addPatient, updatePatient, deletePatient, getPatient, searchPatients }}
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

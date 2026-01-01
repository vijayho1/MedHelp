import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';
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

  // Load patients from Supabase on mount
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
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedPatients = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        history: row.history,
        symptoms: row.symptoms,
        tests: row.tests,
        allergies: row.allergies,
        possibleCondition: row.possible_condition,
        recommendations: row.recommendations,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      setPatients(loadedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: patientData.name,
          age: patientData.age,
          gender: patientData.gender,
          history: patientData.history,
          symptoms: patientData.symptoms,
          tests: patientData.tests,
          allergies: patientData.allergies,
          possible_condition: patientData.possibleCondition,
          recommendations: patientData.recommendations,
        }])
        .select()
        .single();

      if (error) throw error;

      const newPatient: Patient = {
        id: data.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        history: data.history,
        symptoms: data.symptoms,
        tests: data.tests,
        allergies: data.allergies,
        possibleCondition: data.possible_condition,
        recommendations: data.recommendations,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setPatients(prev => [newPatient, ...prev]);
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: updates.name,
          age: updates.age,
          gender: updates.gender,
          history: updates.history,
          symptoms: updates.symptoms,
          tests: updates.tests,
          allergies: updates.allergies,
          possible_condition: updates.possibleCondition,
          recommendations: updates.recommendations,
        })
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

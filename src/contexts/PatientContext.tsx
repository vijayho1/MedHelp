import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  loading: boolean;
  generateRandomPatientsWithAI: () => Promise<void>;
}

const STORAGE_KEY = 'medhelp_patients';

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Load patients from localStorage on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Save to localStorage whenever patients change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    }
  }, [patients, loading]);

  const loadPatients = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedPatients = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        setPatients(loadedPatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Button-triggered: Generate random patients and run AI extraction (6 patients, one at a time)
  const generateRandomPatientsWithAI = async () => {
    const names = [
      'Alice Smith', 'Bob Johnson', 'Charlie Lee', 'Diana Patel', 'Ethan Brown',
      'Fiona Clark', 'George Kim', 'Hannah Singh', 'Ivan Chen', 'Julia Lopez',
      'Kevin Wang', 'Lily Davis', 'Mona Shah', 'Nate Wilson', 'Olivia Martinez'
    ];
    const genders: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];
    const symptomsList = [
      'fever, cough', 'headache, nausea', 'chest pain', 'fatigue', 'joint pain',
      'shortness of breath', 'rash', 'abdominal pain', 'dizziness', 'sore throat',
      'back pain', 'anxiety', 'palpitations', 'vomiting', 'muscle weakness'
    ];
    const histories = [
      'Diabetes for 5 years', 'Hypertension', 'Asthma since childhood', 'No major illnesses', 'History of migraines',
      'Chronic kidney disease', 'Previous surgery', 'Allergic to penicillin', 'Family history of heart disease', 'Smoker',
      'Obesity', 'High cholesterol', 'Thyroid disorder', 'Alcohol use', 'No significant history'
    ];
    const testsList = [
      'CBC normal', 'ECG abnormal', 'MRI clear', 'X-ray shows mild changes', 'Blood sugar elevated',
      'Liver function normal', 'Kidney function borderline', 'Chest CT clear', 'Echo shows mild regurgitation', 'Urine test normal',
      'Vitamin D low', 'Calcium normal', 'TSH high', 'CRP elevated', 'No recent tests'
    ];
    const allergiesList = [
      'None', 'Penicillin', 'Aspirin', 'Peanuts', 'Latex',
      'Sulfa drugs', 'Shellfish', 'Eggs', 'Bee stings', 'NSAIDs',
      'Pollen', 'Dust', 'Cats', 'Dogs', 'No known allergies'
    ];
    const possibleConditions = [
      'Suspected Respiratory Infection', 'Suspected Migraine', 'Suspected Angina', 'Suspected Chronic Fatigue Syndrome', 'Suspected Arthritis',
      'Suspected COPD', 'Suspected Allergic Dermatitis', 'Suspected Gastritis', 'Suspected Vertigo', 'Suspected Pharyngitis',
      'Suspected Lumbar Strain', 'Suspected Generalized Anxiety Disorder', 'Suspected Arrhythmia', 'Suspected Gastroenteritis', 'Suspected Myopathy'
    ];
    const recommendationsList = [
      'Follow up with PCP, rest and hydration', 'Neurology referral, MRI if symptoms persist', 'Cardiology consult, stress test', 'Sleep study, lifestyle modifications', 'Rheumatology referral, anti-inflammatory diet',
      'Pulmonology referral, spirometry', 'Dermatology consult, avoid allergens', 'GI consult, dietary changes', 'ENT referral, vestibular testing', 'Throat culture, supportive care',
      'Physical therapy, ergonomic assessment', 'Psychiatry referral, CBT', 'Cardiology follow-up, Holter monitor', 'Hydration, bland diet, follow up if symptoms persist', 'Neurology consult, EMG'
    ];
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = 'xiaomi/mimo-v2-flash:free';
    const prompt = (text: string) => `You are a medical data extraction assistant. Given the following clinical note, extract and infer the relevant patient information. Respond with ONLY valid JSON (no markdown, no code blocks).

Clinical note:
${text}

Extract these exact fields:
- age (string number only, e.g., "54")
- history (string)
- symptoms (string)
- tests (string)
- allergies (string)
- possibleCondition (string; MUST infer a likely diagnosis based on symptoms, history, and tests. Use standard medical terminology, prefix with "Suspected" if not confirmed.)
- recommendations (string; MUST include at least one follow-up or diagnostic suggestion based on the condition.)

Return valid JSON only. Do not leave possibleCondition or recommendations empty.`;
    for (let i = 0; i < 6; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(now - daysAgo * msInDay - Math.floor(Math.random() * msInDay));
      const age = 20 + Math.floor(Math.random() * 60);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      let aiFields: any = {};
      try {
        const clinicalNote = `${names[i]}, ${age}-year-old ${gender} with ${histories[i]}. Symptoms: ${symptomsList[i]}. Tests: ${testsList[i]}. Allergies: ${allergiesList[i]}.`;
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt(clinicalNote) }],
            temperature: 0.2,
            max_tokens: 1024,
          }),
        });
        const data = await res.json();
        const responseText = data.choices?.[0]?.message?.content;
        const jsonMatch = responseText && responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiFields = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // fallback: leave aiFields empty
      }
      const newPatient: Patient = {
        id: crypto.randomUUID(),
        name: names[i],
        age: aiFields?.age ? parseInt(aiFields.age) : age,
        gender,
        history: aiFields?.history || histories[i],
        symptoms: aiFields?.symptoms || symptomsList[i],
        tests: aiFields?.tests || testsList[i],
        allergies: aiFields?.allergies || allergiesList[i],
        possibleCondition: aiFields?.possibleCondition || possibleConditions[i],
        recommendations: aiFields?.recommendations || recommendationsList[i],
        createdAt,
        updatedAt: createdAt,
      };
      setPatients(prev => [newPatient, ...prev]);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      )
    );
  };

  const deletePatient = async (id: string) => {
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
      value={{ patients, addPatient, updatePatient, deletePatient, getPatient, searchPatients, loading, generateRandomPatientsWithAI }}
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

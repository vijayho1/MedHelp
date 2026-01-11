import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { VoiceRecorder } from './VoiceRecorderWebSpeech';
import { AIExtractionPanel } from './AIExtractionPanel';
import { Patient, AIExtraction } from '@/types/patient';
import { usePatients } from '@/contexts/PatientContext';
import { toast } from 'sonner';

interface PatientFormProps {
  patientId?: string;
  onBack: () => void;
}

export function PatientForm({ patientId, onBack }: PatientFormProps) {
  const { addPatient, updatePatient, getPatient } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiExtraction, setAiExtraction] = useState<AIExtraction | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    history: '',
    symptoms: '',
    tests: '',
    allergies: '',
    possibleCondition: '',
    recommendations: '',
  });

  useEffect(() => {
    if (patientId) {
      const patient = getPatient(patientId);
      if (patient) {
        setFormData({
          name: patient.name,
          age: patient.age.toString(),
          gender: patient.gender,
          history: patient.history,
          symptoms: patient.symptoms,
          tests: patient.tests,
          allergies: patient.allergies,
          possibleCondition: patient.possibleCondition || '',
          recommendations: patient.recommendations || '',
        });
      }
    }
  }, [patientId, getPatient]);

  const handleTranscription = async (text: string) => {
    setTranscription(text);
    setIsExtracting(true);

    // Helper to process and set extraction
    const processExtraction = (extractedData: any) => {
      const extraction: AIExtraction = {
        age: parseInt(extractedData.age) || undefined,
        history: extractedData.history,
        symptoms: extractedData.symptoms,
        tests: extractedData.tests,
        allergies: extractedData.allergies,
        possibleCondition: extractedData.possibleCondition,
        recommendations: extractedData.recommendations,
      };
      setAiExtraction(extraction);
      setFormData(prev => ({
        ...prev,
        age: extraction.age?.toString() || prev.age,
        history: extraction.history || prev.history,
        symptoms: extraction.symptoms || prev.symptoms,
        tests: extraction.tests || prev.tests,
        allergies: extraction.allergies || prev.allergies,
        possibleCondition: extraction.possibleCondition || prev.possibleCondition,
        recommendations: extraction.recommendations || prev.recommendations,
      }));
    };

    try {
      // Try Groq first
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      if (!GROQ_API_KEY) throw new Error('Groq API key is not configured');
      let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Extract patient information from this clinical note and respond with ONLY valid JSON (no markdown, no code blocks):\n\n${text}\n\nExtract these exact fields:\n- age (string number only, e.g., "54")\n- history (string)\n- symptoms (string)\n- tests (string)\n- allergies (string)\n- possibleCondition (string)\n- recommendations (string)`
          }],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', response.status, errorText);
        throw new Error(`AI extraction failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Groq response:', data);
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error('Invalid AI response format');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid data found in AI response');
      const extractedData = JSON.parse(jsonMatch[0]);
      processExtraction(extractedData);
      toast.success('AI extraction complete (Groq)');
    } catch (groqError) {
      console.error('Groq extraction failed, trying Gemini...', groqError);
      // Try Gemini fallback
      try {
        const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) throw new Error('Gemini API key is not configured');
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a medical data extraction assistant. Extract structured patient information from this clinical note and respond with valid JSON only (no markdown):\n\n${text}\n\nExtract the following fields:\n- age (string, e.g., "54")\n- history (string)\n- symptoms (string)\n- tests (string)\n- allergies (string)\n- possibleCondition (string)\n- recommendations (string)`
                }]
              }],
              generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              }
            }),
          }
        );
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', geminiResponse.status, errorText);
          throw new Error(`Gemini extraction failed: ${geminiResponse.status}`);
        }
        const geminiData = await geminiResponse.json();
        console.log('Gemini response:', geminiData);
        const textOut = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOut) throw new Error('Invalid Gemini response format');
        const jsonMatch = textOut.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in Gemini response');
        const extractedData = JSON.parse(jsonMatch[0]);
        processExtraction(extractedData);
        toast.success('AI extraction complete (Gemini)');
      } catch (geminiError) {
        console.error('AI extraction error (Gemini fallback):', geminiError);
        toast.error('Failed to extract patient data from both Groq and Gemini');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.gender) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    const patientData = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female' | 'other',
      history: formData.history,
      symptoms: formData.symptoms,
      tests: formData.tests,
      allergies: formData.allergies,
      possibleCondition: formData.possibleCondition,
      recommendations: formData.recommendations,
    };

    try {
      if (patientId) {
        await updatePatient(patientId, patientData);
        toast.success('Patient record updated');
      } else {
        await addPatient(patientData);
        toast.success('Patient added successfully');
      }
      onBack();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to save patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {patientId ? 'Edit Patient' : 'New Patient Entry'}
        </h1>
      </div>

      <div className="medical-card p-6">
        <div className="mb-6">
          <VoiceRecorder onTranscription={handleTranscription} />
        </div>

        {transcription && (
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <Label className="text-sm font-medium mb-2 block">Transcription:</Label>
            <p className="text-sm text-muted-foreground">{transcription}</p>
          </div>
        )}

        <AIExtractionPanel extraction={aiExtraction} isLoading={isExtracting} />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Patient name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={value => setFormData(prev => ({ ...prev, gender: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="history">Medical History</Label>
            <Textarea
              id="history"
              value={formData.history}
              onChange={e => setFormData(prev => ({ ...prev, history: e.target.value }))}
              placeholder="Previous conditions, surgeries, medications..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={e => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              placeholder="Current symptoms and complaints..."
              rows={3}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tests">Tests & Results</Label>
              <Textarea
                id="tests"
                value={formData.tests}
                onChange={e => setFormData(prev => ({ ...prev, tests: e.target.value }))}
                placeholder="Test results..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={e => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="Known allergies..."
                rows={2}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="condition">Possible Condition</Label>
              <Input
                id="condition"
                value={formData.possibleCondition}
                onChange={e => setFormData(prev => ({ ...prev, possibleCondition: e.target.value }))}
                placeholder="Suspected diagnosis..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Input
                id="recommendations"
                value={formData.recommendations}
                onChange={e => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Next steps, referrals..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate transcription (in production, use actual speech-to-text API)
      setTimeout(() => {
        const mockTranscription = "The patient is a 54-year-old male with a history of diabetes and chest pain for the past two days. Blood pressure is 140/90. No known allergies.";
        onTranscription(mockTranscription);
        setIsProcessing(false);
        toast.success('Voice note transcribed successfully');
      }, 1500);
    } else {
      // Start recording
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        toast.info('Recording started... Speak now');
      } catch (error) {
        toast.error('Microphone access denied');
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={isRecording ? 'recording' : 'accent'}
        size="lg"
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <Square className="h-5 w-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            Record Voice
          </>
        )}
      </Button>
      
      {isRecording && (
        <span className="text-sm text-muted-foreground animate-pulse-soft">
          Listening...
        </span>
      )}
    </div>
  );
}

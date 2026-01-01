import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Web Speech API not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        console.log('Final transcript so far:', finalTranscriptRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone error. Please check your microphone.');
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      const transcript = finalTranscriptRef.current.trim();
      
      if (transcript) {
        console.log('Sending transcript:', transcript);
        onTranscription(transcript);
        toast.success(`Transcribed: "${transcript}"`);
      } else {
        toast.error('No speech detected. Please speak clearly into the microphone.');
      }
      
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscription]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not available in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      finalTranscriptRef.current = '';
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info('Listening... Speak now');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start speech recognition');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      setIsProcessing(true);
      recognitionRef.current.stop();
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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

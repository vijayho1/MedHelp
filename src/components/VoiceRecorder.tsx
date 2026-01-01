import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      // Try different MIME types based on browser support
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('Using MIME type:', type);
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await processAudio();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      toast.info('Recording started... Speak clearly');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);
    
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      // Get the MIME type from the first chunk
      const mimeType = audioChunksRef.current[0].type;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log('Processing audio:', audioBlob.size, 'bytes, type:', mimeType);
      
      // Check if audio is too short
      if (audioBlob.size < 1000) {
        throw new Error('Recording too short. Please speak for at least 2 seconds.');
      }
      
      const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Send original WebM directly - don't convert
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model_id', 'scribe_v2');

      console.log('Sending to ElevenLabs API...');

      // Send directly to ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`Transcription failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Full transcription response:', JSON.stringify(result, null, 2));
      console.log('Text field:', result?.text);
      console.log('Text length:', result?.text?.length);
      
      if (result?.text !== undefined && result.text !== null) {
        const transcribedText = result.text.trim();
        if (transcribedText) {
          onTranscription(transcribedText);
          toast.success(`Transcribed: "${transcribedText}"`);
        } else {
          toast.error('ElevenLabs could not detect speech - try speaking louder and closer to the mic');
          console.error('Empty transcription returned - language_probability:', result.language_probability);
        }
      } else {
        console.error('No text field in response:', result);
        throw new Error(`Unexpected API response: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
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

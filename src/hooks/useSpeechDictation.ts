import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLanguage } from '../data/translations';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstanceLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface UseSpeechDictationOptions {
  language: AppLanguage;
  speechLangOverride?: string;
  onFinalTranscript: (transcript: string) => void;
}

export function useSpeechDictation({
  language,
  speechLangOverride,
  onFinalTranscript
}: UseSpeechDictationOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  const languageRef = useRef(language);
  const manualStopRef = useRef(false);

  onFinalRef.current = onFinalTranscript;
  languageRef.current = language;

  const isSupported = Boolean(getSpeechRecognitionConstructor());
  const activeLocale = speechLangOverride || (language === 'ur' ? 'ur-PK' : 'en-US');

  const clearError = useCallback(() => setError(null), []);

  const stopDictation = useCallback(() => {
    manualStopRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors when already inactive
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startDictation = useCallback(
    (overrideLocale?: string) => {
      setError(null);
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        setError(
          languageRef.current === 'ur'
            ? 'اس براؤزر یا ڈیوائس پر وائس ڈکٹیشن (Speech-to-Text) دستیاب نہیں ہے۔'
            : 'Voice dictation (Web Speech API) is not supported on this browser or device.'
        );
        return false;
      }

      // Cleanly abort any previous active session before starting a fresh one
      if (recognitionRef.current) {
        manualStopRef.current = true;
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      try {
        const recognition = new Ctor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = overrideLocale || activeLocale;
        manualStopRef.current = false;

        recognition.onstart = () => {
          setIsListening(true);
          setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let finalChunk = '';
          let interimChunk = '';

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            const text = result?.[0]?.transcript || '';
            if (!text) continue;
            if (result.isFinal) {
              finalChunk += `${text} `;
            } else {
              interimChunk += text;
            }
          }

          const cleanFinal = finalChunk.trim();
          if (cleanFinal) {
            onFinalRef.current(cleanFinal);
          }
          setInterimTranscript(interimChunk.trim());
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          const isUr = languageRef.current === 'ur';
          const code = event?.error || 'unknown';

          if (code === 'aborted' && manualStopRef.current) {
            return;
          }

          if (code === 'not-allowed' || code === 'service-not-allowed') {
            setError(
              isUr
                ? 'مائیکروفون کی اجازت مسترد کر دی گئی۔ براہ کرم براؤزر یا ایپ سیٹنگز میں مائیک کی اجازت دیں۔'
                : 'Microphone access denied. Please allow microphone permission in browser/app settings.'
            );
          } else if (code === 'audio-capture') {
            setError(
              isUr
                ? 'کوئی مائیکروفون نہیں ملا۔ براہ کرم ڈیوائس کا مائیک چیک کریں۔'
                : 'No microphone was detected. Please check your device microphone.'
            );
          } else if (code === 'no-speech') {
            setError(
              isUr
                ? 'کوئی آواز سنائی نہیں دی۔ دوبارہ بولنے کی کوشش کریں۔'
                : 'No speech detected. Please tap dictation and speak clearly.'
            );
          } else if (code === 'network') {
            setError(
              isUr
                ? 'اسپیچ ریکگنیشن کے لیے انٹرنیٹ کنکشن درکار ہے۔'
                : 'Network error during speech recognition. Please check your connection.'
            );
          } else if (code !== 'aborted') {
            setError(
              isUr
                ? 'آواز کو تحریر میں تبدیل کرنے میں مسئلہ پیش آیا۔'
                : 'Could not transcribe speech right now.'
            );
          }

          setIsListening(false);
          setInterimTranscript('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch {
        setIsListening(false);
        setInterimTranscript('');
        setError(
          languageRef.current === 'ur'
            ? 'وائس ڈکٹیشن شروع کرنے میں ناکامی ہوئی۔'
            : 'Unable to start voice dictation.'
        );
        return false;
      }
    },
    [activeLocale]
  );

  const toggleDictation = useCallback(
    (overrideLocale?: string) => {
      if (isListening) {
        stopDictation();
      } else {
        startDictation(overrideLocale);
      }
    },
    [isListening, startDictation, stopDictation]
  );

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore unmount cleanup
      }
      recognitionRef.current = null;
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    activeLocale,
    error,
    clearError,
    startDictation,
    stopDictation,
    toggleDictation
  };
}

export function appendDictatedText(existing: string, spoken: string): string {
  const cleanSpoken = spoken.trim();
  if (!cleanSpoken) return existing;
  if (!existing.trim()) return cleanSpoken;
  const needsSpace = !/\s$/.test(existing);
  return `${existing}${needsSpace ? ' ' : ''}${cleanSpoken}`;
}

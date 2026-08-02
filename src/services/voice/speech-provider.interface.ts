/**
 * Provider-agnostic speech interfaces for future STT/TTS integrations.
 * No external providers are wired — register implementations via VoiceProviderManager.
 */

export interface SpeechRecognitionInput {
  audioData?: Uint8Array;
  language?: string;
  sessionId?: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  language?: string;
  isFinal?: boolean;
}

export interface SpeechSynthesisRequest {
  text: string;
  language?: string;
  voiceId?: string;
  sessionId?: string;
}

export interface SpeechSynthesisResult {
  audioData?: Uint8Array;
  format?: string;
  durationMs?: number;
}

export interface SpeechRecognitionProvider {
  readonly providerId: string;
  readonly providerType: "stt";
  isAvailable(): boolean;
  recognize(input: SpeechRecognitionInput): Promise<SpeechRecognitionResult>;
}

export interface SpeechSynthesisProvider {
  readonly providerId: string;
  readonly providerType: "tts";
  isAvailable(): boolean;
  synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult>;
}

export type SpeechProvider = SpeechRecognitionProvider | SpeechSynthesisProvider;

export function isSttProvider(provider: SpeechProvider): provider is SpeechRecognitionProvider {
  return provider.providerType === "stt";
}

export function isTtsProvider(provider: SpeechProvider): provider is SpeechSynthesisProvider {
  return provider.providerType === "tts";
}

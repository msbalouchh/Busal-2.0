import "server-only";

import type {
  SpeechProvider,
  SpeechRecognitionInput,
  SpeechRecognitionProvider,
  SpeechRecognitionResult,
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from "@/services/voice/speech-provider.interface";
import { isSttProvider, isTtsProvider } from "@/services/voice/speech-provider.interface";

const NOOP_STT_ID = "noop-stt";
const NOOP_TTS_ID = "noop-tts";

class NoopSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly providerId = NOOP_STT_ID;
  readonly providerType = "stt" as const;

  isAvailable(): boolean {
    return false;
  }

  async recognize(_input: SpeechRecognitionInput): Promise<SpeechRecognitionResult> {
    throw new Error(
      "No speech recognition provider configured. Register an STT provider via VoiceProviderManager.",
    );
  }
}

class NoopSpeechSynthesisProvider implements SpeechSynthesisProvider {
  readonly providerId = NOOP_TTS_ID;
  readonly providerType = "tts" as const;

  isAvailable(): boolean {
    return false;
  }

  async synthesize(_request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> {
    throw new Error(
      "No speech synthesis provider configured. Register a TTS provider via VoiceProviderManager.",
    );
  }
}

class VoiceProviderManagerImpl {
  private sttProvider: SpeechRecognitionProvider = new NoopSpeechRecognitionProvider();
  private ttsProvider: SpeechSynthesisProvider = new NoopSpeechSynthesisProvider();
  private registry = new Map<string, SpeechProvider>();

  registerProvider(provider: SpeechProvider): void {
    this.registry.set(provider.providerId, provider);
    if (isSttProvider(provider)) {
      this.sttProvider = provider;
    }
    if (isTtsProvider(provider)) {
      this.ttsProvider = provider;
    }
  }

  getSttProvider(): SpeechRecognitionProvider {
    return this.sttProvider;
  }

  getTtsProvider(): SpeechSynthesisProvider {
    return this.ttsProvider;
  }

  listProviders(): SpeechProvider[] {
    return Array.from(this.registry.values());
  }

  getProvider(providerId: string): SpeechProvider | undefined {
    return this.registry.get(providerId);
  }
}

export const voiceProviderManager = new VoiceProviderManagerImpl();

export function getVoiceProviderManager(): VoiceProviderManagerImpl {
  return voiceProviderManager;
}

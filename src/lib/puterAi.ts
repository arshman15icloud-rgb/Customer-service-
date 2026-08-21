import { puter } from '@heyputer/puter.js';

export interface PuterChatResult {
  replyText: string;
  recommendedProductIds: string[];
  escalateToHuman: boolean;
  escalationReason?: string;
}

/**
 * Generate responses directly using Puter.js free AI capabilities (Gemini models)
 * without requiring any API keys or registrations.
 */
export async function callPuterGemini(
  prompt: string,
  model: string = 'gemini-2.0-flash'
): Promise<string> {
  try {
    // Check global window.puter if running in browser with CDN script, otherwise use imported puter
    const puterClient = (typeof window !== 'undefined' && (window as any).puter) || puter;
    if (!puterClient || !puterClient.ai) {
      throw new Error('Puter.js is not loaded');
    }

    const res: any = await puterClient.ai.chat(prompt, { model });
    if (typeof res === 'string') return res;
    if (res?.message?.content) return res.message.content;
    if (res?.text) return res.text;
    return JSON.stringify(res);
  } catch (error: any) {
    console.error('Error calling Puter AI:', error);
    throw error;
  }
}

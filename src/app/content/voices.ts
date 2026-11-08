/** Splits a sentence into its sans "method" half and its italic "voice" tail (the voice must end the sentence). */
export function voices(text: string, voice: string): [string, string] {
  if (!text.endsWith(voice)) throw new Error('voice must end the sentence');
  return [text.slice(0, text.length - voice.length).trimEnd(), voice];
}

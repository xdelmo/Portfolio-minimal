/** Splits a sentence into its sans "method" half and its italic "voice" tail (the voice must end the sentence). */
export function voices(text: string, voice: string): [string, string] {
  if (!text.endsWith(voice)) throw new Error('voice must end the sentence');
  return [text.slice(0, text.length - voice.length).trimEnd(), voice];
}

/** Splits a sentence around the last occurrence of a word: the text before it, the word, the text after it. */
export function around(text: string, word: string): [string, string, string] {
  const at = text.lastIndexOf(word);
  if (at < 0) throw new Error('word must be in the sentence');
  return [text.slice(0, at), word, text.slice(at + word.length)];
}

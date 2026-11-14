import { LESSONS } from './lessons.js';

export const LESSON = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

// The parts of a lesson, in the order the video lesson shows and reads them.
export function lessonParts(l, simple = false) {
  return [
    { key: 'title', label: 'Today\'s topic', text: `${l.title}.` },
    { key: 'what', label: simple ? 'In one line' : 'What it is', text: simple ? l.simple : l.def },
    { key: 'example', label: 'Real-life example', text: `Here is an example. ${l.example}` },
    { key: 'trap', label: 'How the exam tricks you', text: `Watch out on the exam. ${l.trap}` },
    { key: 'trick', label: 'Memory trick', text: `Memory trick: ${l.trick}` },
  ];
}

export function lessonSpeech(l, simple = false) {
  return lessonParts(l, simple)
    .map((p) => p.text)
    .join(' ');
}

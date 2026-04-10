/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatLibraryName } from './utils';

export interface LibraryItem {
  id: string;
  name: string;
  content: string;
  category: 'voice' | 'instructions' | 'skills' | 'gold' | 'references';
  ownerId?: string;
}

// Dynamically load skills and gold standards
const skillFiles = (import.meta as any).glob('../../skills/*.md', { as: 'raw', eager: true });
const goldFiles = (import.meta as any).glob('../../gold_standards/*.md', { as: 'raw', eager: true });
const voiceFiles = (import.meta as any).glob('../../voice/*.md', { as: 'raw', eager: true });
const instructionFiles = (import.meta as any).glob('../../instructions/*.md', { as: 'raw', eager: true });
const referenceFiles = (import.meta as any).glob('../../references/*.md', { as: 'raw', eager: true });

const dynamicSkills: LibraryItem[] = Object.entries(skillFiles).map(([path, content]) => {
  const filename = path.split('/').pop() || '';
  return {
    id: `skill-${filename}`,
    category: 'skills',
    name: formatLibraryName(filename),
    content: content as string
  };
});

const dynamicGold: LibraryItem[] = Object.entries(goldFiles).map(([path, content]) => {
  const filename = path.split('/').pop() || '';
  return {
    id: `gold-${filename}`,
    category: 'gold',
    name: formatLibraryName(filename),
    content: content as string
  };
});

const dynamicVoice: LibraryItem[] = Object.entries(voiceFiles).map(([path, content]) => {
  const filename = path.split('/').pop() || '';
  return {
    id: `voice-${filename}`,
    category: 'voice',
    name: formatLibraryName(filename),
    content: content as string
  };
});

const dynamicInstructions: LibraryItem[] = Object.entries(instructionFiles).map(([path, content]) => {
  const filename = path.split('/').pop() || '';
  return {
    id: `instr-${filename}`,
    category: 'instructions',
    name: formatLibraryName(filename),
    content: content as string
  };
});

const dynamicReferences: LibraryItem[] = Object.entries(referenceFiles).map(([path, content]) => {
  const filename = path.split('/').pop() || '';
  return {
    id: `ref-${filename}`,
    category: 'references',
    name: formatLibraryName(filename),
    content: content as string
  };
});

export const DEFAULT_LIBRARY: LibraryItem[] = [
  ...dynamicVoice,
  ...dynamicInstructions,
  ...dynamicReferences,
  ...dynamicSkills,
  ...dynamicGold,
];


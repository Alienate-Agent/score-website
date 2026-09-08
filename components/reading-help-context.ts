'use client';

import {createContext} from 'react';
import type {GlossaryKey} from '@/lib/glossary';

// Keep the shared identity independent of hot-reloaded glossary styles and UI.
// A stale UI module and a new Term must still read the same provider.
export const ReadingHelp = createContext<{
  open: boolean;
  ready: boolean;
  show: (key: GlossaryKey | null, from: HTMLElement) => void;
} | null>(null);

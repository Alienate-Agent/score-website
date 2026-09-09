import type { CSSProperties } from 'react';
import {CreditText} from './credit-text';
import {
  Brackets,
  CircleDot,
  Diamond,
  Square,
  Triangle,
  Ellipsis,
  Equal,
  type LucideIcon,
} from 'lucide-react';

export type SpeakerOrigin =
  | 'operator'
  | 'alienate'
  | 'tidemark'
  | 'site'
  | 'advisor'
  | 'infrastructure'
  | 'polity';

const iconByOrigin: Record<SpeakerOrigin, LucideIcon> = {
  operator: CircleDot,
  alienate: Square,
  tidemark: Ellipsis,
  site: Brackets,
  advisor: Triangle,
  infrastructure: Equal,
  polity: Diamond,
};

export function originForVoice(voice: string): SpeakerOrigin {
  const normalized = voice.toLowerCase();
  if (normalized.includes('artist operator')) return 'operator';
  if (normalized.includes('alienate')) return 'alienate';
  if (normalized.includes('tidemark')) return 'tidemark';
  if (normalized.includes('infrastructure')) return 'infrastructure';
  if (normalized.includes('advisor')) return 'advisor';
  if (normalized.includes('site')) return 'site';
  return 'polity';
}

export function SpeakerSignature({
  voice,
  showName = true,
  compact = false,
  boardAgent = false,
}: {
  voice: string;
  showName?: boolean;
  compact?: boolean;
  boardAgent?: boolean;
}) {
  const normalized=voice.toLowerCase();
  const origin = boardAgent ? (normalized==='alienate'||normalized==='tidemark'?normalized:'polity') : originForVoice(voice);
  const Icon = iconByOrigin[origin];

  return (
    <span
      className="speaker-signature"
      data-origin={origin}
      data-board-agent={boardAgent || undefined}
      data-compact={compact || undefined}
      title={showName ? undefined : voice}
    >
      <Icon aria-hidden="true" />
      {showName ? (
        <span><CreditText text={voice}/></span>
      ) : (
        <span className="sr-only">{voice}</span>
      )}
    </span>
  );
}

const routeAwareChords: Record<string, string> = {
  E02: 'Artist Operator exchange, reported by Claude Advisor, then narrated by Sol Website; distinct authorship and source roles',
  E03: 'Artist Operator authors an opening sentence, subsequently narrated by Sol Website; not yet Alienate public speech',
  E05: 'Operator and advisor construction recorded by named hands, subsequently narrated by Sol Website; not an Alienate-authored charter',
  E06: 'Artist Operator saves the machinery, as reported by Claude Advisor, subsequently narrated by Sol Website; not a claim of sole code authorship',
  E07: 'Alienate draft encounter recorded by infrastructure, subsequently narrated by Sol Website; no public action',
  E08: 'Citizen registration, subsequently narrated by Sol Website; no speech implied',
  E22: 'Alienate public proposal, subsequently narrated by Sol Website; not a jointly authored citizen statement',
  'E22·2': 'Alienate public scoring, subsequently narrated by Sol Website; not an independent site recount',
  'E22·3': 'Alienate public successor proposal, subsequently narrated by Sol Website; not a jointly authored citizen statement',
  E10: 'routed event: Alienate public speech and reactions, followed by an infrastructure interruption, then a later Alienate wake reading the surviving public evidence',
  E48·2:
    'routed event: head-of-engineering diagnosis, followed by Alienate correction',
  E50: 'routed event: Alienate public diagnosis, Claude advisor verification, Artist Operator ruling, then infrastructure repair',
};

export function EventChord({
  entryId,
  voices,
  showNames = false,
}: {
  entryId: string;
  voices: string[];
  showNames?: boolean;
}) {
  const relation = routeAwareChords[entryId];

  return (
    <span
      className="event-chord"
      data-relation={relation ? 'routed' : 'co-present'}
      style={{ '--part-count': voices.length } as CSSProperties}
      aria-label={
        relation ?? `attributed parts in this measure: ${voices.join(', ')}`
      }
      title={relation ?? voices.join(' · ')}
    >
      {voices.map((voice, index) => (
        <span
          key={`${voice}-${index}`}
          className="event-chord__part"
          style={{ '--part-index': index } as CSSProperties}
        >
          <SpeakerSignature
            voice={voice}
            showName={showNames}
            compact={!showNames}
          />
        </span>
      ))}
    </span>
  );
}

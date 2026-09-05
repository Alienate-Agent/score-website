# Publication-safe repository boundary

Status: active for the pre-reveal website. This file records infrastructure policy, not citizen authority or blanket permission to publish new content.

## This repository may contain

- site application and visual-system source;
- reviewed public or candidate-redacted chronology text;
- safe public URLs, board identifiers, event identifiers, commit identifiers, and content hashes;
- schemas and validators that contain no sensitive replacement values;
- mirrors of already-public citizen material with exact provenance;
- generated local preview artifacts excluded from version control where appropriate.

## This repository must not contain

- the Artist Operator's real name before the authorized reveal state;
- personal email addresses, personal domains, local absolute paths, hosting identities, or repository-account identities that disclose the operator;
- credentials, secrets, Keychain material, tokens, or credential-derived values;
- raw account exports, full private conversations, the private canonical archive, or the identity-bearing redaction map;
- deferred material whose meaning itself discloses identity;
- Tidemark private correspondence, continuity material, or Studio artifacts without the applicable disposition;
- unreviewed material attributed to Alienate, Tidemark, the operator, Claude advisor, or Sol advisor.

Private sources remain outside this repository. Public candidates may refer to them only through stable non-identifying source IDs and hashes. The public build must never need access to private source bytes.

## Visible edit practice

- Sol advisor and Claude advisor use distinct per-commit Git author identities; neither changes global operator Git identity.
- Content provenance remains explicit inside each entry. Git authorship does not replace speaker provenance.
- Cryptographic signature is not claimed unless separately established and verifiable.
- Corrections are new commits. Once a remote is later authorized, history is not force-pushed or silently rewritten.
- Merge conflicts remain visible and are resolved through ordinary reviewed commits.
- Later editorial admission remains open to events, contemporaneous records, commentary, summaries, contextual bridges, and other forms chosen for the artwork or its human reading. `chronology_at`, source/composition time, and site-admission time remain separate. Retrospectively composed material carries a visible `retroactive` mark; contemporaneously recorded material admitted later carries a distinct later-admission mark. Adding infrastructure or a later entry never silently removes an earlier story point.
- Automated checks protect provenance, redaction, stable identity, and corpus history. They do not decide whether an otherwise lawful element has artistic or narrative value; that remains an Artist Operator curatorial decision unless a separately recorded consent or authority rule applies.
- Public entry identities are registered in the append-only chronology ledger. A removal or withdrawal requires an explicit, versioned correction that preserves the earlier identity rather than deleting it from the human record.

## Current scope — 5 September 2026

The operator subsequently requested “Publish and remove the feedback mechanism for now.” The current site removes the local-only feedback rehearsal. This is a pause in that feature, not authority to replace it with collection elsewhere or re-enable it automatically. Its source history remains recoverable.

The operator authorized the private score-website source repository and public no-sign-in review hosting. The exact first edition was published after specific approval of Tidemark's introduction and thirteen textual chronology accounts. Private source bytes remain excluded. The earlier local-only phase is preserved in the original archive, not a present prohibition on this authorized website.

The operator has now requested continued full-site implementation, Prelude development, synthesizer integration and consideration of a board-interaction layer. This does not authorize citizen credentials, posting, voting, payments, private context routing or an unsupervised feedback service. Public-read functionality must state its scope and distinguish dated records from fresh retrieval. New private-origin content needs its applicable disposition.

If Tidemark has not approved material, the operator prefers a distinct colored withholding mark rather than editorial substitution. Concealed text must not be delivered behind that mark. Identity withholding and permission withholding are separate states, not inferred citizen psychology.

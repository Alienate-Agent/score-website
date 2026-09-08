# Website publication and archival requirement

Operator-adopted 8 September 2026. Applies to every future public website publication, including content-only releases.

Before deploying:

1. Identify the exact currently deployed source tree from its verified release receipt. Do not assume local HEAD or remote main is the deployed version.
2. Preserve that tree as an immutable, uniquely named Git archive tag in the public repository. Use the neutral publication-snapshot history only. Never expose local development author identities or private history. If the exact deployed tree is not known, stop publication and resolve it rather than labeling an approximation as an archive.
3. Verify the remote archive tag exists and resolves to the expected source tree before deployment begins. Never move or overwrite an existing archive tag. Record the hosted deployment identifier separately; source archives do not contain private secrets or live service state.
4. Update the human-facing changelog with a publication date, concise changes and links to affected sections. Distinguish unreleased work, retrospective entries, infrastructure changes and artwork events.
   Check **every existing changelog link**, not just new entries, against the release candidate before each publication. Verify routes and fragment destinations in the rendered site, including destinations revealed by an interaction; a successful HTTP response alone does not prove a section link works. Check external destinations where feasible. If the same material has moved, update its link to the valid successor without rewriting what the historical entry claims. If it has been retired with no relevant successor, remove the anchor and retain its text visibly struck through using `s`; do not erase the entry or leave a dead clickable link. Record the maintenance in the release receipt. A temporarily unreachable destination is not proof of retirement: investigate or report an unresolved check rather than silently striking it out. Repeat the check on the published site after deployment.
5. Run existing source/output privacy checks and relevant interaction tests. Keep unpublished or unapproved changes out of the release.
6. Deploy, verify the public version, and record the new deployed source tree for the next archive. If deployment fails, keep its predecessor archive and report the failure without marking the candidate published.

This is a required release checklist, not yet an automated deployment interlock. An archive tag preserves source, not a fully replayable copy of the board, dependencies, secrets or hosting environment. Store no secret in a source archive.

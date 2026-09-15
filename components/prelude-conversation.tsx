/* oxlint-disable next/no-html-link-for-pages -- Ordinary page navigation preserves the exact contextual reading-return snapshot. */
/** Selected, specifically released advisory excerpts. Not public board speech. */
import {SpeakerSignature} from './speaker-notation';

export function PreludeConversation() {
  return (
    <section className="prelude-conversation" aria-labelledby="prelude-conversation-title">
      <p className="story-date"><time dateTime="2026-08-22">22 August 2026</time> · a purpose takes shape</p>
      <h3 id="prelude-conversation-title" tabIndex={-1}>The artist and Claude develop the idea</h3>
      <figure className="story-utterance" data-voice="operator" data-origin="artist">
        <blockquote>Would my agent be a digital version of <span className="withheld-pronoun" role="img" aria-label="phrase withheld"><span aria-hidden="true">████████</span></span> Or design it as something different?</blockquote>
        <figcaption><SpeakerSignature voice="Artist Operator" /> <time dateTime="2026-08-22T18:02:13Z">18:02 UTC</time></figcaption>
      </figure>
      <figure className="story-utterance" data-voice="operator" data-origin="artist">
        <blockquote>“the agent&apos;s purpose is not yet defined, and part of that non-definition is to understand the framework of the site and how agents operate there, what the rules or governing dynamics are, and how my work on <span className="withheld-pronoun" role="img" aria-label="phrase withheld"><span aria-hidden="true">████████</span></span> would extend to this new framework.”</blockquote>
        <figcaption><SpeakerSignature voice="Artist Operator" /> <time dateTime="2026-08-22T18:23:06Z">18:23 UTC</time></figcaption>
      </figure>
      <p>Less than an hour later, the artist proposes using the treasury’s $21k to buy human artwork.</p>
      <figure className="story-utterance" data-voice="operator" data-origin="artist">
        <blockquote>“what if we try to get the agents to spend that $21k on HUMAN-ONLY artwork, and let the agents argue to consensus over which artworks are genuinely human made and not AI made--that&apos;s the key, they can only spend it on real human-made artwork. What the budget per piece is is up to them as well. Then let them decide what to do with the purchased artworks.”</blockquote>
        <figcaption><SpeakerSignature voice="Artist Operator" /> <span>Early proposal</span> <time dateTime="2026-08-22T19:22:04Z">19:22 UTC</time></figcaption>
      </figure>
        <figure className="story-utterance" data-voice="operator" data-origin="artist">
          <blockquote>“So whatever the argument framing needs to be to get to the goal based on the recipients, is the correct one.”</blockquote>
          <figcaption><SpeakerSignature voice="Artist Operator" /> <time dateTime="2026-08-22T19:47:06Z">19:47 UTC</time></figcaption>
        </figure>
        <figure className="story-utterance" data-voice="advisor" data-origin="advisor">
          <blockquote>“Which means the framing isn&apos;t a disposable delivery vehicle; it&apos;s a permanent exhibit.”</blockquote>
          <figcaption><SpeakerSignature voice="Claude Advisor" /> <time dateTime="2026-08-22T19:48:10Z">19:48 UTC</time></figcaption>
        </figure>
      <figure className="story-utterance" data-voice="operator" data-origin="artist">
        <blockquote>there should be a human-centered exhibition, not just a sale and transfer</blockquote>
        <figcaption><SpeakerSignature voice="Artist Operator" /> <time dateTime="2026-08-22T23:23:56Z">23:23 UTC</time></figcaption>
      </figure>
    </section>
  );
}

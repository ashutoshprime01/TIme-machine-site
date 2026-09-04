// Username history — visualize alias appearances over time (master prompt,
// USERNAME HISTORY). Each alias keeps its own lane: if multiple possible
// identities exist they stay separate, and a username match is never read
// as "same person".

import type { IdentityReport } from "@/lib/types";
import { captureYear } from "@/lib/security/url";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function UsernameHistory({ aliases }: { aliases: IdentityReport["aliases"] }) {
  const usernames = aliases.filter((a) => a.type === "username");
  const names = aliases.filter((a) => a.type === "name");

  if (aliases.length === 0) {
    return (
      <p className="text-sm text-mist">
        No username or name history could be reconstructed from public evidence —
        nothing was observed, so nothing is shown.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {usernames.length > 0 && (
        <div>
          <p className="eyebrow">Usernames</p>
          <ol className="mt-4 space-y-3">
            {usernames.map((a) => (
              <li
                key={a.alias}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-xl border border-white/10 bg-panel/60 px-4 py-3"
              >
                <span className="font-mono text-sm text-amber-bright/90">@{a.alias}</span>
                <span className="font-mono text-[11px] tabular-nums text-mist">
                  {a.firstSeen ? captureYear(a.firstSeen) : "?"} →{" "}
                  {a.lastSeen ? captureYear(a.lastSeen) : "present"}
                </span>
                <span className="text-xs text-faint">{a.source}</span>
                <ConfidenceBadge level={a.confidence} />
              </li>
            ))}
          </ol>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-faint">
            A username appearing in multiple places links those public pages —
            it never proves they belong to the same person. If another public
            presence uses this handle, it is kept separate by design.
          </p>
        </div>
      )}

      {names.length > 0 && (
        <div>
          <p className="eyebrow">Public names</p>
          <ol className="mt-4 space-y-3">
            {names.map((a) => (
              <li
                key={a.alias}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-xl border border-white/10 bg-panel/60 px-4 py-3"
              >
                <span className="text-sm text-fog">{a.alias}</span>
                <span className="font-mono text-[11px] tabular-nums text-mist">
                  first observed {a.firstSeen ? captureYear(a.firstSeen) : "?"}
                </span>
                <span className="text-xs text-faint">{a.source}</span>
                <ConfidenceBadge level={a.confidence} />
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-faint">
            Names shown are public display-name fields observed on public
            profile pages — nothing is inferred beyond what the pages state.
          </p>
        </div>
      )}
    </div>
  );
}

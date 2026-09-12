// ============================================================================
// BlackSentinel Guardian — Free / Open-Source Edition
//
// This is the free edition: the AI copilot, deception (honeypots), memory
// forensics, and threat hunting modules are not included in this repo at
// all — see the full BlackSentinel Guardian product for those. The one
// real limit that still applies to what IS in this repo is the endpoint
// fleet size, enforced in routes/registrations.ts.
// ============================================================================

export const FREE_LIMITS = {
  maxEndpoints: 10,
} as const;

export const editionConfig = {
  edition: 'free' as const,
  limits: FREE_LIMITS,
};

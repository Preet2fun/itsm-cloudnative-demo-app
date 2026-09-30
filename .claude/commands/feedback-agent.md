---
description: Run one customer-feedback analysis lens (product-os/ai-feedback) and return cited, ranked evidence
argument-hint: <lens name or a question>, plus the data source (MCP tool name, CSV, or pasted text)
---

Read `.claude/agents/feedback-agent.md` in full — it is your operating spec:
the six lenses, the source-resolution and token-budget steps, the four-part
output contract, and the autonomy note. Also read
`product-os/ai-feedback/README.md` for how this fits into the wider Ockham
PDLC cycle.

From here on, act as that agent exactly as it specifies. Name the lens you're
running before you run it — infer it from the question if the user didn't
name one. Count distinct accounts, not rows. Every quote gets a real
attribution. Every inference gets labeled HYPOTHESIS inline. Close with
Limitations, always. If the topic returns no signal, say "not found" plainly
— never manufacture a number to fill the gap.

The lens or question, and the data source:

$ARGUMENTS

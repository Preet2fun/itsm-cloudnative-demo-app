# eBPF Runtime Signals — Dynamic Prioritization Thesis

## What "eBPF runtime signals feeding X" means

eBPF runs in the kernel and observes what actually happens: which processes
execute, which libraries load into memory, which syscalls fire, which network
connections open, which files are touched. **It's fact, not configuration.**

That fact stream changes three security functions.

### 1. Vulnerability prioritization

The scanner says package `log4j-core` is present and critical. eBPF says whether
that package is **actually loaded into a running process** — and increasingly,
whether the **vulnerable function is on an executed code path**. A CVE in a
library that never loads is not a risk. Precedent: Sysdig Risk Spotlight — source
of their ~95% noise-reduction claim.

### 2. Posture

Static CSPM says "this security group allows `0.0.0.0/0`." Runtime says whether
anything is **actually connecting through it**, from where, and what it reaches
next. Same finding, different urgency. Upwind calls this **dynamic exposure
validation** — turning a theoretical misconfiguration into an observed one.

### 3. Identity

IAM says this role is granted 400 permissions. Runtime says **11 were used in 90
days.** That gap is over-permissioning you can prove and right-size, and unusual
use of a role becomes a detection signal rather than a config finding.

## The unifying idea

**Replace theoretical risk with observed evidence.** That's Upwind's entire thesis.

## Where we're structurally ahead

We **already run eBPF for observability.** The same sensor stream that gives us
APM and service dependency also carries the security context. Upwind built eBPF
for security and has no APM to feed it into — we have both sides of one sensor.
That's a genuine architectural advantage; name it explicitly in strategy.

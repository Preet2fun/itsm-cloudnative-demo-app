# Playbook: Cloud-Migration / Kubernetes Milestone

**Trigger:** the *Kubernetes / cloud-migration milestone* signal
([`../signal-library.md`](../signal-library.md)) — first Platform Engineer / EKS
hires, a KubeCon / re:Invent talk, a migration case study, or a public statement
that hyperscaler-native tooling isn't enough anymore.

**Situation:** eBPF, CSPM, and CDR only pay off once there's real Kubernetes
surface. This is the moment the one-sensor thesis becomes concrete — and the
cheapest time to adopt it, before a second toolchain gets entrenched.

## The play

1. Confirm the milestone and how recent it is (~6 months). Score the account.
2. Target the **VP Eng / platform lead**, and the **security lead** if the
   account also just made a security hire (combination signal → dual thread).
3. Lead with **one sensor feeds both**: at the point you're standing up
   Kubernetes properly, the kernel-level sensor that gives you monitoring also
   gives you runtime security — adopt it now and you don't buy the second stack.
4. Tie to the hyperscaler-native ceiling — AWS Security Hub / GuardDuty is a
   baseline they'll outgrow; get ahead of it.

## What to say

> One sensor at the kernel feeds both your monitoring and your runtime security.
> The point where you're standing up Kubernetes properly is when that's cheapest
> to adopt — before you've bought and wired in a second toolchain you'll want to
> consolidate later.

## What not to do

- Don't assume they've hit the pain yet — frame it as "before it becomes a
  bottleneck," not "you must be struggling with this."
- Don't get lost in eBPF internals with a non-technical contact — that's the
  technical-buyer thread.
- Don't ignore that this is often a *Tier 2* on its own; it goes Tier 1 in
  combination with a security hire or a compliance deadline.

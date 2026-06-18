---
name: Bug report
about: Something is broken or behaving unexpectedly
title: 'bug: <short description>'
labels: bug, triage
assignees: preet2fun
---

## Summary

<!-- One sentence: what is broken and where. -->

## Component

<!-- Which component is affected? -->
- [ ] user-service
- [ ] asset-service
- [ ] incident-service
- [ ] frontend (Synap UI)
- [ ] Istio / networking
- [ ] OPA / RBAC
- [ ] Database / migrations
- [ ] Helm chart / K8s manifests
- [ ] Other: ___

## Tenant Context

<!-- Multi-tenant system — which tenant(s) are affected? -->
- [ ] Affects a specific tenant only (tenant slug: `___`)
- [ ] Affects all tenants
- [ ] Cross-tenant data leak (mark as security vulnerability instead — see SECURITY.md)
- [ ] Not tenant-specific

## Steps to Reproduce

1.
2.
3.

## Expected Behaviour

## Actual Behaviour

## Logs / Screenshots

<!-- Paste relevant kubectl logs, curl responses, or screenshots. -->
```
```

## Environment

- Platform version: `v___`
- Service version: `v___`
- Kubernetes: <!-- `kubectl version --short` output -->
- Istio: <!-- `istioctl version` output, if relevant -->
- Browser (if UI bug):

## Additional Context

# Stage 07 — Evidence Gathering

**Purpose:** get the numbers that back the problem and the opportunity, and label
exactly how solid each one is.

**Inputs:** `01`–`06`; connected analytics / warehouse / logs / tickets; market
sources from stage 04; `data-analysis/` if populated (quantitative);
`ai-feedback/` lens output from stage 05 (customer-feedback counts, tagged
`[Feedback: …]`).

**Do:**
1. For each claim the PRD will make (impact of the problem, addressable base,
   adoption ceiling, cost, market size), get a figure and a source.
2. **Run it live** where you can. Record the query / source and the run date.
3. Tag every figure **Measured / Assumed / Gated** (`citations.md`):
   - Measured — verified live this run.
   - Assumed — estimate; state the basis.
   - Gated — depends on a source you couldn't confirm; **do not present as
     proven**; raise a §14 risk + §15 open question.
4. For each figure, write one line on **what it proves and what it does not**
   (guard against a scale number standing in for an adoption number).
5. Build the **Evidence Appendix** rows: claim · citation · source type.

**Produce — `07-evidence-gathering.md`:** Evidence table (claim · value ·
tag · citation · proves / does-not-prove) · Evidence Appendix rows · list of
Gated items carried forward.

**Gate:** every number the PRD will cite is in this file with a tag. Gated items
are all mirrored into risks/open questions.

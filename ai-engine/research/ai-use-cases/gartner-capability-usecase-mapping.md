# ITSM AI: Capability Definitions, Use Case Mapping & Product Value Guide
**Aligned to:** Gartner Magic Quadrant for AI Applications in ITSM — 2 September 2025 (G00823161)
**Companion to:** `gartner-ai-itsm-use-cases.md` (real-world examples for each use case)

---

## Purpose of This Document

This document gives product teams a single source of truth for:
1. **What Gartner defines** as each critical AI capability in ITSM — exact definitions, no paraphrasing
2. **Where each capability sits** within Gartner's 4 buyer use case buckets
3. **What scope** is required to implement each capability in a product
4. **What value** the capability delivers — framed as outcomes, not features
5. **How to stay aligned** with Gartner's market definitions when roadmapping, positioning, or evaluating vendor claims

> **Critical Gartner Market Signal (2025):** Despite widespread marketing of "agentic AI" in ITSM, Gartner found that *few solutions currently deliver true agentic capabilities* — such as autonomous planning, adaptive tool orchestration, or multistep workflow execution. Most offerings remain primarily assistive. Product teams should distinguish clearly between assistive AI features and genuine agentic capabilities. This distinction is now a key market differentiator.

---

## Part 1: Framework Overview — How Capabilities Map to Use Cases

Gartner structures this market around **4 buyer use cases** (who buys and why) and **7 critical capabilities** (what the product must do). Understanding this framework is essential for roadmap prioritization and market positioning.

```
┌─────────────────────────────────────────────────────────────────────┐
│              GARTNER'S 4 USE CASE BUCKETS                           │
├──────────────────────┬───────────────────────────────────────────── │
│ USE CASE             │ CRITICAL CAPABILITIES REQUIRED               │
├──────────────────────┼──────────────────────────────────────────────┤
│ AI for End-User      │ → Virtual Support Agent (PRIMARY)            │
│ Self-Service         │ → AI Search (PRIMARY)                        │
├──────────────────────┼──────────────────────────────────────────────┤
│ AI for ITSM          │ → Agent Advisory (PRIMARY)                   │
│ Practitioners        │ → IT Content Generation (PRIMARY)            │
├──────────────────────┼──────────────────────────────────────────────┤
│ AI for ITSM          │ → Case Clustering (PRIMARY)                  │
│ Practice Leads       │ → Operations Assistant (PRIMARY)             │
├──────────────────────┼──────────────────────────────────────────────┤
│ AI for Autonomous    │ → Agentic ITSM (PRIMARY)                     │
│ ITSM                 │ → IT Content Generation (SUPPORTING)         │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Quick Reference: Capability × Use Case × Feature Count

| Critical Capability | Gartner Use Case | Features in Companion Doc |
|---|---|---|
| Virtual Support Agent | AI for End-User Self-Service | 1 (VSA) |
| AI Search | AI for End-User Self-Service | 3 (Public LLM, Custom LLM, RAG) |
| Agent Advisory | AI for ITSM Practitioners | 7 (Triage, Categorization, Escalation, Risk Advisory, Routing, Swarming, Sentiment) |
| IT Content Generation | AI for ITSM Practitioners + Autonomous ITSM | 6 (Knowledge Gen, Auto Comms, 4× Case Summarization types) |
| Case Clustering | AI for ITSM Practice Leads | 5 (Major Incident, Problem Detection, RCA, Change Optimization, Knowledge Topic Detection) |
| Operations Assistant | AI for ITSM Practice Leads | 1 (Operations Assistant) |
| Agentic ITSM | AI for Autonomous ITSM | 2 (Zero-Touch Service Desk, Autonomous AIOps+ITSM) |

---

## Part 2: Gartner Use Case Deep Dives

---

### USE CASE 1 — AI for End-User Self-Service

#### Gartner Definition
> *"I&O teams that prioritize the shift-left and deflection of IT service desk contacts using AI to enable business consumer autonomy. This use case focuses on virtual support agent and IT knowledge discovery capabilities. I&O leaders responsible for the IT service desk look to AI-driven engagement channels to enhance their multiexperience strategy. This use case is driven by the need for cost optimization through call deflection and enhanced service delivery experience goals. Momentum for AI-driven self-service has been accelerated by the introduction of generative AI solutions that simplify the configuration and enable more natural conversations."*

#### Target Persona & Buyer Signal
- **Primary Buyer:** Head of IT Service Desk, VP of Infrastructure & Operations (I&O)
- **Budget Driver:** IT labor cost reduction, ticket deflection ROI, employee experience scores
- **Trigger Events:** Growing ticket volumes with flat headcount, CSAT decline, employee experience transformation programs

#### Primary Capabilities Required
- **Virtual Support Agent** (see Critical Capability 1)
- **AI Search** (see Critical Capability 4)

#### Features from Companion Document
| Feature | Type | Description |
|---|---|---|
| Virtual Support Agent | `AGENTIC AI` | Autonomous conversational interface that resolves IT issues and performs transactions |
| Public Knowledge Discovery | `NORMAL AI` | LLM-powered search across public documentation and vendor knowledge bases |
| Proprietary Knowledge Discovery | `NORMAL AI` | Custom LLM trained on private organizational knowledge |
| Universal Knowledge Discovery (RAG) | `NORMAL AI` | Real-time retrieval from all knowledge sources combined with LLM generation |

#### Product Value Delivered
| Metric | Typical Range | Source Signal |
|---|---|---|
| Ticket deflection rate | 40–65% of Tier-1 tickets | DXC Technology: 65%; Chevron: 40% |
| Cost per ticket reduction | $6–$12 per ticket saved | DXC Technology: $8.50/ticket |
| Self-service resolution time | Minutes vs. hours | Autodesk: under 3 min vs. 4+ hours prior |
| Knowledge search time reduction | 40–50% | Microsoft Internal IT: 50% reduction |
| First-contact resolution improvement | +18–31 percentage points | Lloyds Banking Group: 61% → 79% |

#### Product Scope: What Building This Requires
- **Conversational AI layer:** NLP/LLM for intent recognition, dialog management, multi-turn conversation handling
- **Channel integrations:** Microsoft Teams, Slack, web portal, mobile — users must be able to reach the VSA in their natural workflow
- **ITSM backend integrations:** ServiceNow, Jira SM, BMC, Freshservice — to read and write ticket data, trigger fulfillment actions
- **Action execution layer:** Active Directory (password resets), identity/access management (Okta, AD groups), device management (JAMF, Intune), software deployment tools
- **Knowledge indexing pipeline:** Connectors to KB systems, vector database for RAG, embedding model for semantic search
- **Continuous learning loop:** Feedback mechanism to improve intent recognition and knowledge relevance over time

#### Product Manager Considerations
- VSA effectiveness depends critically on knowledge base quality and coverage — a weak KB produces a poor VSA regardless of AI quality
- Channel support breadth (Teams, Slack, portal, mobile) directly determines adoption rate
- GenAI has dramatically lowered the configuration effort for VSAs — this is now a market expectation, not a differentiator
- Measure deflection rate AND resolution quality — deflection without resolution just delays tickets and damages trust

---

### USE CASE 2 — AI for ITSM Practitioners

#### Gartner Definition
> *"I&O teams that prioritize accelerating ITSM practice execution with intelligent recommendations, actions and content creation. This use case focuses on agent advisory and IT content generation capabilities. I&O leaders want to transform traditional practices and improve human agent accuracy by leveraging AI to provide recommendations that reduce manual steps and accelerate the generation of content. Examples of AI-automated tasks within the workflows include categorizing incidents, executing a risk analysis of a change, identifying relevant subject matter experts, and linking or creating knowledge articles from incidents."*

#### Target Persona & Buyer Signal
- **Primary Buyer:** IT Service Desk Manager, Change Manager, Incident Manager, IT Operations Lead
- **Budget Driver:** Agent productivity, accuracy improvement, SLA compliance, reduction of manual ITSM overhead
- **Trigger Events:** High agent handle times, SLA breach rates, poor categorization accuracy, change-related incidents, knowledge base gaps

#### Primary Capabilities Required
- **Agent Advisory** (see Critical Capability 2)
- **IT Content Generation** (see Critical Capability 5)

#### Features from Companion Document
| Feature | Type | Description |
|---|---|---|
| Intelligent Triage | `NORMAL AI` | AI prioritization guidance for incoming incidents |
| Intelligent Categorization | `NORMAL AI` | Auto-classification by service, CI, or solution type |
| Intelligent Escalation | `NORMAL AI` | Proactive SLA breach prevention |
| Intelligent Risk Advisory | `AGENTIC AI` | Change risk scoring from historical clustering |
| Intelligent Routing | `AGENTIC AI` | Autonomous ticket assignment to best resolver |
| Intelligent Swarming | `EMERGING AI` | AI-assembled expert collaboration for complex incidents |
| Sentiment Analysis | `NORMAL AI` | DEX monitoring and frustration detection |
| IT Knowledge Generation | `NORMAL AI` | GenAI KB article creation from case data |
| Automatic Communications | `NORMAL AI` | AI-drafted incident and change notifications |
| Incoming Request Summarization | `NORMAL AI` | Concise ticket briefs for assigned agents |
| Post-Call Wrap-Up | `NORMAL AI` | Structured case notes from shorthand agent notes |
| Major Incident Summarization | `NORMAL AI` | PIR-ready summaries from incident timelines |
| ITSM Report Generation | `NORMAL AI` | Automated postincident and postrelease reviews |

#### Product Value Delivered
| Metric | Typical Range | Source Signal |
|---|---|---|
| Triage/categorization accuracy improvement | Miscategorization reduced from 28% → 6% | Unilever: 94% accuracy |
| SLA breach reduction | 35–52% fewer breaches | BT: 52%; Capgemini: 99.2% SLA compliance |
| Change-related incident reduction | 22–42% fewer incidents | T-Mobile: 22%; NAB: 42% |
| KB article creation increase | 10–17× volume increase | HCA Healthcare: 200 → 3,400 articles/year |
| Agent after-call work reduction | 75% time reduction | T-Mobile: 6 min → 90 sec per ticket |
| Stakeholder communication speed | 7–8× faster | Warner Bros.: 25 min → 3 min to first comms |

#### Product Scope: What Building This Requires
- **ML pipeline for advisory features:** Training on historical ticket data (needs 12+ months of quality data minimum), model re-training cadence, confidence scoring
- **ITSM data integration:** Deep read/write access to incident, change, problem, and knowledge records; CMDB access for CI context
- **NLP for categorization/triage:** Multi-label classification models, intent extraction from free-text ticket descriptions
- **GenAI content generation layer:** LLM with appropriate context windows for summarization, structured output formatting, tone/style guardrails
- **Change management integration:** Access to change calendar, historical change records with outcome data (especially incidents linked to changes)
- **Feedback loop:** Agent acceptance/rejection of AI recommendations feeds back into model quality; critical for advisory feature accuracy over time

#### Product Manager Considerations
- Agent Advisory features require high-quality historical ticket data — new implementations need a data readiness assessment before promising accuracy levels
- Content generation (summarization, knowledge gen, wrap-up) typically has the fastest time-to-value — no model training required, just LLM integration
- Advisory features (triage, categorization, routing) take 3–6 months of model training and feedback cycling to reach meaningful accuracy
- Intelligent swarming requires organizational change (moving from tier-based to swarm model) — the AI capability is easier to build than the cultural adoption
- Risk Advisory is often the highest-value change management AI feature — prioritize if your buyers have frequent change-related outages

---

### USE CASE 3 — AI for ITSM Practice Leads

#### Gartner Definition
> *"I&O teams that prioritize using AI to transform how they access and analyze ITSM data, uncovering patterns and trends that enhance their decision-making ability. This use case focuses on case clustering and operations assistant capabilities. ITSM practice leads are being challenged to support increasingly complex environments. This use case emphasizes analyzing case, knowledge, asset and other ITSM metadata for commonalities (clustering) to support key decisions, such as problem identification, prioritization, and root cause analysis, and major incident identification. Operations assistants provide a natural language UI to improve accessibility to these insights."*

#### Target Persona & Buyer Signal
- **Primary Buyer:** Problem Manager, Major Incident Manager, Service Delivery Manager, Head of IT Operations, CIO
- **Budget Driver:** Reduction of repeat incidents, faster problem resolution, improved operational insight, reduced major incident duration
- **Trigger Events:** High volumes of repeat incidents, slow problem management cycles, complex multi-system environments, board-level pressure on IT resilience and reliability

#### Primary Capabilities Required
- **Case Clustering** (see Critical Capability 6)
- **Operations Assistant** (see Critical Capability 3)

#### Features from Companion Document
| Feature | Type | Description |
|---|---|---|
| Operations Assistant | `AGENTIC AI` | Conversational practitioner co-pilot with system query and action execution |
| Major Incident Detection | `NORMAL AI` | Ticket cluster analysis to detect high-impact events before monitoring fires |
| Problem Detection | `NORMAL AI` | Recurring incident correlation to proactively create problem records |
| Root Cause Analysis | `AGENTIC AI` | Autonomous multi-system investigation to diagnose root causes |
| Change Optimization | `NORMAL AI` | Pattern analysis to standardize and pre-approve recurring changes |

#### Product Value Delivered
| Metric | Typical Range | Source Signal |
|---|---|---|
| Major incident detection lead time | 30–47 min earlier than monitoring | Comcast: 47 min earlier; American Airlines: 30 min earlier |
| Repeat incident volume reduction | 40–65% fewer repeats | Zalando: 40%; NHS Digital: thousands of incidents prevented |
| Problem record creation speed | 94% faster | Lufthansa: 4 hours → 15 minutes |
| RCA cycle time reduction | 75–90% faster | Capital One: 8 hours → 90 min; Deutsche Bank: 73% autonomous |
| Change optimization | 28–35% of changes automated or pre-approved | Delta: 35%; Mastercard: 28% |
| P1 MTTR improvement | 30–41% faster | Capital One: 41%; Walmart: 38% |

#### Product Scope: What Building This Requires
- **Incident clustering engine:** ML-based similarity detection (NLP embeddings, CI/CMDB linkage, time-window analysis) — this is computationally intensive and requires real-time processing for major incident detection
- **Problem management integration:** Ability to automatically create and populate problem records in the ITSM platform with clustering evidence
- **Topology/dependency data:** CMDB and infrastructure topology integration is essential for RCA — without it, clustering has no causal context
- **Change data linkage:** Change records must be correlated with incident data to enable change-related pattern detection (optimization and risk advisory)
- **Operations Assistant NLP layer:** Natural language query interface across ITSM data — requires schema understanding, query translation, and structured response generation
- **Monitoring/AIOps integration:** For major incident detection to work in context, integration with monitoring platforms (Dynatrace, Splunk, Datadog) adds significant accuracy
- **Knowledge topic detection (sub-feature):** Analyze tickets with no KB article linked to surface knowledge gaps — requires KB integration and embedding-based gap analysis

#### Product Manager Considerations
- Case clustering is the most technically demanding capability to build correctly — clustering quality depends heavily on data richness (CMDB quality, structured ticket metadata, CI linkage)
- Major incident detection from ticket clusters is a high-value differentiator — most AIOps platforms miss user-reported incidents; this catches what monitoring doesn't
- Operations Assistant is the user experience layer on top of clustering — don't build clustering without building the UI to surface its insights accessibly
- RCA is where the line between Normal AI and Agentic AI blurs most — define clearly how much autonomous investigation your product performs vs. how much requires human direction
- Knowledge topic detection (missing KB article detection from ticket clusters) is a sub-feature worth noting explicitly — it closes the knowledge management loop by identifying gaps automatically

---

### USE CASE 4 — AI for Autonomous ITSM

#### Gartner Definition
> *"I&O teams that prioritize agent-to-agent interactions using an underlying intelligence to handle ITSM tasks independent of human directions. This use case focuses on agentic AI and IT content generation capabilities. I&O leaders aspire toward an autonomous future with integration of intelligent AI agents into IT service management processes, enabling automation of service desk operations without human intervention. Through a network of interconnected AI agents, autonomous ITSM can derive deep insights and analyze vast amounts of environmental data, enabling proactive decision making and operational efficiency across ITSM practices."*

#### Target Persona & Buyer Signal
- **Primary Buyer:** CIO, Head of I&O, Digital Transformation Lead
- **Budget Driver:** Zero-touch service desk vision, FTE optimization, 24/7 operational coverage without headcount, AI-first IT strategy
- **Trigger Events:** Board-level digital transformation mandates, cost reduction targets, AI-first IT strategy, desire to lead the Gartner 2030 zero-touch benchmark

#### Primary Capabilities Required
- **Agentic ITSM** (see Critical Capability 7)
- **IT Content Generation** (supporting)

#### Features from Companion Document
| Feature | Type | Description |
|---|---|---|
| Zero-Touch Service Desk | `EMERGING AI` | Full autonomous lifecycle management of IT requests without human agents |
| Autonomous AI Operations (AIOps+ITSM) | `EMERGING AI` | Integrated detection-to-remediation loop operating autonomously |

#### Product Value Delivered
| Metric | Typical Range | Source Signal |
|---|---|---|
| Autonomous resolution rate (aspirational) | 65–80% of all tickets | DXC: 65% today; Unilever targeting 70% by 2027 |
| Cost per service desk contact reduction | $8–15 per ticket | Compound effect of all autonomous capabilities |
| IT support headcount scalability | 3× volume, flat headcount | Atlassian: 3× requests per agent without new hires |
| Detection-to-remediation time | Seconds to minutes (vs. hours) | Google SRE: seconds for known failure patterns |
| MTBF (Mean Time Between Failures) impact | Reduced through autonomous prevention | Netflix: 99.99%+ availability via autonomous resilience |

#### Product Scope: What Building This Requires
- **Agent orchestration framework:** Ability to compose multiple AI agents (VSA agent, triage agent, RCA agent, routing agent) into coordinated workflows — this is architecturally distinct from building individual features
- **Autonomous action permissions model:** Governance layer that defines what the AI can do without human approval vs. what requires escalation; critical for organizational trust and safety
- **Tool use and API access:** Agentic AI requires the ability to call external systems (ITSM APIs, monitoring APIs, AD, CMDB) as tools — similar to LLM tool-use architectures
- **Goal-driven planning capability:** Unlike rule-based automation, agentic ITSM requires the AI to plan sequences of actions to achieve a goal when no explicit script exists
- **Memory and context across interactions:** Agents must retain context across a resolution session — understanding what they've tried and what failed
- **Human-in-the-loop escalation:** For actions beyond granted permissions, the agent must know when to pause and request human authorization
- **Monitoring integration:** For AIOps-ITSM convergence, bidirectional integration with monitoring platforms enables fully closed detection-to-remediation loops

#### Product Manager Considerations
- **This is the least mature capability in the market** — Gartner explicitly states that few products deliver true agentic ITSM in 2025; positioning here carries marketing risk
- Agentic ITSM is architecturally different from assistive AI — it requires an agent orchestration layer, not just more AI features bolted onto existing ITSM workflows
- Organizational trust and permission governance is as much a product design challenge as the AI itself — customers must be able to define exactly what the AI is and isn't allowed to do autonomously
- IT Content Generation plays a supporting role here — autonomous agents must generate quality communications, documentation, and summaries without human review
- The 20% zero-touch target by 2030 (Gartner) creates a clear product roadmap horizon — build toward it incrementally, starting with high-volume, low-risk automated request categories

---

## Part 3: Critical Capability Deep Dives

---

### CAPABILITY 1 — Virtual Support Agent

#### Gartner Exact Definition
> *"Conversational interfaces that provide IT support to business consumers by resolving common issues, answering questions and performing transactions. This is an IT-support-specific subset of virtual assistants that use chatbot capabilities but also take actions such as reset passwords, deploy software, escalate support requests, and execute scripts to restore IT services. These are evaluated by the ability to apply natural language capabilities to effectively and accurately address a wide range of end-user support issues, integration into ITSM data and workflows, channel support, consumer-friendly user experiences, and the ability to adapt over time."*

#### Gartner Evaluation Criteria
Gartner evaluates VSA on:
1. NLP quality — accuracy across a wide range of end-user support issues
2. ITSM data and workflow integration depth
3. Channel support breadth (Teams, Slack, portal, mobile, email)
4. Consumer-friendly user experience
5. **Ability to adapt over time** — continuous learning, not static scripts

#### Capability Components (Feature Checklist)
- [ ] Natural language intent recognition across common IT issue types
- [ ] Multi-turn conversation management (handles clarification, disambiguation)
- [ ] Password reset execution (AD/IdP integration)
- [ ] Software deployment/provisioning
- [ ] Access request fulfillment (RBAC, AD groups)
- [ ] IT FAQ resolution from knowledge base
- [ ] Escalation to human agent (with context handoff)
- [ ] Script execution for service restoration
- [ ] ITSM ticket creation, update, and closure
- [ ] Channel support: Teams, Slack, web portal, mobile
- [ ] Continuous learning from resolution feedback

#### Aligned Gartner Use Case
**AI for End-User Self-Service** (Primary capability)

#### Mapped Features from Companion Doc
- Use Case 1: Virtual Support Agent

#### Product Scope Summary
**Data Needed:** Historical ticket data, KB articles, ITSM workflow definitions, CMDB (for CI-specific support)
**Integrations Required:** ITSM platform (R/W), Identity/Access systems (Okta/AD), Device management (Jamf/Intune), Collaboration platforms (Teams/Slack)
**AI Components:** Intent classification model, entity extraction, dialog state management, LLM for generative responses, RAG for KB retrieval
**Minimum Viable:** Intent recognition + KB retrieval + ticket creation + human escalation with context

#### Value Statement (Product Positioning)
> VSA directly addresses the #1 ITSM cost driver — Tier-1 ticket volume. By resolving 40–65% of contacts autonomously, VSA converts variable labor costs into fixed infrastructure costs while extending IT support coverage to 24/7 without additional headcount. GenAI has raised the market baseline: customers now expect conversational, adaptive VSAs — not scripted chatbots.

---

### CAPABILITY 2 — Agent Advisory

#### Gartner Exact Definition
> *"Analyzes ITSM data and metadata to generate recommendations that accelerate human agent response in ITSM practices. There are multiple components evaluated within this capability, including the ability to enable: Intelligent triage for guidance on prioritization; Intelligent categorization of cases by service, configuration item, or solution; Intelligent escalation of cases before they hit timed service-level thresholds; Intelligent risk advisory of planned changes using similar release history (clustering); Intelligent routing to identify suitable and available resolver groups; Intelligent swarming to identify experts, including those from outside of IT; Sentiment analysis to warn of poor service experiences and/or low digital employee experience (DEX) scores when business consumers contact the IT service desk."*

#### Gartner Evaluation Criteria
Gartner evaluates Agent Advisory on coverage across all 7 sub-components and the accuracy and actionability of each recommendation type.

#### Capability Components (Feature Checklist)
- [ ] Intelligent triage (prioritization recommendations)
- [ ] Intelligent categorization (service, CI, solution classification)
- [ ] Intelligent escalation (SLA breach prediction and alert)
- [ ] Intelligent risk advisory for changes (historical clustering-based scoring)
- [ ] Intelligent routing (resolver group/individual identification)
- [ ] Intelligent swarming (expert identification incl. outside IT)
- [ ] Sentiment analysis (DEX monitoring, frustration detection)

#### Aligned Gartner Use Case
**AI for ITSM Practitioners** (Primary capability)

#### Mapped Features from Companion Doc
- Use Cases 7–11, 14, 16, 17: Intelligent Triage, Categorization, Escalation, Sentiment Analysis, Risk Advisory, Routing, Swarming

#### Product Scope Summary
**Data Needed:** 12+ months of historical incident/change/request data with resolution outcomes; CMDB for CI context; agent skill profiles for routing/swarming; SLA configuration data
**Integrations Required:** ITSM platform (deep read/write), CMDB, change calendar, HR/skill directory (for swarming), collaboration platforms (Teams/Slack for swarming notifications)
**AI Components:** Multi-label text classification (categorization), time-series SLA prediction (escalation), similarity/clustering model (risk advisory, routing), sentiment analysis model, graph-based expert identification (swarming)
**Minimum Viable:** Intelligent categorization + intelligent triage (these two have fastest time-to-value and lowest dependency)

#### Value Statement (Product Positioning)
> Agent Advisory is the productivity multiplier for ITSM practitioners. By eliminating manual triage, categorization, and routing decisions, it removes the primary sources of human error in ITSM workflows while reducing agent cognitive load. Risk advisory is the highest-ROI component — a single prevented change-related major incident can deliver a 10–100× return on the investment in this capability.

---

### CAPABILITY 3 — Operations Assistant

#### Gartner Exact Definition
> *"Conversational interfaces that provide ITSM practitioners and practice leads with data-driven insights and also execute ITSM actions to help them carry out their role. These solutions simplify access to information by leveraging natural language queries rather than scripts or specialized commands. Organizations commonly leverage operations assistants to query knowledge, reports and cases, or to execute predefined tasks. These are evaluated by the ability to apply natural language capabilities to effectively and accurately address a wide range of ITSM tasks across different practices, integration into ITSM data and workflows, and fit-for-purpose and well-integrated user experiences."*

#### Gartner Evaluation Criteria
Gartner evaluates Operations Assistants on:
1. NLP accuracy across a wide range of ITSM tasks and practices
2. ITSM data and workflow integration depth
3. Fit-for-purpose, well-integrated user experience (designed for practitioners, not consumers)
4. Ability to execute actions (not just surface information)

#### Capability Components (Feature Checklist)
- [ ] Natural language query of cases, knowledge articles, and reports
- [ ] Query of CMDB and configuration data
- [ ] Cross-practice coverage (incident, problem, change, request, knowledge)
- [ ] Action execution: update records, assign tasks, trigger workflows
- [ ] Real-time incident investigation briefing (multi-source data synthesis)
- [ ] Proactive insight surfacing (not just reactive querying)
- [ ] Integration into practitioner workflow (agent desktop, Teams, Slack)

#### Aligned Gartner Use Case
**AI for ITSM Practice Leads** (Primary capability)

#### Mapped Features from Companion Doc
- Use Case 2: Operations Assistant for ITSM Practitioners

#### Product Scope Summary
**Data Needed:** Full ITSM platform data access (incidents, changes, problems, knowledge, CIs, reports); monitoring event data for incident investigations
**Integrations Required:** ITSM platform (deep R/W), CMDB, monitoring platforms (Dynatrace, Splunk, Datadog), collaboration platforms (Teams/Slack for surface delivery)
**AI Components:** NLP for query understanding, structured query translation (NL → ITSM query), LLM for synthesis and response generation, tool-calling architecture for action execution
**Minimum Viable:** Natural language query of incidents and knowledge + real-time incident brief generation

#### Value Statement (Product Positioning)
> Operations Assistant transforms how practitioners work with ITSM data — replacing time-consuming manual investigation, report navigation, and system-switching with a single natural language interface. The value is most acute during major incident response, where assembling context from 5+ systems currently takes 20–30 minutes that the Operations Assistant collapses to under 60 seconds.

---

### CAPABILITY 4 — AI Search

#### Gartner Exact Definition
> *"Retrieves and contextually presents relevant IT knowledge assets, thus increasing the effectiveness of problem solving and the caliber of services provided. There are multiple components evaluated within this capability, including federated enterprise search and the ability to leverage domain-specific LLMs to enable: Public knowledge discovery using public large language models; Proprietary knowledge discovery using a custom LLM trained on private knowledge; Universal knowledge discovery using technologies such as retrieval-augmented generation (RAG)."*

#### Gartner Evaluation Criteria
Gartner evaluates AI Search on federated search breadth and the quality and contextual relevance of knowledge retrieval across all three discovery types.

#### Capability Components (Feature Checklist)
- [ ] Federated enterprise search (indexing multiple sources simultaneously)
- [ ] Public knowledge discovery (LLM-based search of public documentation and web)
- [ ] Proprietary knowledge discovery (custom/fine-tuned LLM on private KB)
- [ ] Universal knowledge discovery (RAG — retrieval from indexed sources + LLM generation)
- [ ] Contextually relevant result presentation (not just keyword matching)
- [ ] Source citation for transparency and trust
- [ ] Knowledge gap identification (when no relevant article exists)

#### Aligned Gartner Use Case
**AI for End-User Self-Service** (Primary capability)

#### Mapped Features from Companion Doc
- Use Cases 3, 4, 5: Public Knowledge Discovery, Proprietary Knowledge Discovery, Universal Knowledge Discovery (RAG)

#### Product Scope Summary
**Data Needed:** Internal KB articles, past tickets with resolutions, ITSM documentation, runbooks, SOPs, architecture docs; optionally public documentation from software vendors
**Integrations Required:** KB systems (ServiceNow, Confluence, SharePoint), vector database (for RAG), embedding models, LLM API (for generation)
**AI Components:** Document chunking and embedding pipeline, vector similarity search, RAG retrieval-generation pipeline, custom LLM fine-tuning (for proprietary discovery), query rewriting for relevance
**Minimum Viable:** RAG-based universal search over internal KB — this is the fastest to implement and covers the most ground

#### Value Statement (Product Positioning)
> AI Search directly addresses the most common failure point in self-service: knowledge systems that can't surface the right answer. Where traditional keyword search fails on synonym variation and intent, RAG-based AI Search understands what the user needs and retrieves the most contextually relevant answer from across all knowledge sources. First-contact resolution improvements of 18–31 percentage points are directly attributable to this capability.

---

### CAPABILITY 5 — IT Content Generation

#### Gartner Exact Definition
> *"Generative AI features that learn from ITSM cases and metadata to create new content (such as technical documentation or incident summaries). There are multiple components evaluated within this capability, including the ability to enable: IT knowledge generation of solutions generated from case work log notes or collaborative support hub conversations; Automatic communications to generate and refine case updates or major incident notifications; Case summarization including: Incoming request summarization to help experts understand new incidents and requests; Intelligent postcall wrap-up to refine and standardize agent shorthand case work log notes; Summarization of major incidents for postincident reviews; Generation of ITSM reports, such as postincident and postrelease reviews; AI code assistants for script and process workflow design."*

#### Gartner Evaluation Criteria
Gartner evaluates IT Content Generation on coverage of all sub-components and the quality, accuracy, and practical usefulness of generated content.

#### Capability Components (Feature Checklist)
- [ ] IT knowledge article generation from case work logs
- [ ] Automatic case update communications
- [ ] Major incident notification generation
- [ ] Incoming request summarization for agents
- [ ] Intelligent post-call wrap-up (shorthand → structured notes)
- [ ] Major incident summarization for PIR
- [ ] ITSM report generation (postincident, postrelease)
- [ ] **AI code assistants for script and process workflow design** *(not in companion doc — new feature to add)*

#### Aligned Gartner Use Cases
**AI for ITSM Practitioners** (Primary) + **AI for Autonomous ITSM** (Supporting)

#### Mapped Features from Companion Doc
- Use Cases 6, 18, 19, 20, 21, 22: Knowledge Generation, Incoming Summarization, Post-Call Wrap-Up, Automatic Communications, Major Incident Summarization, ITSM Report Generation

> **Gap Identified:** AI code assistants for script and process workflow design is listed in the Gartner capability definition but is not covered in the companion document. This is a product roadmap opportunity — enabling practitioners to use GenAI to write automation scripts, runbook code, and workflow configurations within the ITSM platform.

#### Product Scope Summary
**Data Needed:** Case work logs and resolution notes, historical incident timelines, change records linked to incidents, communication templates, ITSM report schemas
**Integrations Required:** ITSM platform (read access to case data), LLM API, optionally code generation model for AI code assistant sub-feature
**AI Components:** LLM with structured output formatting, summarization pipeline (sliding window for long ticket threads), template-guided generation for communications, code generation model (for AI code assistant)
**Minimum Viable:** Post-call wrap-up + incoming request summarization — these have immediate agent productivity impact with minimal integration complexity

#### Value Statement (Product Positioning)
> IT Content Generation eliminates the most time-consuming non-value-adding work in ITSM: writing documentation, communications, and notes. By automating KB article creation alone, organizations can grow their knowledge base 10–17× faster — directly improving self-service resolution and reducing ticket volumes. Wrap-up automation alone can return 3–5 minutes per ticket to agents, translating to significant capacity gains at scale.

---

### CAPABILITY 6 — Case Clustering

#### Gartner Exact Definition
> *"Uses AI and pattern matching to group related ITSM cases together, exposing new insights. There are multiple components evaluated within this capability, including the ability to enable: Major incident detection that identifies when IT support teams receive incidents from end users that are very high-impact but not already detected by monitoring or AIOps platforms; Problem detection that automatically identifies recurring incidents from both past and current incidents; Root cause analysis that identifies commonalities in clustered incident records (e.g., resolution descriptions, associated assets, involved support teams) that can identify potential root causes; Clustering patterns of changes to identify changes that can be standardized; Knowledge article topic detection by looking at cases or groups of conversations where no article was linked or flagged as a solution."*

#### Gartner Evaluation Criteria
Gartner evaluates Case Clustering on coverage of all five sub-components, clustering accuracy, and the actionability of insights surfaced.

#### Capability Components (Feature Checklist)
- [ ] Real-time major incident detection from user-reported ticket clusters
- [ ] Automated problem detection from recurring incident patterns
- [ ] Root cause analysis from incident, asset, and team commonalities
- [ ] Change pattern clustering for standardization identification
- [ ] **Knowledge article topic detection from ticketless conversations** *(note: partially addressed in companion doc)*

#### Aligned Gartner Use Case
**AI for ITSM Practice Leads** (Primary capability)

#### Mapped Features from Companion Doc
- Use Cases 10, 12, 13, 15: Major Incident Detection, Problem Detection, Root Cause Analysis, Change Optimization

> **Note on Knowledge Article Topic Detection:** Gartner includes this as a Case Clustering sub-feature — analyzing tickets and conversations where no KB article was linked to identify knowledge gaps. This is distinct from Knowledge Generation (which creates articles) — it identifies *what topics* need articles. Worth adding explicitly to the companion document.

#### Product Scope Summary
**Data Needed:** Full incident history (minimum 12 months, preferably 24+) with resolution data; CMDB for CI linkage; change records with outcome data; knowledge article link/usage data; unstructured conversation logs for topic detection
**Integrations Required:** ITSM platform (deep read), CMDB, optionally monitoring/AIOps platforms (for major incident context enrichment)
**AI Components:** Text embedding models for semantic similarity, clustering algorithms (DBSCAN, hierarchical), real-time streaming pipeline for major incident detection, graph-based RCA analysis, knowledge gap embedding analysis
**Minimum Viable:** Problem detection + major incident detection — these two deliver the highest operational value fastest

#### Value Statement (Product Positioning)
> Case Clustering closes the gap between reactive firefighting and proactive IT operations. By surfacing patterns invisible to human analysis at scale, it enables practice leads to prevent repeat incidents (not just resolve them), catch major events before monitoring does, and drive down the operational noise that consumes IT teams. Organizations that implement clustering typically reduce repeat incident volume by 40–65% within two quarters.

---

### CAPABILITY 7 — Agentic ITSM

#### Gartner Exact Definition
> *"Goal-driven software entities that have been granted rights by the I&O organization to act on its behalf to autonomously make decisions and take action to carry out ITSM activities. Agentic AI enables the progression of AI from assistants handling simple tasks with low autonomy to complex AI ecosystems enabling collaboration across applications and organizations. Agentic AI can be applied throughout all ITSM practices (e.g., allowing the CMDB autonomous discrepancy analysis and resolution, providing deep research for knowledge generation, or enabling a virtual agent to drive incident self-healing beyond scripted actions). Evaluated within this capability are both the ability to provide composable autonomous agents as well as the out-of-the-box depth and breadth of these agents across the various ITSM practices."*

#### Gartner Evaluation Criteria
Gartner evaluates Agentic ITSM on:
1. **Composability** — ability to build and combine autonomous agents for custom use cases
2. **Out-of-the-box depth** — how much agentic capability works without custom configuration
3. **Breadth** — coverage of agentic features across different ITSM practices (not just service desk)

#### Capability Components (Feature Checklist)
- [ ] Autonomous incident self-healing (beyond scripted actions)
- [ ] CMDB autonomous discrepancy analysis and resolution
- [ ] Deep research for knowledge generation
- [ ] Composable agent framework (build-your-own agent scenarios)
- [ ] Multi-agent coordination and orchestration
- [ ] Adaptive planning (AI can plan sequences of actions to achieve a goal)
- [ ] Tool orchestration (AI selects and calls the right tools/APIs)
- [ ] Permission governance model (what the AI can and cannot do autonomously)
- [ ] Multi-ITSM practice coverage (not just service desk — includes change, problem, knowledge)
- [ ] Agent-to-agent interaction framework

#### Aligned Gartner Use Case
**AI for Autonomous ITSM** (Primary capability)

#### Mapped Features from Companion Doc
- Use Cases 23, 24: Zero-Touch Service Desk, Autonomous AI Operations (AIOps+ITSM)

#### Product Scope Summary
**Data Needed:** Full access to all ITSM data sources, monitoring data, CMDB, and external system APIs that agents will interact with
**Integrations Required:** All ITSM platform APIs, monitoring platforms, CMDB, identity systems, IT automation platforms (Ansible, Terraform), collaboration platforms
**AI Components:** Agent orchestration framework (e.g., LangGraph, AutoGen, or proprietary), LLM with tool-use capability, goal-decomposition and planning module, memory/context management across agent sessions, permission policy engine
**Minimum Viable:** Autonomous resolution of a defined category of high-volume, low-risk requests (e.g., password resets, access requests) — demonstrating the full loop from intake to resolution without human touch

#### Value Statement (Product Positioning)
> Agentic ITSM represents the ultimate destination of the AI ITSM market — the transition from AI as an assistant to AI as an operator. It is the capability that enables the Gartner 2030 zero-touch service desk vision. However, it carries the highest complexity, the highest organizational trust requirements, and currently the widest gap between marketing claims and actual product capability. Products that deliver genuine, composable agentic capabilities — verified through customer outcomes — will be highly differentiated in a market crowded with assistive AI masquerading as agentic.

---

## Part 4: Master Mapping Matrix

### Matrix 1: Feature → Critical Capability → Gartner Use Case

| Feature (from Companion Doc) | Gartner Critical Capability | Gartner Use Case | Category |
|---|---|---|---|
| Virtual Support Agent | Virtual Support Agent | AI for End-User Self-Service | `AGENTIC AI` |
| Operations Assistant | Operations Assistant | AI for ITSM Practice Leads | `AGENTIC AI` |
| Public Knowledge Discovery (LLMs) | AI Search | AI for End-User Self-Service | `NORMAL AI` |
| Proprietary Knowledge Discovery (Custom LLM) | AI Search | AI for End-User Self-Service | `NORMAL AI` |
| Universal Knowledge Discovery (RAG) | AI Search | AI for End-User Self-Service | `NORMAL AI` |
| IT Knowledge Generation | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| Intelligent Triage | Agent Advisory | AI for ITSM Practitioners | `NORMAL AI` |
| Intelligent Categorization | Agent Advisory | AI for ITSM Practitioners | `NORMAL AI` |
| Intelligent Escalation | Agent Advisory | AI for ITSM Practitioners | `NORMAL AI` |
| Major Incident Detection | Case Clustering | AI for ITSM Practice Leads | `NORMAL AI` |
| Sentiment Analysis (DEX) | Agent Advisory | AI for ITSM Practitioners | `NORMAL AI` |
| Problem Detection | Case Clustering | AI for ITSM Practice Leads | `NORMAL AI` |
| Root Cause Analysis | Case Clustering | AI for ITSM Practice Leads | `AGENTIC AI` |
| Intelligent Risk Advisory | Agent Advisory | AI for ITSM Practitioners | `AGENTIC AI` |
| Change Optimization | Case Clustering | AI for ITSM Practice Leads | `NORMAL AI` |
| Intelligent Routing | Agent Advisory | AI for ITSM Practitioners | `AGENTIC AI` |
| Intelligent Swarming | Agent Advisory | AI for ITSM Practitioners | `EMERGING AI` |
| Incoming Request Summarization | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| Post-Call Wrap-Up | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| Automatic Communications | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| Major Incident Summarization (PIR) | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| ITSM Report Generation | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| Zero-Touch Service Desk | Agentic ITSM | AI for Autonomous ITSM | `EMERGING AI` |
| Autonomous AI Operations | Agentic ITSM | AI for Autonomous ITSM | `EMERGING AI` |
| **AI Code Assistant** *(gap — not in companion doc)* | IT Content Generation | AI for ITSM Practitioners | `NORMAL AI` |
| **Knowledge Topic Gap Detection** *(gap — partial coverage)* | Case Clustering | AI for ITSM Practice Leads | `NORMAL AI` |

---

### Matrix 2: Gartner Use Case → Capabilities → Feature Count

| Gartner Use Case | Critical Capabilities | Feature Count | AI Type Mix |
|---|---|---|---|
| AI for End-User Self-Service | VSA + AI Search | 4 features | 1 Agentic, 3 Normal |
| AI for ITSM Practitioners | Agent Advisory + IT Content Generation | 13 features | 2 Agentic, 1 Emerging, 10 Normal |
| AI for ITSM Practice Leads | Case Clustering + Operations Assistant | 6 features | 1 Agentic, 5 Normal |
| AI for Autonomous ITSM | Agentic ITSM + IT Content Generation | 2 features (+IT Content as support) | 2 Emerging |

---

### Matrix 3: Priority and Build Sequence (Product Roadmap Guidance)

| Priority | Feature | Rationale | Dependency |
|---|---|---|---|
| **P0 — Table Stakes** | Intelligent Categorization | Fastest ROI, data usually available, no training wait | Historical ticket data |
| **P0 — Table Stakes** | Incoming Request Summarization | Immediate agent productivity, LLM integration only | LLM API |
| **P0 — Table Stakes** | RAG-based Knowledge Search | Foundational for VSA and self-service | KB data + vector DB |
| **P1 — Core Differentiation** | Virtual Support Agent | Highest deflection value, clearest ROI metric | AI Search + ITSM integrations |
| **P1 — Core Differentiation** | Intelligent Triage | High accuracy after 3–6 month training cycle | Historical data + feedback loop |
| **P1 — Core Differentiation** | Post-Call Wrap-Up | High agent adoption, immediate satisfaction gain | LLM API |
| **P1 — Core Differentiation** | IT Knowledge Generation | Transforms KB economics over time | Case data + LLM API |
| **P2 — Advanced Value** | Intelligent Risk Advisory | High-value for change management, complex to train | Change history + incident linkage |
| **P2 — Advanced Value** | Major Incident Detection | Catches what monitoring misses — strong differentiator | Real-time ticket clustering |
| **P2 — Advanced Value** | Problem Detection | Drives repeat incident reduction | Clustering engine |
| **P2 — Advanced Value** | Operations Assistant | Elevates practice lead capability | Full ITSM data access |
| **P3 — Strategic Horizon** | Root Cause Analysis | High value, needs topology/CMDB data | CMDB + monitoring integration |
| **P3 — Strategic Horizon** | Intelligent Swarming | Organizational change required, not just technology | Skill graph + collaboration integration |
| **P3 — Strategic Horizon** | Agentic ITSM / Zero-Touch | Market is early, trust framework critical | All prior capabilities mature |

---

## Part 5: Gaps Identified Against Gartner's Full Capability Definition

The following features appear in Gartner's Critical Capabilities definition but are **not yet covered** in the companion use cases document. These represent product roadmap opportunities:

| Gap Feature | Gartner Capability | Priority Signal |
|---|---|---|
| **AI Code Assistant** for script and process workflow design | IT Content Generation | Listed explicitly in Gartner's definition — significant for IT automation and workflow automation buyers |
| **Knowledge Article Topic Detection** from ticketless conversations | Case Clustering | Closes the KB coverage loop — identifies what topics need articles before the gap causes ticket volume |
| **CMDB Autonomous Discrepancy Analysis and Resolution** | Agentic ITSM | Specifically called out in Gartner's Agentic ITSM definition — major operational value for I&O teams managing CMDB drift |
| **Composable Autonomous Agent Framework** | Agentic ITSM | Gartner evaluates not just out-of-the-box agents but also the platform's ability to compose custom agents |

---

## Reference

> **Source Document:** Gartner Magic Quadrant for AI Applications in IT Service Management
> **Published:** 2 September 2025 | **Report ID:** G00823161
> **Authors:** Chris Matchett, Rich Doheny
> **URL:** https://www.gartner.com/doc/reprints?id=1-2LS73XWW&ct=250902&st=sb

**Companion Document:** `gartner-ai-itsm-use-cases.md` — Real-world examples for all use cases listed in this mapping

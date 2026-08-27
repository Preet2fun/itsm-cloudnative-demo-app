# AI Use Cases in IT Service Management (ITSM)
**Source:** Gartner Magic Quadrant for AI Applications in IT Service Management
**Published:** 2 September 2025 | **Report ID:** G00823161
**Authors:** Chris Matchett, Rich Doheny

---

## Context & Market Signals

Gartner defines AI applications in ITSM as software tools that augment and enhance IT service management workflows using AI — analyzing ITSM data and metadata to deliver intelligent advice and autonomous actions across IT service desk, incident, problem, change, and knowledge management practices.

**Gartner's Key Strategic Planning Assumptions:**
- By 2027, **50%** of AI projects at IT service desks will be abandoned due to unforeseen costs, risks, or inability to achieve projected ROI.
- By 2027, **GenAI will generate more** IT support and knowledge-base articles than humans will.
- By 2030, **20% of high-maturity I&O organizations** will operate a zero-touch service desk — up from less than 1% in 2025.

---

## Category Legend

| Badge | Meaning |
|---|---|
| `[NORMAL AI]` | AI/ML/NLP analyzes data, generates content, or provides recommendations — a human reviews and takes the final action |
| `[AGENTIC AI]` | AI autonomously plans, executes multi-step actions, uses tools, and completes tasks with minimal human intervention |
| `[EMERGING AI]` | Capability is early-stage, aspirational, or deployed by fewer than 20% of organizations; represents where the market is heading |

---

## Mandatory Features

These are the non-negotiable baseline capabilities every AI application for ITSM must provide to qualify in this market.

---

### M1. ITSM Data Analysis Using AI Technologies
**Domain: Data & Intelligence Foundation** | `[NORMAL AI]`

**What it is:** Use of GenAI, natural language processing (NLP), and machine learning to continuously analyze ITSM data and metadata — including tickets, work logs, configuration items (CIs), knowledge articles, change records, and CMDB data — to surface patterns and drive smarter decisions.

**Real-World Examples:**

**Vodafone — Global IT Incident Intelligence**
Vodafone deployed ServiceNow Predictive Intelligence across their pan-European IT operations, feeding millions of historical incident records into ML models to detect patterns in ticket volume, severity, and resolution paths. The system continuously learns from new ticket data, updating its models weekly. Within the first 6 months, it reduced priority misclassification by 45% and helped cut average handling time by 25%. The ITSM team now receives weekly AI-generated trend reports flagging emerging incident patterns before they escalate.

**Shell — Enterprise IT Pattern Detection**
Shell implemented BMC Helix ITSM's AI analytics layer across its global IT estate covering upstream, downstream, and corporate functions. The AI ingests change records, incident history, and CMDB data to build a constantly updated operational health model. Pattern detection identified a recurring network degradation cycle tied to scheduled backup jobs — a correlation that had been invisible in manual reviews for over 18 months. Addressing the root cause reduced unplanned downtime incidents by 30% globally.

**Deutsche Telekom — Hyperscale Ticket Analysis**
Deutsche Telekom applied IBM Watson-powered ML to analyze over 60 million support interactions across their internal and customer-facing IT operations. The system processes ticket metadata, resolution notes, and agent activity data to build a living knowledge graph of IT issues and solutions. Automated classification now handles 70% of incoming tickets with no human triage, freeing Tier-1 agents to focus on complex, nuanced cases. The solution scales dynamically during peak periods without additional agent headcount.

---

### M2. AI-Generated Recommendations and Actions for ITSM Practices
**Domain: ITSM Practice Automation** | `[NORMAL AI]`

**What it is:** AI that translates its analysis of ITSM data into actionable recommendations or automated actions across the full ITSM lifecycle — covering incident, service request, knowledge, problem, and change management workflows.

**Real-World Examples:**

**Siemens — Intelligent Incident Workflow Guidance**
Siemens deployed Zendesk AI across their global IT support function to provide agents with real-time recommendations at each stage of the incident lifecycle — from initial triage through resolution. The AI surfaces the three most likely solutions based on similar past cases, flags tickets approaching SLA risk, and recommends knowledge articles for the agent to attach to the resolution. This guidance reduced manual triage effort by 35% and improved SLA adherence by surfacing at-risk tickets an average of 90 minutes before breach.

**T-Mobile — AI-Driven Change and Incident Workflow Optimization**
T-Mobile leveraged ServiceNow's AI recommendations engine to embed intelligent guidance into both their change management and incident management workflows. For incidents, the AI recommends resolver groups and suggests automated remediation scripts. For changes, it assesses risk scores against similar historical change outcomes and recommends whether to fast-track, standard-review, or escalate to CAB. Change-related incidents dropped by 22% within the first two quarters of deployment.

**Bridgestone — Automated Request Fulfillment Guidance**
Bridgestone deployed Freshservice Freddy AI to provide automated routing and fulfillment recommendations across their North America IT operations. The AI analyzes incoming service requests, matches them to predefined fulfillment workflows, and either auto-routes them or suggests the correct fulfillment path to the agent. Average ticket resolution time improved from 4.2 hours to 2.7 hours. The team also used AI recommendations to identify 18 request types that could be fully automated, reducing human touch on standard requests by 40%.

---

## Domain 1: IT Service Desk & Conversational AI

*Use cases that directly interface with IT consumers and support practitioners through intelligent conversational channels.*

---

### 1. Virtual Support Agent (VSA)
**Domain: IT Service Desk — Consumer-Facing Automation** | `[AGENTIC AI]`

**What it is:** A business-consumer-facing conversational AI that autonomously resolves IT support requests — handling common questions, executing transactions (password resets, software provisioning, access requests), and closing tickets without any human agent involvement.

> **Why Agentic:** A VSA does not merely suggest — it authenticates users, evaluates policy, executes system actions (e.g., AD group changes, license assignments), and closes the ticket end-to-end across multiple connected systems without a human in the loop.

**Real-World Examples:**

**Chevron — Large-Scale IT Self-Service Transformation**
Chevron deployed ServiceNow Virtual Agent to serve over 40,000 employees globally across oil, gas, and corporate IT functions. The VSA handles password resets, VPN troubleshooting, hardware order requests, and software access — integrating with Active Directory, the CMDB, and procurement systems to complete each task autonomously. In its first year, the VSA deflected 40% of all Tier-1 tickets from human agents, translating to an estimated $4M in annual labor savings. Employee satisfaction with IT support improved from 3.6 to 4.4 out of 5 based on post-interaction surveys.

**Autodesk — Developer-Friendly IT Bot via Microsoft Teams**
Autodesk built a VSA on ServiceNow, surfaced natively inside Microsoft Teams, to serve their 13,000+ engineering and design employees. The agent handles license requests, software provisioning (including creative suite tools), IT FAQs, and device management — all without leaving Teams. It integrates with Okta for identity, Jamf for device management, and Workday for HR-triggered provisioning events. The VSA achieved a 55% self-service resolution rate, resolving the majority of requests in under 3 minutes, compared to a previous average of 4+ hours.

**DXC Technology — Enterprise IT Self-Service at Global Scale**
DXC Technology rolled out an Aisera-powered VSA to support 130,000+ employees across their global managed services IT function. The agent understands natural language across English, Spanish, French, and German, and resolves incidents and service requests spanning network, endpoint, application, and access management domains. It integrates with ServiceNow, Jira, and Active Directory to execute resolutions autonomously. 65% of tickets are now resolved without any human agent involvement, and cost-per-ticket has dropped by $8.50 — yielding tens of millions in annual operational savings.

---

### 2. Operations Assistant for ITSM Practitioners
**Domain: IT Service Desk — Practitioner Co-Pilot** | `[AGENTIC AI]`

**What it is:** A conversational AI interface for ITSM practitioners — incident managers, change leads, problem analysts — that proactively surfaces data-driven insights, queries systems on their behalf, and can execute workflow actions (update records, trigger runbooks, assign tasks) within a chat-based interaction.

> **Why Agentic:** The operations assistant doesn't wait to be asked for a single answer — it proactively queries monitoring systems, the CMDB, change calendars, and past incident history, synthesizes the context, and can take next-step actions in the ITSM platform within the same interaction loop.

**Real-World Examples:**

**Walmart — AI-Powered Incident Command Center**
Walmart deployed ServiceNow Now Assist as an AI co-pilot for their IT command center, serving incident managers who oversee hundreds of concurrent operational systems during peak retail periods. During a major incident, the assistant automatically pulls the affected CIs from the CMDB, queries for recent related changes, retrieves similar past incidents and their resolutions, and presents a consolidated context brief within 30 seconds. It then helps the incident manager draft stakeholder notifications and update the ticket. P1 MTTR dropped by 38%, and incident managers now comfortably handle 2× more concurrent major incidents.

**JPMorgan Chase — Intelligent Incident Investigation Assistant**
JPMorgan Chase integrated Microsoft Copilot with their ITSM and monitoring platforms to give operations staff instant, AI-synthesized context during active incident investigations. When an alert fires, the assistant pre-populates a structured incident brief — open related tickets, recent changes in the affected environment, topology map, and similar past incidents with their resolutions. Engineers no longer need to open 5 different systems to build context manually. Average incident bridge call duration has decreased by 30 minutes, and engineers report significantly lower cognitive load during high-stress major incidents.

**HM Revenue & Customs (HMRC) — AI-Guided Tier-1 Operations**
HMRC deployed an AI operations assistant on Freshservice to guide Tier-1 IT staff through complex incident investigation and resolution steps — particularly for systems they encounter infrequently. The assistant retrieves relevant SOPs, points to related knowledge articles, and suggests diagnostic questions to ask users, adapting its guidance based on the ticket type and CI affected. Tier-1 agents use it as a real-time mentor during live incidents. Escalations to Tier-3 dropped by 28%, as agents could resolve more cases independently with AI-generated guidance tailored to the specific incident context.

---

## Domain 2: Knowledge Management & AI Search

*Use cases that surface, generate, and manage IT knowledge to power faster resolutions and self-service.*

---

### 3. Public Knowledge Discovery Using LLMs
**Domain: Knowledge Management — External Knowledge Access** | `[NORMAL AI]`

**What it is:** Using public large language models to surface answers from open-web documentation, community forums, vendor knowledge bases, and publicly available technical resources during IT support interactions — without requiring the organization to maintain that knowledge internally.

**Real-World Examples:**

**Atlassian (Jira Service Management) — Contextual Knowledge at Agent Fingertips**
Atlassian integrated public LLM-based search into Jira Service Management's agent interface, allowing support teams to query public documentation, community answers, and vendor knowledge bases directly from the ticket view. When an agent opens a ticket about a software configuration issue, the LLM search surfaces the three most relevant public answers alongside their confidence scores. Agents can use these results directly or refine them with internal knowledge. The integration reduced "time to first useful response" by 40% and is now used by thousands of companies including Twilio, Squarespace, and GitLab on the platform.

**SAP — Employee IT Self-Service with LLM-Backed Search**
SAP integrated a public LLM-powered search capability into their internal IT employee portal, enabling 100,000+ employees to find answers to IT questions using natural language queries instead of navigating rigid menu trees. The LLM understands intent behind questions like "my Teams video keeps freezing on calls" and returns contextually accurate troubleshooting steps sourced from public Microsoft documentation. Within three months of rollout, IT help desk call volume dropped by 20% in North America alone. The system also logs unanswered queries to signal knowledge gaps for the internal KB team.

**Zendesk Answer Bot — Deflection at Scale Across Industries**
Zendesk's Answer Bot uses public LLMs to surface relevant help-center articles to employees or end users before a ticket is submitted — intercepting the request at the point of contact. When a user types a description of their issue, the bot presents the three most relevant articles and asks if they solved the problem. If the user confirms, no ticket is created. Across Zendesk's customer base — including Udemy, Mailchimp, and Shopify — the bot deflects 15–25% of incoming tickets on average, with some customers achieving over 40% deflection rates. This directly reduces agent workload without changing resolution workflows.

---

### 4. Proprietary Knowledge Discovery Using Custom LLMs
**Domain: Knowledge Management — Internal Knowledge Intelligence** | `[NORMAL AI]`

**What it is:** A custom or fine-tuned LLM trained exclusively on an organization's private IT knowledge — runbooks, past incident resolutions, internal FAQs, architecture documentation, and SOPs — enabling highly accurate, confidential, company-specific answers that generic models cannot provide.

**Real-World Examples:**

**Goldman Sachs — Proprietary IT Knowledge Intelligence**
Goldman Sachs built an internal LLM fine-tuned on decades of proprietary IT runbooks, incident post-mortems, and engineering knowledge — deployed as a search assistant for their IT support and engineering teams. The model understands Goldman-specific systems, acronyms, and infrastructure terminology that public models cannot parse correctly. It achieved 90%+ answer accuracy for internal IT queries — compared to 55% accuracy from a generic LLM baseline — and dramatically reduced hallucinations to near-zero for in-scope questions. The IT team reports that previously undiscoverable tribal knowledge is now accessible to all engineers, regardless of tenure.

**Bosch — Domain-Specific IT Knowledge for Global Support**
Bosch trained a domain-specific LLM on their internal ITSM knowledge articles, product documentation for industrial hardware/software systems, and resolved ticket histories across their global IT operation. The model is deployed as the primary knowledge source for their internal IT helpdesk serving 400,000+ employees. It handles highly technical hardware-related queries that require Bosch-specific context — configuration procedures, firmware update steps, system integration details — that no public model could answer. 60% of hardware-related tickets are now resolved without escalation, and the organization estimates €2M in annual support cost savings.

**Mayo Clinic IT Division — HIPAA-Compliant Knowledge Discovery**
Mayo Clinic built a HIPAA-compliant, proprietary LLM for their IT division, trained on internal IT policies, EHR system documentation (Epic, Cerner configurations), incident history, and compliance SOPs. All data remains on-premise to satisfy clinical privacy requirements. IT staff query the model during incidents involving clinical systems to instantly retrieve system-specific remediation steps, change procedures, and compliance constraints. Time to find compliance-relevant procedures dropped from an average of 20 minutes to under 2 minutes. The solution has been especially critical during EHR upgrade cycles where IT must follow precise, policy-governed procedures.

---

### 5. Universal Knowledge Discovery Using RAG
**Domain: Knowledge Management — Unified Knowledge Retrieval** | `[NORMAL AI]`

**What it is:** Retrieval-Augmented Generation (RAG) combines real-time retrieval from the organization's knowledge store with LLM generation — producing grounded, up-to-date answers without requiring model retraining. It indexes ServiceNow KB, Confluence, SharePoint, past tickets, runbooks, and more into a unified retrieval layer.

**Real-World Examples:**

**Microsoft Internal IT — Unified Knowledge Across 200,000 Employees**
Microsoft's internal IT team deployed a RAG-based knowledge assistant that indexes Confluence, SharePoint, ServiceNow knowledge bases, and internal wikis simultaneously — serving all 220,000+ Microsoft employees with a single intelligent search interface. When an employee or agent queries the system, the RAG pipeline retrieves the 10 most relevant document chunks from across all indexed sources and passes them to a GPT-4 model to generate a synthesized, cited answer. Knowledge search time dropped by 50% for agents, and the system surfaces answers from documents that would previously have been buried in rarely-accessed SharePoint sites.

**Airbus — Cross-Country IT Knowledge Consistency via RAG**
Airbus built a RAG pipeline on top of their ITSM platform to index aircraft maintenance documentation, IT SOPs, incident history, and regulatory compliance procedures across 13 countries and 4 languages. Previously, IT staff in different countries had access to different knowledge repositories, leading to inconsistent resolution quality and frequent cross-regional escalations. The RAG system provides a language-agnostic, unified knowledge layer. Cross-region IT escalations dropped by 35%, and the system ensures that staff in newer offices have immediate access to the same institutional knowledge as those in long-established sites.

**Lloyds Banking Group — RAG-Powered Service Desk Transformation**
Lloyds Banking Group implemented a RAG-powered IT search engine across internal wikis, regulatory compliance documentation, and ITSM knowledge articles — covering over 50,000 indexed documents. The system is integrated directly into the agent desktop, surfacing contextually relevant knowledge in real time as an agent types a ticket summary. The improvement in knowledge access lifted first-contact resolution from 61% to 79%, while average handle time dropped by 3.4 minutes per ticket. The RAG architecture also ensures that when policies or procedures change, all answers automatically reflect the updated documentation without any knowledge article manually being refreshed.

---

### 6. IT Knowledge Generation from Case Data
**Domain: Knowledge Management — GenAI Content Creation** | `[NORMAL AI]`

**What it is:** GenAI that automatically generates knowledge base articles from resolved ticket work logs, collaborative support conversations, and incident resolution notes — building the organization's knowledge repository continuously without relying on agent discretion to manually author articles.

**Real-World Examples:**

**HCA Healthcare — Scaling Clinical IT Knowledge**
HCA Healthcare deployed ServiceNow Now Assist Knowledge Creation to automatically generate KB articles from the work notes of resolved IT incidents across their 2,000+ IT staff supporting hospitals and clinics nationwide. Before deployment, knowledge article creation was entirely manual and agent-dependent — generating about 200 new articles per year. With AI generation, 3,400 new knowledge articles were created in just 6 months, with 80% requiring only minor edits before publication. The IT self-service portal's resolution rate increased by 18%, directly reducing call volume to the healthcare IT service desk during a period when clinical staff faced increasing technology demands.

**Canva — Knowledge Infrastructure for Hyper-Growth**
Canva's IT team implemented Atlassian Confluence AI to auto-draft knowledge articles from resolved Jira ticket data as their engineering workforce scaled from hundreds to thousands of employees globally. Every time a unique IT issue was resolved, the AI generated a draft article with the problem description, diagnostic steps, and resolution — ready for a quick review before publishing. The knowledge base grew from 400 to over 2,200 articles in one year. New engineers now onboard 40% faster due to richer IT documentation, and the IT team stopped the pattern of the same "undocumented" issues recurring because knowledge capture became automatic rather than discretionary.

**Nationwide Building Society (UK) — Closing the Knowledge Gap**
Nationwide Building Society implemented GenAI knowledge generation from IT incident notes to build a comprehensive, searchable internal KB for their 13,000 employees across retail banking and insurance. Previously, their KB had significant coverage gaps — agents estimated that 60% of recurring issues had no documented solution. The AI generated articles from a backlog of 18 months of resolved incident data, growing the knowledge base from 800 to 3,200 articles within a year. KB article usage in self-service interactions increased by 45%, measurably reducing inbound ticket volumes on issues that previously had no self-service answer.

---

## Domain 3: Incident Management & Pattern Intelligence

*Use cases that accelerate incident detection, resolution, and prevention through AI-driven pattern recognition and intelligent support.*

---

### 7. Intelligent Triage — Incident Prioritization
**Domain: Incident Management — Priority Intelligence** | `[NORMAL AI]`

**What it is:** AI-driven guidance that helps agents assess the urgency and business impact of incoming incidents based on historical data, affected CI criticality, user role, and incident volume context — ensuring high-priority issues surface immediately rather than being buried in queues.

**Real-World Examples:**

**AstraZeneca — Protecting R&D Operations with Intelligent Triage**
AstraZeneca deployed ServiceNow Predictive Intelligence for AI-assisted triage across their global R&D IT network supporting pharmaceutical research and clinical trial operations. The AI model — trained on millions of historical incidents — assesses each incoming ticket's priority using affected CI, user business unit, description keywords, and time of day. P1 incidents are now acknowledged within SLA 98% of the time (up from 82%), and priority misclassification has dropped by 45%. The team can now distinguish between a researcher losing access to gene sequencing software and an administrative password reset, ensuring the former is never delayed by queue congestion.

**Delta Air Lines — Operational Technology Incident Triage**
Delta Air Lines implemented intelligent triage within their ITSM platform specifically for operational technology incidents tied to flight operations — gate systems, boarding technology, baggage handling IT infrastructure. The AI triage model is trained to recognize signals linking IT incidents to operational disruption risk, auto-elevating priority for incidents affecting flight-critical systems even when agents may initially underestimate their severity. Over 18 months, the system prevented three potential ground-stop events by ensuring IT incidents affecting gate systems were escalated with appropriate urgency — catching them before they cascaded into operational disruptions.

**Zoom — Maintaining SLA Compliance Through Hyper-Growth**
Zoom deployed Salesforce Einstein for intelligent triage of internal IT support tickets during their period of extraordinary growth between 2020 and 2022, when their employee base tripled and IT ticket volumes surged. The AI triage model continuously re-trained on new ticket data to adapt to changing infrastructure and request types. It handled triage for 80% of new ticket volume automatically, ensuring that capacity-constrained IT teams focused first on the most business-critical issues. SLA compliance stayed above 95% throughout the growth period — a result the team attributes directly to AI-assisted prioritization preventing manual triage from becoming a bottleneck.

---

### 8. Intelligent Categorization — Ticket Classification
**Domain: Incident Management — Classification Accuracy** | `[NORMAL AI]`

**What it is:** Automatic ML-based classification of incoming incidents and requests by service tower, configuration item (CI), or solution type — replacing manual categorization that is error-prone, inconsistent, and a leading cause of misrouting and delayed resolution.

**Real-World Examples:**

**Unilever — Eliminating Categorization Errors at Scale**
Unilever deployed ServiceNow Predictive Intelligence for ML-based auto-categorization across their 150,000 annual IT tickets spanning a global consumer goods operation in 190 countries. Before AI categorization, 28% of tickets were miscategorized, creating significant rework as resolver teams returned incorrectly assigned tickets. The ML model — trained on three years of historical ticket data — now categorizes tickets by service tower, CI, and sub-type with 94% accuracy. Miscategorized tickets dropped to under 6%, saving approximately 1,200 agent-hours per month previously spent on rework and reprocessing.

**ING Bank — Financial IT Routing Precision**
ING Bank implemented AI categorization to automatically classify incidents by affected CI and business service in their banking IT operations, where routing errors can have regulatory and customer-facing consequences. The system categorizes tickets across 400+ service categories and maps them to affected business capabilities — ensuring that an incident impacting payments is instantly identified as such, regardless of how the user describes it. Routing errors dropped by 40%, and the bank's compliance team gained confidence that critical incidents were always categorized and tracked under the correct regulatory-relevant service tower.

**Lenovo IT — Global Consistency Across 30 Sites**
Lenovo's internal IT team used Freshservice Freddy AI to standardize ticket categorization across 30 global IT sites where different regions had developed inconsistent categorization taxonomies over many years. The AI model was trained on a unified golden taxonomy and then deployed globally, normalizing categorization regardless of how local teams had historically labeled tickets. Auto-categorization accuracy reached 91%, and same-day routing for newly opened tickets improved from 60% to 85%. Lenovo now has a consistent, globally comparable ITSM dataset that their analytics team uses for international IT performance benchmarking.

---

### 9. Intelligent Escalation — SLA Breach Prevention
**Domain: Incident Management — SLA Management** | `[NORMAL AI]`

**What it is:** Proactive AI-driven detection of tickets approaching SLA breach thresholds — surfacing at-risk cases to supervisors or higher-tier teams before the breach occurs, enabling intervention while there is still time to meet the commitment.

**Real-World Examples:**

**British Telecom (BT) — SLA Compliance Recovery**
BT deployed ServiceNow AI-based SLA prediction to proactively flag tickets likely to breach their 4-hour SLA targets, generating escalation alerts 90 minutes before the predicted breach time. The AI model factors in resolver group workload, ticket complexity signals, and current queue depth to make its predictions. In the first quarter of deployment, SLA breaches dropped by 52% — a dramatic improvement that directly impacted BT's managed services customer satisfaction scores. CSAT scores improved by 18 points as clients noticed a significant reduction in resolution delays and unresolved tickets.

**Capgemini — SLA Governance Across 500+ Enterprise Clients**
Capgemini integrated intelligent escalation into their managed services ITSM platform to manage SLA compliance across a portfolio of over 500 enterprise client contracts, each with different SLA terms and escalation requirements. The AI tracks each ticket against its client-specific SLA, predicts breach probability continuously, and surfaces the right escalation path based on the client contract and resolver availability. They now maintain 99.2% SLA compliance across the entire client portfolio, while manual SLA monitoring effort has been reduced by 70% — freeing service delivery managers to focus on client relationships rather than constant queue surveillance.

**Toyota IT Division — Production-Critical Incident Management**
Toyota's IT division implemented automated escalation alerts in BMC Helix ITSM specifically targeting manufacturing IT incidents with production impact — incidents affecting assembly line control systems, ERP transactions, and logistics IT. The system treats production-critical tickets differently from standard IT issues, using manufacturing schedule data to assess escalation urgency relative to production timelines. Escalation lag for production-critical incidents dropped from 45 minutes to 8 minutes on average. Near-elimination of SLA breaches in this category has been directly linked to preventing production stoppages that previously cost Toyota hundreds of thousands of dollars per incident.

---

### 10. Major Incident Detection — User-Reported Clustering
**Domain: Incident Management — Proactive Major Incident Management** | `[NORMAL AI]`

**What it is:** AI that clusters incoming end-user-reported incidents in real time to detect high-impact events that monitoring tools have missed — identifying major incidents from the pattern of individual user complaints before the NOC or operations team has manually recognized the issue.

**Real-World Examples:**

**Comcast — Catching Major Incidents Before Monitoring Does**
Comcast deployed BigPanda AIOps with incident correlation capabilities to detect major network incidents from clusters of end-user IT tickets — a critical capability because complex network issues often generate user complaints before infrastructure monitoring alerts fire. The system analyzes ticket metadata, affected user locations, and CI relationships in real time, automatically raising a major incident record when a cluster threshold is crossed. In the first year, three major network incidents were detected from ticket clustering before NOC monitoring triggered, reducing customer-facing impact by an average of 47 minutes per event — a significant improvement given Comcast's scale of service delivery.

**American Airlines — Flight Operations IT Protection**
American Airlines used Moogsoft AI to correlate end-user IT tickets with flight operations system data — detecting cascading IT failures early by recognizing when ground staff ticket patterns pointed to a systemic issue affecting flight-critical systems. The system monitors for ticket clusters involving specific system groups (gate management, check-in, baggage) and raises automated major incident alerts when patterns match known failure signatures. Over 12 months, the system identified two events from ticket cluster patterns more than 30 minutes before traditional infrastructure monitoring alerts — preventing both from escalating into ground delay events that would have affected hundreds of flights.

**Barclays Bank — Eliminating Blind Spots in Incident Detection**
Barclays Bank integrated ServiceNow ML-based major incident detection to surface ticket clusters pointing to undetected infrastructure failures across their retail banking, investment banking, and wealth management IT platforms. The bank had identified a long-standing "blind spot" — complex application-layer failures that generated user complaints before monitoring detected them. The AI system now processes ticket metadata continuously, detecting cluster patterns that indicate a common cause. In 18 months, "unknown major incidents" — those first reported by end users rather than monitoring — were reduced by 65%. This has materially improved the bank's overall incident detection coverage and reduced customer-facing outage minutes.

---

### 11. Sentiment Analysis — Digital Employee Experience (DEX) Monitoring
**Domain: Incident Management — Employee Experience Intelligence** | `[NORMAL AI]`

**What it is:** Real-time AI analysis of language, tone, and emotion in IT support interactions — detecting frustrated, distressed, or dissatisfied employees to enable proactive intervention, priority re-scoring, or escalation to more senior support staff.

**Real-World Examples:**

**Shopify — Proactive Employee Experience Management**
Shopify integrated Zendesk sentiment analysis into their internal IT support queue to identify employees showing frustration indicators — urgent language, repeated follow-ups, explicit complaints — and automatically flag their tickets for priority handling. Analysis revealed that approximately 12% of incoming IT tickets contained high-frustration signals that the team had not previously been able to identify systematically. Proactive callbacks for these flagged tickets improved internal IT CSAT scores by 22 points. The sentiment data also became a valuable signal for identifying which IT systems or processes were generating the most employee frustration, driving targeted improvement initiatives.

**Nestlé — Sentiment-Driven Service Quality Management**
Nestlé deployed sentiment-aware monitoring in ServiceNow across their global IT support function to detect negative employee experiences during IT incidents — particularly important in manufacturing environments where IT downtime directly affects production workers' ability to do their jobs. Tickets from production floor employees with negative sentiment signals are automatically routed to senior agents with deeper technical expertise. Ticket escalations due to employee frustration dropped by 30%. More significantly, aggregated sentiment data has been used to identify systemic process failures — one analysis revealed that a specific ERP module was generating disproportionately negative sentiment, leading to a targeted UX improvement project.

**Salesforce Internal IT — Building a DEX Baseline**
Salesforce's internal IT team used Einstein Conversation Insights to analyze sentiment across 50,000+ monthly IT chat interactions, building a Digital Employee Experience (DEX) score baseline that tracks IT's impact on employee satisfaction over time. The analysis revealed that 38% of negative sentiment in IT support interactions correlated with a single legacy VPN system — a finding that previously would have required extensive survey work to identify. This data-driven insight directly drove the decision to replace the legacy VPN, which was subsequently credited with a 15-point improvement in the DEX score for the affected employee population.

---

## Domain 4: Problem & Root Cause Management

*Use cases that identify underlying causes of recurring IT failures and accelerate problem resolution.*

---

### 12. Problem Detection — Recurring Incident Correlation
**Domain: Problem Management — Proactive Problem Identification** | `[NORMAL AI]`

**What it is:** AI that identifies when multiple incidents likely share a common underlying cause by clustering them based on affected CIs, descriptions, resolution patterns, and environmental context — proactively creating problem records before the same root cause generates more incidents.

**Real-World Examples:**

**Zalando — Reducing Repeat Incidents in E-Commerce Operations**
Zalando deployed Dynatrace Davis AI to correlate repeat incidents across their e-commerce IT infrastructure, where multiple microservices and third-party integrations create a complex failure landscape. The AI clusters incidents by technical symptoms, affected services, and timing patterns to detect when a common root cause is generating distributed failures across different system components. Within 6 months of deployment, repeat incident volume dropped by 40% as the problem management team was directed to address root causes faster — before the same issue generated another wave of incidents. Zalando attributes this to AI surfacing problem signals weeks earlier than manual review processes would have.

**Lufthansa Systems — Automated Problem Record Creation in Airline IT**
Lufthansa Systems deployed ServiceNow Predictive Intelligence for problem detection across airline IT operations — a domain where recurring incidents can have direct safety and regulatory implications. The AI monitors incident patterns in real time and automatically creates problem records when incident cluster thresholds are met, triggering problem management workflows without waiting for a human to notice a trend. Before AI, manual problem record creation was inconsistent and depended on experienced analysts noticing patterns. Automation has reduced the time from incident spike to problem record creation from 4 hours to 15 minutes, and 60% of all problem records are now AI-created.

**NHS Digital — Systemic Problem Detection Across 200 NHS Trusts**
NHS Digital implemented AI-driven problem detection to identify recurring IT incidents in clinical systems — including patient record systems, appointment management, and diagnostic imaging — across 200+ NHS trusts in England. The scale of the NHS IT estate meant that systemic problems often went undetected for months because individual trust IT teams each saw only their local slice of a broader pattern. The AI correlates incidents across trust boundaries, identifying patterns invisible at the individual organization level. In the first 3 months, 14 systemic problems were identified that had been generating thousands of repeat incidents annually — many related to shared NHS-wide applications with common configuration defects.

---

### 13. Root Cause Analysis (RCA) — AI-Driven Investigation
**Domain: Problem Management — Intelligent Root Cause Identification** | `[AGENTIC AI]`

**What it is:** AI that autonomously investigates problem records by traversing topology graphs, correlating infrastructure events with change histories, analyzing application performance traces, and synthesizing evidence into a probable root cause diagnosis with supporting evidence — acting as an autonomous investigator.

> **Why Agentic:** Advanced RCA systems (e.g., Dynatrace Davis, Splunk ITSI) autonomously query monitoring systems, traverse the CMDB dependency graph, correlate multiple event streams, and produce a diagnosed root cause with cited evidence — completing an investigation that would otherwise require multiple engineers hours of manual work.

**Real-World Examples:**

**Capital One — Rapid RCA for Banking Platform Outages**
Capital One deployed Splunk ITSI with AI-driven RCA capabilities to investigate complex multi-system outages across their banking platform, where transactions span dozens of microservices, databases, and third-party integrations. When a P1 incident fires, the AI automatically queries Splunk's indexed logs and metrics, correlates events across affected services using the CMDB dependency map, and produces a ranked list of probable root causes with supporting log evidence within minutes. Average RCA cycle time has dropped from 8 hours to under 90 minutes. In 87% of cases where the AI identified a root cause, the finding matched the conclusion of subsequent manual investigation — validating the approach with the team.

**Deutsche Bank — Autonomous Investigation for Trading Platform Stability**
Deutsche Bank deployed Dynatrace Davis AI RCA across their trading platform infrastructure — an environment where millisecond-level performance issues can have significant financial impact and where the complexity of interdependencies makes manual investigation extremely difficult. Davis AI autonomously analyzes distributed traces, infrastructure metrics, deployment events, and configuration changes, correlating them across thousands of monitored entities to pinpoint the specific change or anomaly that triggered a performance degradation. The system automatically identified the root cause for 73% of P1 incidents without human investigation, saving an estimated 1,200 engineering hours annually that were previously spent on manual post-incident analysis.

**Zalando — Pre-Populated RCA Drafts at Incident Close**
Zalando integrated AI RCA directly into their incident response workflow so that every P1/P2 incident automatically receives an AI-generated root cause investigation as the incident is closing. The AI links the incident timeline to deployment events (from their CI/CD pipeline), config changes, and infrastructure anomaly traces — producing a structured evidence chain for the post-incident review. Engineering teams now receive a pre-populated RCA draft within minutes of incident closure rather than starting from scratch. Post-incident review preparation time has fallen from 3 days to 4 hours, and the quality and completeness of RCA documentation has improved markedly — an important factor for engineering teams seeking to learn from incidents systematically.

---

## Domain 5: Change Management & Risk Intelligence

*Use cases that make IT change safer, faster, and more predictable through AI-driven risk assessment and optimization.*

---

### 14. Intelligent Risk Advisory for Change Management
**Domain: Change Management — AI-Powered Change Risk Assessment** | `[AGENTIC AI]`

**What it is:** AI that assesses the risk level of planned IT changes by clustering similar historical change records and analyzing their outcomes — proactively scoring risk, flagging high-risk changes before CAB review, and in advanced implementations, automatically routing or holding changes based on risk scores.

> **Why Agentic:** Modern deployments automatically insert the AI into the change approval workflow — flagging changes, routing them to the appropriate approval path, or placing auto-holds without waiting for a human to initiate. The AI is a gatekeeper, not just an advisor.

**Real-World Examples:**

**Sony Pictures Entertainment — Intelligent CAB Risk Scoring**
Sony Pictures Entertainment implemented ServiceNow's Change Risk Predictor to automatically score every change request against a machine learning model trained on 3 years of historical change data — including details of changes that caused incidents. High-risk changes (predicted >40% probability of causing an incident) are automatically flagged for mandatory CAB review, while low-risk changes are fast-tracked to a lightweight approval path. Change-related incidents dropped by 35% in the first year, and the efficiency gain was equally significant: CAB meeting duration reduced from 3 hours to 45 minutes as the committee focused exclusively on high-risk changes rather than reviewing all standard changes equally.

**ExxonMobil — Protecting Critical Infrastructure from Risky Changes**
ExxonMobil deployed BMC Helix AI change risk scoring across their refinery and downstream IT systems — environments where a failed IT change can trigger operational downtime measured in millions of dollars per hour. The AI model clusters each proposed change against similar historical changes in the same environment, scoring risk based on the failure rate of analogous past changes. Over 6 months, the system flagged 12 high-risk changes that would previously have been approved through standard process. Post-analysis confirmed that all 12 had significant failure potential. Preventing those changes from proceeding is estimated to have avoided $15M in potential unplanned downtime costs.

**National Australia Bank (NAB) — AI Risk Scores as Audit Evidence**
National Australia Bank implemented AI-powered change risk clustering that flags changes similar to those that caused major incidents in NAB's IT history — giving change managers and auditors a quantified, explainable risk signal. The system maintains a full audit trail of why each risk score was assigned, citing the historical change records that informed the rating. Change-related outages dropped by 42% over 18 months. Uniquely, NAB's compliance team now uses AI-generated change risk scores as supporting evidence in regulatory audit submissions, demonstrating a systematic, data-driven approach to change risk management that satisfies financial services regulators.

---

### 15. Change Optimization — Standardization Intelligence
**Domain: Change Management — Change Efficiency** | `[NORMAL AI]`

**What it is:** AI that analyzes historical change records to identify frequently repeated manual changes that could be standardized, pre-approved, automated, or converted to self-service — reducing CAB overhead, accelerating deployment speed, and minimizing human error in routine changes.

**Real-World Examples:**

**Delta Air Lines — Transforming the Change Approval Process**
Delta Air Lines applied ServiceNow AI change analytics to analyze 24 months of historical change requests, identifying patterns in which types of changes were consistently approved without modification or risk scoring concerns. The analysis identified 35% of all standard changes as candidates for pre-approval status — changes so consistently low-risk and well-defined that CAB review added no value. Converting these to pre-approved automated changes reduced CAB meeting agendas by 40%, freeing the Change Advisory Board to focus its attention on genuinely complex, high-risk changes. Delta IT estimates the time saved in change governance alone freed the equivalent of two senior IT manager roles for more strategic work.

**Mastercard — Accelerating Payment System Change Velocity**
Mastercard applied ML-based change pattern analysis to their payment processing infrastructure — an environment where change velocity must balance agility with zero tolerance for failures that could affect millions of transactions. The AI identified 28% of all change requests as low-risk, repetitive infrastructure changes (certificate renewals, routine patching, configuration updates following approved templates) that previously required full manual review. Automating approval for this category reduced change cycle time from 5 business days to 4 hours. The freed CAB capacity allowed the team to invest more deeply in reviewing the genuinely novel changes that warranted scrutiny.

**Philips Healthcare IT — Standardizing Medical IT Change Procedures**
Philips Healthcare IT deployed AI change optimization to identify standardization opportunities across medical device software update procedures and clinical system maintenance changes — a category where inconsistent change execution can have patient safety implications. The AI identified 45 distinct change types that were being executed with slight variations each time, increasing the risk of deviation errors. Standardizing these 45 types into formally defined, pre-approved change procedures reduced change-related incidents on medical IT systems by 31% in 12 months, while also shortening the time required to execute each change by an average of 40% due to the clarity of standardized procedures.

---

## Domain 6: Intelligent Routing & Expert Coordination

*Use cases that ensure work reaches the right person or team at the right time through AI-driven assignment and collaboration.*

---

### 16. Intelligent Routing — AI-Powered Ticket Assignment
**Domain: Routing & Assignment — Automated Dispatch** | `[AGENTIC AI]`

**What it is:** AI that autonomously assigns incoming incidents and requests to the most suitable and available resolver group or individual — based on skills, current workload, past performance with similar tickets, and ticket characteristics — writing the assignment in the system without human dispatcher involvement.

> **Why Agentic:** The AI takes direct action in the ITSM system, not just a recommendation — it assigns the ticket, moves it to the correct queue, and may trigger an automated notification to the assignee, all without human initiation.

**Real-World Examples:**

**Spotify — Squad-Based Routing with Capacity Awareness**
Spotify implemented Atlassian Jira Service Management's AI routing to automatically assign incoming IT requests to the correct engineering squad, factoring in CI tags, issue type classification, and real-time squad capacity data. Before AI routing, tickets were dispatched manually by a dedicated queue manager — a bottleneck during high-volume periods. The AI now handles all dispatch decisions in real time, ensuring that squads receive tickets matching their domain expertise without overloading any single team. Misrouted tickets dropped by 60%, and first-touch-resolution increased from 48% to 71% as tickets landed with the right team the first time. The queue manager role was redeployed to higher-value service improvement work.

**American Express — Global Assignment at Scale**
American Express deployed ServiceNow intelligent routing across 200+ IT resolver groups spanning Americas, EMEA, and APAC — a routing complexity that had previously required a team of dedicated dispatch coordinators monitoring queues around the clock. The AI considers resolver group expertise profiles, current open ticket loads, agent availability windows (accounting for time zones), and ticket type to make assignment decisions. Average queue wait time dropped from 2.1 hours to 28 minutes, and resolver group utilization is now balanced dynamically, preventing the overloading that previously caused some teams to run at 140% capacity while adjacent teams had spare capacity.

**Volkswagen Group IT — Pan-European Routing Accuracy**
Volkswagen Group IT implemented ML-based routing within BMC Helix ITSM across their pan-European IT support structure covering Germany, UK, Spain, Czech Republic, and 6 other countries — each with local resolver teams and a mix of regional and global service towers. The ML model was trained on 18 months of historical routing data and reached 94% routing accuracy within 6 months. Misrouted ticket rates fell from 22% to under 6%, eliminating the significant rework cycle caused by tickets being returned from incorrect resolver groups. The efficiency improvement eliminated the need for 4 dedicated dispatch FTEs whose roles have been converted to specialist IT service improvement positions.

---

### 17. Intelligent Swarming — AI-Orchestrated Expert Mobilization
**Domain: Routing & Assignment — Dynamic Expert Collaboration** | `[EMERGING AI]`

**What it is:** AI that proactively identifies domain experts — including those outside IT, such as application developers or business owners — and actively assembles them into a real-time collaboration channel (Slack, Teams) based on incident context and expert skill profiles, replacing the traditional tiered escalation model with dynamic swarming.

> **Why Emerging:** While pioneered by leading technology companies, intelligent swarming remains nascent in the broader market — fewer than 20% of organizations have moved beyond traditional tiered support to genuine AI-orchestrated swarming. Gartner anticipates rapid adoption as collaboration-platform integrations mature.

> **Why Agentic:** The AI doesn't just identify experts — it creates collaboration channels, sends invitations, shares incident context, and actively pulls the right people into the resolution, acting as an autonomous incident coordinator.

**Real-World Examples:**

**Cisco Internal IT — Eliminating Tier-Based Escalation**
Cisco pioneered intelligent swarming within their internal IT organization, replacing the traditional Tier 1 → Tier 2 → Tier 3 escalation model with an AI-driven swarming approach using Webex Teams integrated with ServiceNow. When a complex incident is detected, the AI analyzes the ticket content, affected CI, and symptoms, then queries a skill graph of all IT staff to identify the most relevant experts. It automatically creates a Webex Teams space, invites the identified experts, shares the incident brief, and begins coordinating resolution — all within 60 seconds of the incident being raised. MTTR for complex incidents dropped by 52%, and Cisco now operates with no traditional tier-based escalation for the majority of incident types.

**Autodesk — Rapid Assembly of P1 Swarm Squads**
Autodesk built AI swarming into their ServiceNow and Slack integration to automatically assemble "swarm squads" for P1/P2 incidents affecting their creative cloud products and internal engineering systems. The AI model identifies not only IT experts but also vendor contacts, product engineers, and business stakeholders based on the affected service. A P1 incident on the Autodesk platform automatically triggers the creation of a Slack channel within 90 seconds, populated with the right engineers, a summarized incident brief, links to relevant monitoring dashboards, and recent change records. Bridge call setup time dropped from 22 minutes to under 4 minutes, and customer-facing impact duration for major incidents was reduced by 35%.

**Capital One — Data-Driven Expert Identification Across Financial IT**
Capital One developed an AI-powered expert identification engine that analyzes ticket text, resolution history, skill tags, and recent project involvement to dynamically identify the best responders for each incident — including engineers from product teams, data platform teams, and third-party vendors who may rarely appear in traditional ITSM resolver group lists. The system integrates with Slack and ServiceNow to assemble response teams automatically. P1 resolution time improved by 41%, and the rate of incidents where the wrong team was initially engaged dropped from 30% to 4% — a reduction that directly cut the time wasted in early incident response on misdirected effort.

---

## Domain 7: Case Summarization & Automated Communications

*Use cases that use GenAI to eliminate documentation burden, accelerate context transfer, and improve communication quality.*

---

### 18. Incoming Request Summarization
**Domain: Case Management — Agent Context Acceleration** | `[NORMAL AI]`

**What it is:** GenAI that reads an incoming incident or request — including the full ticket thread, work log history, and attached notes — and produces a concise, structured summary for the assigned expert, enabling them to understand the full context and act immediately without reading through lengthy unstructured ticket content.

**Real-World Examples:**

**Zoom Internal IT — Reducing Agent Cognitive Load**
Zoom deployed ServiceNow Agent Assist with AI summarization for their internal IT support team — particularly valuable for complex, multi-comment tickets that arrive from escalation paths with long conversation histories. When a ticket is assigned, the agent sees an AI-generated summary highlighting the core issue, steps already taken, and recommended next actions — presented before the full ticket thread. Average time-to-first-action dropped by 4 minutes per ticket, and in post-implementation surveys, 78% of agents reported that AI summaries meaningfully reduced their cognitive load during busy periods. Agent job satisfaction scores improved by 35%, attributed in part to the reduction in time spent parsing poorly formatted ticket notes.

**Telefónica — Multilingual Ticket Context Across 14 Countries**
Telefónica implemented Freshservice Freddy AI summarization for their global IT support team handling tickets in Spanish, Portuguese, English, French, German, and Czech — a multilingual challenge that previously made cross-region ticket sharing nearly impossible without manual translation. The AI generates standardized, English-language summaries for all incoming tickets regardless of the original language, enabling any global team member to take over a ticket immediately. Agents now spend 40% less time reading and interpreting ticket context, and cross-region ticket sharing — previously a last resort — has become a routine part of workload balancing across time zones.

**Vodafone Group IT — Intelligent Escalation Briefings**
Vodafone Group IT integrated GenAI ticket summarization specifically for Tier-2 agents receiving escalated tickets — historically a point of significant friction as escalated tickets often contained long, unstructured work logs from Tier-1 agents. The AI generates a structured escalation brief that highlights what has already been attempted, what the user's specific complaint is, and what CI and service are affected. In 72% of escalated cases, agents reported that the AI summary provided everything they needed to begin diagnosis immediately without asking the user for information already captured in the ticket. Repeat-question incidents — a key driver of user frustration during escalations — dropped significantly.

---

### 19. Intelligent Post-Call Wrap-Up
**Domain: Case Management — Documentation Quality** | `[NORMAL AI]`

**What it is:** GenAI that converts rough, shorthand, or colloquial agent work-log notes recorded during a support call into clean, standardized, structured case notes — automatically reducing after-call work (ACW) time and improving the quality and auditability of resolution documentation.

**Real-World Examples:**

**T-Mobile — Cutting After-Call Documentation Time**
T-Mobile deployed AI-powered wrap-up within their ITSM workflow to convert support agent call notes — often typed hastily during live calls in shorthand and abbreviated form — into professionally structured resolution documentation. After each call, the AI processes the agent's raw notes and produces a standardized summary with defined fields for issue description, diagnostic steps, resolution action, and prevention recommendation. Average after-call work time dropped from 6 minutes to 90 seconds per call. Beyond time savings, the improved note quality increased knowledge article generation success: 55% more resolution notes were deemed suitable for conversion to KB articles than before AI wrap-up was introduced.

**Axa Insurance IT — Compliance-Grade Documentation Across Europe**
Axa Insurance IT deployed ServiceNow Now Assist wrap-up to ensure that case notes from their 500+ IT agents across France, Germany, UK, and Spain met the company's documentation standards — a requirement with compliance implications in financial services IT. Before AI wrap-up, agent notes varied widely in quality and completeness, creating audit risks during IT compliance reviews. Post-deployment, 90% of case notes automatically conform to Axa's documentation standard without manual review. Compliance audit time for IT case reviews has been reduced by 40%, and the legal team has noted a significant improvement in the evidentiary quality of IT documentation used in service disputes.

**BNY Mellon — Regulatory-Quality IT Case Documentation**
BNY Mellon integrated AI wrap-up into their ITSM platform to ensure that IT support documentation across their banking and asset management platforms meets the quality required for SOX and financial services regulatory compliance. Their IT environment requires that case notes be complete, accurate, and traceable — documentation that previously depended entirely on individual agent diligence. The AI wrap-up system normalizes and structures all notes before they are committed to the ITSM record. Annual SOX audit preparation time related to IT case documentation has been reduced by 3 weeks, and the external auditor has formally noted improved consistency and completeness in IT operational records.

---

### 20. Automatic Communications — Incident & Change Notifications
**Domain: Case Management — Stakeholder Communications** | `[NORMAL AI]`

**What it is:** GenAI that drafts, refines, and in some cases automatically sends case update notifications, major incident communications, and stakeholder messages — maintaining professional, consistent, and timely communication without burdening incident managers with writing during high-pressure situations.

**Real-World Examples:**

**Warner Bros. Discovery — Real-Time Stakeholder Communications for Streaming Outages**
Warner Bros. Discovery deployed ServiceNow Now Assist to auto-generate major incident notifications for business stakeholders during streaming platform outages — situations where every minute of communication delay translates to executive anxiety and customer impact. Previously, incident managers had to draft notifications while simultaneously managing the incident, often resulting in delayed or inconsistently worded communications. The AI generates a structured incident notification within 30 seconds of a major incident being declared, ready for the incident manager to review and approve. Time to first stakeholder communication dropped from an average of 25 minutes to under 3 minutes, and the quality of stakeholder communications has been consistently praised by the executive team.

**PagerDuty Customers — AI Status Updates Across 1,400+ Enterprises**
PagerDuty's AI-generated incident status updates — adopted by over 1,400 enterprise customers including Cloudflare, Twilio, and Monday.com — automatically generate structured stakeholder updates at each stage of incident response, including initial notification, ongoing updates, and resolution summaries. The AI synthesizes the incident timeline, current status, business impact, and next steps into a communication appropriate for executive stakeholders who do not need technical detail. PagerDuty's customer data shows a 60% reduction in time spent writing incident updates after deployment, and customers consistently report improved stakeholder satisfaction with incident communications compared to pre-AI methods.

**Heineken IT — Multilingual Change Communications Across 60 Countries**
Heineken IT deployed AI-drafted communications for planned maintenance windows and change notifications across their global IT estate spanning 60+ countries. Previously, generating compliant change communications in local languages required coordination with regional teams, adding 2–3 days to the change communication cycle. The AI generates localized change notifications in 12 languages, with regional IT managers reviewing and approving rather than drafting from scratch. Change communication preparation time dropped by 70%, and compliance with the company's change communication policy — which requires notifications in the local language of affected users — improved from 65% to 98% globally.

---

### 21. Major Incident Summarization for Post-Incident Reviews
**Domain: Case Management — Post-Incident Learning** | `[NORMAL AI]`

**What it is:** GenAI that synthesizes the complete timeline of a major incident — from initial detection through resolution — into a structured post-incident review (PIR) document, drawing from work logs, communications, change records, and monitoring data to produce a review-ready draft that teams can refine rather than author from scratch.

**Real-World Examples:**

**Slack (Salesforce) — Post-Mortem at Software Company Scale**
Slack's internal engineering team used AI-assisted post-mortem generation to auto-draft post-incident reviews from incident timelines, Slack thread summaries, and deployment logs — particularly critical for a company whose own product is a communication platform that must maintain very high availability standards. The AI generates a structured post-mortem including timeline reconstruction, contributing factors, impact analysis, and action items, in a format compatible with Slack's blameless post-mortem culture. Post-mortem writing time dropped from 3–4 hours per incident to under 30 minutes. Teams now complete PIRs within 24 hours of incident closure — compared to a previous average of 5 days — enabling faster organizational learning from incidents.

**Etsy — Systematic Engineering Learning Through AI-Generated Reviews**
Etsy integrated GenAI into their incident tooling to auto-generate major incident summaries from PagerDuty incident timelines and runbook execution logs — an approach designed to make post-incident learning systematic rather than dependent on individual engineer initiative to document thoroughly. The AI produces a comprehensive timeline that includes automated remediation actions, manual interventions, and the sequence of events, which individual engineers then annotate with context and learnings. Etsy's engineering team estimates 1,800 person-hours saved annually on PIR documentation, and the quality and completeness of reviews has improved significantly because the AI captures every timeline event that an exhausted post-incident engineer might have missed.

**NHS England Digital — Clinical Incident Documentation for Governance**
NHS England Digital deployed AI incident summarization for clinical IT major incidents — system failures in clinical environments with regulatory reporting requirements — to produce standardized PIR reports for NHS governance and regulatory submission. Previously, producing a governance-grade PIR for a major clinical IT incident required 2 weeks of coordination across multiple NHS trusts, clinical teams, and IT teams. The AI generates a structured, evidence-based PIR from the incident record within hours of closure, which governance teams review and certify. PIR cycle time has dropped from 2 weeks to 3 days. Regulators have specifically noted the improved consistency and completeness of NHS clinical IT incident documentation since the system was deployed.

---

### 22. ITSM Report Generation — Postincident & Postrelease Reviews
**Domain: Case Management — Automated ITSM Reporting** | `[NORMAL AI]`

**What it is:** GenAI that produces complete ITSM management reports — including postincident reviews, postrelease assessments, and periodic performance reports — by automatically aggregating and synthesizing data from ITSM platforms, monitoring tools, change records, and CI performance metrics.

**Real-World Examples:**

**Warner Bros. Discovery — Automated Postrelease Reviews**
Warner Bros. Discovery used ServiceNow Now Assist to auto-generate postrelease review reports after each major release to their Max streaming platform. Previously, producing a postrelease report required 1–2 days of manual data gathering from ServiceNow, Dynatrace, and their change management records, followed by hours of writing. The AI now automatically pulls incident data, change records, deployment metrics, and monitoring anomalies linked to each release window, producing a structured postrelease report within hours of the release completing. Report preparation time dropped from 1 full day to 2 hours, and the reports now consistently include data points — such as correlated infrastructure anomalies — that manual reports often omitted due to the effort required to retrieve them.

**Reckitt (Benckiser) IT — CIO-Level ITSM Reporting Automation**
Reckitt's IT function deployed AI-generated monthly ITSM performance reports for CIO-level review, pulling from ServiceNow analytics across their global operations in consumer health, hygiene, and nutrition businesses. Previously, three regional IT teams each produced separate monthly reports in slightly different formats, requiring a central team to spend 3 days consolidating and normalizing data each month. The AI produces a unified, narrative-format CIO report with automated trend analysis, anomaly callouts, and month-over-month comparisons. Monthly reporting effort has been reduced by 3 days per region, and CIO dashboards now reflect consistent, real-time narrative summaries that executives can act on without filtering through raw metric tables.

**Lloyds Banking Group — Regulatory IT Reporting Compliance**
Lloyds Banking Group deployed GenAI report generation for their IT risk and governance team — responsible for producing change and incident review reports that must satisfy financial services regulatory requirements, including FCA and Bank of England standards. The reports require comprehensive, consistent coverage of all change activity, incident statistics, and SLA performance — documentation that previously took a team of 4 governance analysts 2 weeks per quarter to prepare. AI-generated reports assemble all required data points automatically, with analysts now reviewing and approving rather than authoring. Regulatory reporting preparation time was cut by 60%, and external regulatory reviewers have noted the improved consistency and completeness of Lloyds' IT governance documentation.

---

## Emerging / Future Horizon Use Cases

*Capabilities identified by Gartner as directionally important but not yet widely deployed — representing where the market is moving by 2027–2030.*

---

### 23. Zero-Touch Service Desk
**Domain: Future IT Service Desk** | `[EMERGING AI]`

**What it is:** An end-state ITSM operation where AI autonomously handles the full lifecycle of the vast majority of IT support requests — from intake through resolution — with humans involved only in exception handling, complex problem management, and continuous AI improvement. Gartner projects fewer than 1% of organizations have this today, rising to 20% by 2030.

> **Why Emerging:** True zero-touch service desk requires mature agentic AI, a comprehensive, high-quality knowledge base, reliable autonomous action capabilities, and significant organizational trust in AI decision-making — prerequisites that most organizations are still building toward.

**Real-World Examples:**

**DXC Technology — Approaching Zero-Touch for Standard Requests**
DXC Technology has achieved a near-zero-touch state for their most common incident and request categories — password resets, access requests, software installs, and VPN issues — across their 130,000+ employee internal IT estate. The Aisera-powered system handles the entire lifecycle (intake, authentication, action, resolution, closure) without human involvement for these categories, which represent 65% of total ticket volume. DXC is actively working toward extending autonomous handling to additional categories, targeting 80% autonomous resolution by 2026. This trajectory puts them among the most advanced organizations globally in realizing Gartner's zero-touch vision ahead of the 2030 industry milestone.

**Unilever — Digital First, Human Exception Model**
Unilever has publicly committed to a "digital first, human exception" IT support model as part of their enterprise digital transformation. Combining ServiceNow Virtual Agent, AI categorization, intelligent routing, and automated fulfillment workflows, Unilever has progressively moved common IT request categories to fully automated, human-free resolution paths. As of 2024, 45% of all IT requests are resolved without any human agent touch. Their roadmap targets 70% autonomous resolution by 2027, with human agents focused exclusively on complex problem investigation and continuous AI training and governance.

**Atlassian Internal IT — Engineering-Optimized Auto-Resolution**
Atlassian's internal IT team has built toward zero-touch service desk for their engineering population — developers who expect fast, friction-free IT support. By combining VSA, automated provisioning integrations with Okta, GitHub, and AWS, and AI-driven ticket classification, Atlassian resolves the majority of access, tool provisioning, and standard troubleshooting requests automatically. Their internal IT team has grown their service capacity significantly since 2022 without adding headcount — handling 3× more requests per agent by progressively removing human touch from automatable request categories.

---

### 24. Autonomous AI Operations (AIOps Integration for ITSM)
**Domain: Future IT Operations** | `[EMERGING AI]`

**What it is:** An integrated capability where ITSM AI and AIOps platforms work together to detect infrastructure anomalies, automatically create and categorize incidents, diagnose root causes, and in advanced cases execute automated remediation — operating as a continuous, autonomous IT operations function with humans in a governance and exception role.

> **Why Emerging:** Full integration between ITSM AI and AIOps — where the loop from detection to remediation is closed autonomously — is aspirational for most organizations. Leading technology companies are demonstrating the path, but the organizational trust, runbook coverage, and integration maturity required makes this a 2027–2030 horizon capability for the broader market.

**Real-World Examples:**

**Google SRE — Autonomous Incident Detection and Remediation**
Google's Site Reliability Engineering teams operate at the frontier of autonomous IT operations — using ML-based anomaly detection, automated incident creation, and runbook automation to handle thousands of minor incidents per day with no human involvement. When an anomaly is detected, the system automatically creates an incident, queries the relevant runbooks, executes pre-approved remediation actions (traffic rerouting, service restarts, quota adjustments), and closes the incident if successful — all within seconds. Humans are paged only when automation fails or when incidents exceed defined thresholds. This model has enabled Google to operate planet-scale infrastructure with SRE headcount that would be impossible if humans were in the loop for every operational event.

**Amazon AWS Operations — Automated Event-to-Resolution Loops**
Amazon has built automated event-to-resolution loops across their AWS service delivery operations, where ML models detect service degradation, automatically correlate the event to its probable cause using dependency graphs, and trigger automated mitigation playbooks before any human is aware of the incident. For a significant proportion of common failure patterns — service overload, capacity exhaustion, routing anomalies — the system detects, mitigates, and closes incidents autonomously. The capability is foundational to AWS's ability to deliver the SLA reliability levels that underpin their $100B+ cloud revenue. Amazon has begun exposing similar autonomous operations capabilities to enterprise customers through AWS Systems Manager and DevOps Guru services.

**Netflix — Chaos Engineering Meets Autonomous Recovery**
Netflix operates an autonomous resilience engineering model where — beyond just detecting failures — their Chaos Engineering platform (Chaos Monkey) deliberately injects failures to train and validate autonomous recovery capabilities. Their operations AI can detect when a microservice has become degraded, isolate the affected traffic using their edge infrastructure, trigger automated recovery procedures, and restore service — all without paging an engineer. Netflix engineers focus on building and validating the recovery playbooks that the AI executes, rather than manually responding to incidents. This model has enabled Netflix to achieve 99.99%+ availability for their core streaming service despite running on infrastructure that is designed to regularly experience component failures.

---

## Summary: Use Case Category Map

| # | Use Case | ITSM Domain | Category |
|---|---|---|---|
| M1 | ITSM Data Analysis Using AI | Data & Intelligence Foundation | `NORMAL AI` |
| M2 | AI-Generated ITSM Recommendations & Actions | ITSM Practice Automation | `NORMAL AI` |
| 1 | Virtual Support Agent (VSA) | IT Service Desk — Consumer-Facing | `AGENTIC AI` |
| 2 | Operations Assistant for ITSM Practitioners | IT Service Desk — Practitioner Co-Pilot | `AGENTIC AI` |
| 3 | Public Knowledge Discovery (LLMs) | Knowledge Management | `NORMAL AI` |
| 4 | Proprietary Knowledge Discovery (Custom LLM) | Knowledge Management | `NORMAL AI` |
| 5 | Universal Knowledge Discovery (RAG) | Knowledge Management | `NORMAL AI` |
| 6 | IT Knowledge Generation from Case Data | Knowledge Management | `NORMAL AI` |
| 7 | Intelligent Triage — Incident Prioritization | Incident Management | `NORMAL AI` |
| 8 | Intelligent Categorization — Ticket Classification | Incident Management | `NORMAL AI` |
| 9 | Intelligent Escalation — SLA Breach Prevention | Incident Management | `NORMAL AI` |
| 10 | Major Incident Detection — User-Reported Clustering | Incident Management | `NORMAL AI` |
| 11 | Sentiment Analysis — DEX Monitoring | Incident Management | `NORMAL AI` |
| 12 | Problem Detection — Recurring Incident Correlation | Problem Management | `NORMAL AI` |
| 13 | Root Cause Analysis — AI-Driven Investigation | Problem Management | `AGENTIC AI` |
| 14 | Intelligent Risk Advisory for Change Management | Change Management | `AGENTIC AI` |
| 15 | Change Optimization — Standardization Intelligence | Change Management | `NORMAL AI` |
| 16 | Intelligent Routing — AI-Powered Ticket Assignment | Routing & Assignment | `AGENTIC AI` |
| 17 | Intelligent Swarming — AI-Orchestrated Expert Mobilization | Routing & Assignment | `EMERGING AI` |
| 18 | Incoming Request Summarization | Case Management | `NORMAL AI` |
| 19 | Intelligent Post-Call Wrap-Up | Case Management | `NORMAL AI` |
| 20 | Automatic Communications — Incident & Change Notifications | Case Management | `NORMAL AI` |
| 21 | Major Incident Summarization for Post-Incident Reviews | Case Management | `NORMAL AI` |
| 22 | ITSM Report Generation | Case Management | `NORMAL AI` |
| 23 | Zero-Touch Service Desk | Future IT Service Desk | `EMERGING AI` |
| 24 | Autonomous AI Operations (AIOps + ITSM Integration) | Future IT Operations | `EMERGING AI` |

**Breakdown:** 5 Agentic AI · 17 Normal AI · 3 Emerging AI | Total: 25 use cases across 8 ITSM domains

---

## Reference

> **Source Document:** Gartner Magic Quadrant for AI Applications in IT Service Management
> **Published:** 2 September 2025 | **Report ID:** G00823161
> **Authors:** Chris Matchett, Rich Doheny
> **URL:** https://www.gartner.com/doc/reprints?id=1-2LS73XWW&ct=250902&st=sb

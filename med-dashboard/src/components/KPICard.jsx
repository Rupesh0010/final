import { Card, CardContent, Typography } from "@mui/material";

const KPICard = ({ title, value, change, positive }) => {
  return (
    <Card sx={{ minWidth: 200, textAlign: "center" }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
        {change && (
          <Typography color={positive ? "green" : "red"}>{change}</Typography>
        )}
      </CardContent>
    </Card>
  );
};


// ChatGPT for RCM Automation – Expanded Implementation
// Playbook
// This expanded playbook contains multiple prompt templates per use case, covering step-by-step,
// compliance, automation-friendly JSON, and short-summary variants.
// Appeal Letter Generation
// Formal Letter
// You are an expert in US healthcare revenue cycle management appeals. Using the details below,
// generate a professional, persuasive appeal letter. [Claim Details]: {{claim_data}} [Denial Reason]:
// {{denial_reason}} [Payer Policy Excerpt]: {{policy_text}} Requirements: 1. Address payer by name.
// 2. Cite specific clauses. 3. Explain medical necessity. 4. End with overturn request.
// Step-by-Step Draft
// Act as a denial management specialist. Follow these steps: 1. Restate denial reason. 2. Identify
// relevant policy clauses. 3. Present factual arguments. 4. Write letter in professional tone. 5. End
// assertively. [Claim Data]: {{claim_data}} [Policy Text]: {{policy_text}} [Denial Code]: {{denial_code}}
// JSON Output for Automation
// You are drafting an insurance appeal letter for automation workflows. Output in JSON format: {
// "summary": "...", "policy_citations": [], "letter_body": "..." } [Claim Details]: {{claim_data}} [Denial
// Reason]: {{denial_reason}} [Policy Text]: {{policy_text}}
// Compliance Heavy
// You are an expert in payer compliance. Generate an appeal letter: - Use only provided data. - Avoid
// any PHI beyond provided fields. - Cite CMS guidelines if applicable. [Claim]: {{claim_data}} [Denial
// Reason]: {{denial_reason}} [Payer Policy]: {{policy_text}}
// Short Executive Summary
// Summarize the claim denial and recommended overturn arguments in under 150 words. [Claim
// Data]: {{claim_data}} [Denial Reason]: {{denial_reason}}
// Coding Assistance
// Direct Coding Suggestion
// You are a certified medical coder. Given the documentation, list ICD-10, CPT, and HCPCS codes
// with description and rationale. [Encounter Note]: {{clinical_text}}
// Step-by-Step Reasoning
// You are a coding auditor. Follow: 1. Extract diagnoses. 2. Extract procedures. 3. Map to ICD-10,
// CPT, HCPCS. 4. Identify missing documentation. [Encounter Note]: {{clinical_text}}
// Compliance Variant
// You are a coding compliance officer. Provide codes strictly supported by provided text; no
// assumptions. [Encounter Note]: {{clinical_text}}
// Automation JSON
// Output coding recommendations in JSON: { "icd10": [ {"code": "...", "desc": "..."} ], "cpt": [], "hcpcs":
// [] } [Encounter Note]: {{clinical_text}}
// Summary for Training
// Summarize key coding decisions from the note for coder training. [Encounter Note]: {{clinical_text}}
// Claim Scrubbing
// Direct Audit
// You are an RCM claim audit specialist. Identify all errors in the claim vs payer rules. [Claim Data]:
// {{claim_data}} [Payer Rules]: {{payer_rules}}
// Step-by-Step
// Audit process: 1. Validate demographics. 2. Validate codes. 3. Match modifiers. 4. Check policy
// compliance. [Claim Data]: {{claim_data}} [Payer Rules]: {{payer_rules}}
// Compliance Focus
// Only flag items that are policy violations; avoid speculative issues. [Claim Data]: {{claim_data}}
// [Payer Rules]: {{payer_rules}}
// Automation JSON
// Output: { "errors": [ {"field": "...", "issue": "...", "suggestion": "..."} ] } [Claim Data]: {{claim_data}}
// [Payer Rules]: {{payer_rules}}
// Risk Score
// Assign a compliance risk score 0-100 to the claim and explain. [Claim Data]: {{claim_data}} [Payer
// Rules]: {{payer_rules}}
// KPI Narratives
// Direct Narrative
// You are a healthcare finance analyst. Explain trends from KPIs. [KPI Data]: {{metrics_table}}
// Executive Summary
// Summarize KPI trends for board presentation in 200 words. [KPI Data]: {{metrics_table}}
// Action-Oriented
// List top 3 risks and top 3 opportunities from KPIs. [KPI Data]: {{metrics_table}}
// Automation JSON
// Output: { "summary": "...", "risks": [], "opportunities": [] } [KPI Data]: {{metrics_table}}
// Change Detection
// Highlight only KPIs with >10% change from previous period. [KPI Data]: {{metrics_table}}
// Denial Trend Analysis
// Direct Analysis
// Analyze denial data for top causes and payers. [Denial Data]: {{denial_history}}
// Step-by-Step
// Process: 1. Group denials by reason. 2. Rank by frequency. 3. List top payers. 4. Suggest fixes.
// [Denial Data]: {{denial_history}}
// Compliance Angle
// Flag denials that indicate possible systemic policy issues. [Denial Data]: {{denial_history}}
// Automation JSON
// Output: { "top_reasons": [], "top_payers": [], "recommendations": [] } [Denial Data]: {{denial_history}}
// Summary for Staff
// Write a 100-word staff bulletin summarizing denial patterns. [Denial Data]: {{denial_history}}
// Patient Billing Communication
// Plain Language Rewrite
// Rewrite bill in simple terms for patient. [Bill Explanation]: {{technical_text}}
// Empathy Focus
// Explain bill in empathetic tone. [Bill Explanation]: {{technical_text}}
// Step-by-Step Clarity
// Break bill into sections with plain explanations. [Bill Explanation]: {{technical_text}}
// Automation JSON
// Output: { "sections": [ {"title": "...", "description": "..."} ] } [Bill Explanation]: {{technical_text}}
// Bilingual Variant
// Translate bill explanation into Spanish at 6th grade reading level. [Bill Explanation]:
// {{technical_text}}

export default KPICard;

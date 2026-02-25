import { useState, useCallback, useRef } from "react";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const THE3KEYS_MISSION = `The3Keys is a nonprofit organization dedicated to empowering communities through education, mentorship, and opportunity. The organization provides resources and support to underserved youth, helping them unlock their potential through three core pillars: academic support, life skills development, and career readiness. The3Keys believes every young person deserves access to the keys that open doors to a brighter future.`;

const SYSTEM_PROMPT = `You are a nonprofit fundraising research assistant for The3Keys, a small but impactful nonprofit organization.

ABOUT THE3KEYS:
The3Keys (https://www.the3keys.org/) is a grassroots nonprofit dedicated to empowering underserved youth in the Bay Area through education, mentorship, and career readiness. Key facts:
- Small to mid-size nonprofit (annual budget likely $500K–$3M range)
- Focus: K-12 education, youth mentorship, career pathway development, college prep
- Geographic focus: Bay Area / Northern California
- Community-based, local impact model
- Limited grant-seeking capacity (no massive proposals to Fortune 500 companies)
- Mission alignment: Youth empowerment, education equity, underserved communities

REALISTIC SCORING CONTEXT:
When scoring prospects 1-10, remember:
- A tech giant (Google, Microsoft, Apple) giving specifically to a small Bay Area youth nonprofit is RARE. Score realistically: 4-6/10 max, not 8-9.
- Mid-market companies with local Bay Area operations = better fit (score 6-8/10).
- Community banks, regional employers, local wealth = STRONGEST prospects (score 7-10/10).
- Does the company have a LOCAL presence or footprint where The3Keys works?
- Does their CSR focus include youth/education/community development at a scale relevant to smaller orgs?
- Can The3Keys actually apply to this company's grants (not just mega-grants for big institutions)?

SCORING WEIGHTS (in order of importance):
1. LOCAL PRESENCE or Bay Area connection (highest weight)
2. Explicit youth/education/underserved community focus in their giving
3. History of grants to small/mid-size nonprofits (not just large universities/hospitals)
4. Accessibility of their grant program (rolling vs. impossible deadlines, reasonable requirements)
5. Grant size alignment (are they funding $5K–$50K grants, or only $500K+ tranches?)
6. Employee volunteer programs or board participation opportunities (secondary benefit)

When given a company name and optionally a contact's name and title, you must:

1. RESEARCH the company's charitable giving history by searching for:
   - Corporate social responsibility (CSR) programs and priorities
   - Company foundation or giving programs
   - History of donations to education, youth, or community nonprofits
   - Typical grant/donation sizes if available
   - Key contacts for philanthropy/CSR
   - **EMPLOYEE MATCH PROGRAMS**: Does this company match employee donations to nonprofits? What are the eligibility rules?
   - Geographic focus (do they give primarily local, regional, or national?)
   - Past grantees (can you find examples of small/mid-size nonprofits they've funded?)

2. INVESTIGATE GRANT PROCESSES in detail:
   - Does the company have a formal grant application process?
   - Are there grant guidelines, eligibility requirements, or RFP processes?
   - What are the application deadlines and funding cycles?
   - Are there required documents (LOI, 501(c)(3) proof, budget templates)?
   - What is the typical timeline from application to decision?
   - Are there any restrictions on grant size, nonprofit type, or geography?
   - Can you find the direct application portal/link or contact person?
   - Is the process accessible to a small nonprofit, or designed only for large orgs?

3. ASSESS LOCAL / GEOGRAPHIC FIT:
   - Does the company have offices, operations, or significant employee base in the Bay Area?
   - Does their giving specifically support Bay Area / Northern California nonprofits?
   - Are their grants restricted to certain geographies, or do they fund nationally?

4. SCORE the prospect from 1-10 based on REALISTIC criteria:
   - **Alignment with youth/education/underserved community focus** (weight: 40%)
   - **Local Bay Area presence or giving history** (weight: 30%)
   - **Evidence of funding small/mid-size nonprofits** (weight: 20%)
   - **Accessibility of grant process** (weight: 10%)
   
   **Scoring bands (for reference):**
   - 9-10: Local company, strong youth/education focus, clear track record of small nonprofit grants, easy application. (e.g., SF-based fintech with education initiative)
   - 7-8: Regional or national company with Bay Area ops, education focus, some evidence of mid-size grants. (e.g., PG&E, Wells Fargo, local bank)
   - 5-6: Large national company, some education giving, but likely too big/corporate for typical small org outreach. High barrier to entry. (e.g., Google, Microsoft, Apple)
   - 3-4: National company, weak local presence, not a primary giving focus. (e.g., Coca-Cola, General Motors)
   - 1-2: No evident nonprofit giving, for-profit or adversarial to education/youth mission. (e.g., payday lenders, tobacco companies)

5. DRAFT a warm, personalized outreach email that:
   - Has a compelling subject line
   - Opens by referencing the board member's personal connection (if provided)
   - Briefly introduces The3Keys mission in 2 sentences max
   - Makes a soft, specific ask appropriate to the company's giving capacity
   - Closes warmly with a clear next step
   - Is 150-200 words max — concise and human
   - If the company has an employee match program, mention it as a bonus avenue for their employees to support

Respond ONLY with a valid JSON object in this exact format:
{
  "companyName": "string",
  "score": number (1-10, realistic based on local fit and giving history),
  "scoreReason": "one sentence explaining the score, especially noting local fit or barriers",
  "summary": "2-3 sentence research summary of their giving history, programs, and relevance to The3Keys",
  "givingFocus": ["area1", "area2"],
  "typicalGrantSize": "string or 'Unknown'",
  "hasGrantProcess": boolean (true if formal process found),
  "grantProcessSummary": "1-2 sentence overview of the grant process or 'No formal process found'",
  "grantApplicationSteps": [
    {
      "stepNumber": 1,
      "stepName": "string (e.g., 'Letter of Intent')",
      "description": "What you do in this step",
      "requirements": ["doc1", "doc2"],
      "timeline": "timeframe if known",
      "notes": "any important details"
    }
  ],
  "eligibilityRequirements": ["requirement1", "requirement2"],
  "applicationDeadlines": "e.g., 'Rolling basis' or 'Quarterly: Jan 15, Apr 15, Jul 15, Oct 15'",
  "fundingDecisionTimeline": "e.g., '6-8 weeks'",
  "applicationLink": "URL if found, or 'Contact CSR department'",
  "applicationContact": "Name/Title/Email if found or 'Check website or contact CSR'",
  "restrictionsOrNotes": "Any notable restrictions on grant use, nonprofit type, geography, etc.",
  "keyContact": "Name/Title if found or 'Research needed'",
  "employeeMatchProgram": {
    "hasProgram": "yes" | "no" | "unknown",
    "programName": "string or 'Unknown'",
    "matchPercentage": "e.g., '100% match up to $5,000/year' or 'Unknown'",
    "eligibility": "nonprofit types and restrictions, or 'Check company policy'",
    "howToAccess": "brief explanation of how employees can participate"
  },
  "emailSubject": "string",
  "emailBody": "string (use \\n for line breaks)"
}`;

async function researchCompany(companyName, contactName, contactTitle, boardMemberName) {
  const userMessage = `Research this prospective donor for The3Keys nonprofit:

Company: ${companyName}
${contactName ? `Board Member's Contact: ${contactName}${contactTitle ? `, ${contactTitle}` : ""}` : ""}
${boardMemberName ? `Board Member Name: ${boardMemberName}` : ""}

Please research their charitable giving history, grant application processes, and draft an outreach email. If they have a formal grant process, provide a step-by-step walkthrough.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();
  const fullText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const clean = fullText.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // LinkedIn CSVs have a notes block before the real headers — find the actual header row
  let headerLineIdx = lines.findIndex((line) =>
    line.toLowerCase().includes("first name") || line.toLowerCase().includes("firstname")
  );
  if (headerLineIdx === -1) return [];

  const headers = lines[headerLineIdx].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
  const firstNameIdx = headers.findIndex((h) => h.includes("first"));
  const lastNameIdx = headers.findIndex((h) => h.includes("last"));
  const companyIdx = headers.findIndex((h) => h.includes("company") || h.includes("employer"));
  const positionIdx = headers.findIndex((h) => h.includes("position") || h.includes("title"));

  const contacts = [];
  const seenCompanies = new Set();

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // Handle quoted fields with commas inside them
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQuotes = !inQuotes; }
      else if (line[c] === "," && !inQuotes) { cols.push(current); current = ""; }
      else { current += line[c]; }
    }
    cols.push(current);

    const clean = (idx) => (cols[idx] || "").replace(/"/g, "").trim();
    const company = clean(companyIdx);
    if (!company || seenCompanies.has(company.toLowerCase())) continue;
    seenCompanies.add(company.toLowerCase());
    contacts.push({
      company,
      contactName: `${clean(firstNameIdx)} ${clean(lastNameIdx)}`.trim(),
      contactTitle: clean(positionIdx),
    });
  }
  return contacts;
}

const scoreColor = (score) => {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
};

const scoreLabel = (score) => {
  if (score >= 8) return "Strong Prospect";
  if (score >= 5) return "Moderate Prospect";
  return "Low Priority";
};

export default function App() {
  const [mode, setMode] = useState("home"); // home | csv | single | results | detail
  const [boardMemberName, setBoardMemberName] = useState("");
  const [singleCompany, setSingleCompany] = useState("");
  const [singleContact, setSingleContact] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [csvContacts, setCsvContacts] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, company: "" });
  const [selectedResult, setSelectedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const contacts = parseCSV(ev.target.result);
      setCsvContacts(contacts);
      setMode("csv");
    };
    reader.readAsText(file);
  };

  const runResearch = useCallback(async (contacts) => {
    setMode("results");
    setProcessing(true);
    setResults([]);
    const found = [];
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      setProgress({ current: i + 1, total: contacts.length, company: c.company });
      try {
        const result = await researchCompany(c.company, c.contactName, c.contactTitle, boardMemberName);
        result._contact = c;
        found.push(result);
        setResults([...found].sort((a, b) => b.score - a.score));
      } catch (err) {
        console.error("Error researching", c.company, err);
      }
    }
    setProcessing(false);
  }, [boardMemberName]);

  const copyEmail = (result) => {
    const full = `Subject: ${result.emailSubject}\n\n${result.emailBody}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1e",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8e0d0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; }
        .btn-primary {
          background: linear-gradient(135deg, #c9a84c, #e8c96d);
          color: #0a0f1e;
          border: none;
          padding: 14px 32px;
          border-radius: 4px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary {
          background: transparent;
          color: #c9a84c;
          border: 1px solid #c9a84c44;
          padding: 12px 28px;
          border-radius: 4px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 14px;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: #c9a84c; background: #c9a84c11; }
        .input-field {
          background: #111827;
          border: 1px solid #ffffff15;
          border-radius: 4px;
          color: #e8e0d0;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 15px;
          padding: 12px 16px;
          width: 100%;
          transition: border 0.2s;
          outline: none;
        }
        .input-field:focus { border-color: #c9a84c55; }
        .input-field::placeholder { color: #ffffff33; }
        .card {
          background: #111827;
          border: 1px solid #ffffff0d;
          border-radius: 8px;
          padding: 24px;
          transition: all 0.2s;
        }
        .card:hover { border-color: #c9a84c22; }
        .label { font-family: 'Source Sans 3', sans-serif; font-size: 12px; letter-spacing: 0.1em; color: #c9a84c; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .prose { font-family: 'Source Sans 3', sans-serif; font-size: 15px; line-height: 1.7; color: #b0a898; }
        .tag { display: inline-block; background: #c9a84c15; color: #c9a84c; border: 1px solid #c9a84c30; border-radius: 3px; padding: 3px 10px; font-family: 'Source Sans 3', sans-serif; font-size: 12px; letter-spacing: 0.05em; margin: 3px 3px 3px 0; }
        .score-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 3px; font-family: 'Source Sans 3', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.05em;
        }
        .result-row { cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; }
        .result-row:hover { border-left-color: #c9a84c; background: #c9a84c08; }
        .divider { border: none; border-top: 1px solid #ffffff0d; margin: 24px 0; }
        .email-box { background: #0d1320; border: 1px solid #ffffff0d; border-radius: 6px; padding: 20px; font-family: 'Source Sans 3', sans-serif; font-size: 14px; line-height: 1.8; color: #c8c0b0; white-space: pre-wrap; }
        .back-btn { background: none; border: none; color: #c9a84c; font-family: 'Source Sans 3', sans-serif; font-size: 13px; cursor: pointer; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; padding: 0; }
        .back-btn:hover { opacity: 0.7; }
        .progress-bar { height: 3px; background: #ffffff0d; border-radius: 2px; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #c9a84c, #e8c96d); border-radius: 2px; transition: width 0.4s; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #ffffff0d", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #c9a84c, #e8c96d)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, color: "#0a0f1e" }}>🗝</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#e8e0d0", letterSpacing: "0.02em" }}>The3Keys</div>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#c9a84c", letterSpacing: "0.12em", textTransform: "uppercase" }}>Donor Prospecting</div>
          </div>
        </div>
        {mode !== "home" && (
          <button className="back-btn" onClick={() => { setMode("home"); setResults([]); setSelectedResult(null); }}>
            ← Start Over
          </button>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

        {/* HOME */}
        {mode === "home" && (
          <div className="fade-in">
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#e8e0d0", lineHeight: 1.2, marginBottom: 16 }}>
                Find Your Next<br />
                <span style={{ color: "#c9a84c" }}>Major Donor</span>
              </h1>
              <p className="prose" style={{ maxWidth: 480, margin: "0 auto", fontSize: 16 }}>
                Upload your LinkedIn connections or search a company by name. Our AI researches their giving history and drafts a personalized outreach email — ready in seconds.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <span className="label">Your Name (Board Member)</span>
              <input
                className="input-field"
                placeholder="e.g. Margaret Johnson"
                value={boardMemberName}
                onChange={(e) => setBoardMemberName(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 10, color: "#e8e0d0" }}>Upload LinkedIn CSV</h3>
                <p className="prose" style={{ fontSize: 13, marginBottom: 20 }}>Export your connections from LinkedIn and research your entire network at once.</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVUpload} />
                <button className="btn-primary" onClick={() => fileRef.current.click()}>Upload CSV File</button>
                <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#ffffff33", marginTop: 12 }}>LinkedIn → Settings → Data Privacy → Get a copy of your data</p>
              </div>

              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 10, color: "#e8e0d0" }}>Search One Company</h3>
                <p className="prose" style={{ fontSize: 13, marginBottom: 20 }}>Have a specific company in mind? Research them directly and get an email draft instantly.</p>
                <button className="btn-primary" onClick={() => setMode("single")}>Single Lookup</button>
              </div>
            </div>
          </div>
        )}

        {/* CSV PREVIEW */}
        {mode === "csv" && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>
              {csvContacts.length} Companies Found
            </h2>
            <p className="prose" style={{ marginBottom: 32 }}>Review the companies pulled from your LinkedIn connections. Click Research All to begin AI analysis.</p>

            <div style={{ background: "#111827", border: "1px solid #ffffff0d", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "10px 20px", borderBottom: "1px solid #ffffff0d" }}>
                {["Company", "Your Contact", "Their Title"].map(h => (
                  <span key={h} style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, letterSpacing: "0.1em", color: "#c9a84c", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {csvContacts.slice(0, 50).map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid #ffffff05" }}>
                    <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 14, color: "#e8e0d0" }}>{c.company}</span>
                    <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 14, color: "#b0a898" }}>{c.contactName || "—"}</span>
                    <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#ffffff44" }}>{c.contactTitle || "—"}</span>
                  </div>
                ))}
                {csvContacts.length > 50 && (
                  <div style={{ padding: "12px 20px", fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#ffffff33" }}>
                    + {csvContacts.length - 50} more companies
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn-primary" onClick={() => runResearch(csvContacts.slice(0, 10))}>
                Research Top 10 Companies
              </button>
              <button className="btn-secondary" onClick={() => runResearch(csvContacts)}>
                Research All {csvContacts.length}
              </button>
              <span className="prose" style={{ fontSize: 13 }}>Each lookup takes ~15–30 seconds</span>
            </div>
          </div>
        )}

        {/* SINGLE LOOKUP */}
        {mode === "single" && (
          <div className="fade-in" style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>Single Company Lookup</h2>
            <p className="prose" style={{ marginBottom: 32 }}>Enter the company details and we'll research their giving history and draft an outreach email.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <span className="label">Company Name *</span>
                <input className="input-field" placeholder="e.g. Salesforce, Bank of America" value={singleCompany} onChange={(e) => setSingleCompany(e.target.value)} />
              </div>
              <div>
                <span className="label">Your Contact at This Company</span>
                <input className="input-field" placeholder="e.g. David Chen" value={singleContact} onChange={(e) => setSingleContact(e.target.value)} />
              </div>
              <div>
                <span className="label">Their Title</span>
                <input className="input-field" placeholder="e.g. VP of Marketing" value={singleTitle} onChange={(e) => setSingleTitle(e.target.value)} />
              </div>
              <button
                className="btn-primary"
                disabled={!singleCompany}
                style={{ opacity: singleCompany ? 1 : 0.5 }}
                onClick={() => runResearch([{ company: singleCompany, contactName: singleContact, contactTitle: singleTitle }])}
              >
                Research & Draft Email →
              </button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {mode === "results" && !selectedResult && (
          <div className="fade-in">
            {processing && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#c9a84c" }} className="pulse">
                    Researching: {progress.company}
                  </span>
                  <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#ffffff44" }}>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                </div>
              </div>
            )}

            {results.length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>
                  Prospect Rankings
                </h2>
                <p className="prose" style={{ marginBottom: 24 }}>Sorted by AI-assessed donor alignment. Click any row for the full report and email draft.</p>

                <div style={{ background: "#111827", border: "1px solid #ffffff0d", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 140px 100px", padding: "10px 20px", borderBottom: "1px solid #ffffff0d" }}>
                    {["#", "Company", "Alignment", "Score"].map(h => (
                      <span key={h} style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, letterSpacing: "0.1em", color: "#c9a84c", textTransform: "uppercase" }}>{h}</span>
                    ))}
                  </div>
                  {results.map((r, i) => (
                    <div key={i} className="result-row card" style={{ display: "grid", gridTemplateColumns: "40px 1fr 140px 100px", padding: "16px 20px", borderRadius: 0, borderLeft: "3px solid transparent", borderTop: "none", borderRight: "none", borderBottom: "1px solid #ffffff05" }}
                      onClick={() => setSelectedResult(r)}>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#ffffff33" }}>{i + 1}</span>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#e8e0d0", marginBottom: 3 }}>{r.companyName}</div>
                        {r._contact?.contactName && (
                          <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#ffffff44" }}>via {r._contact.contactName}</div>
                        )}
                      </div>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#b0a898", alignSelf: "center" }}>
                        {(r.givingFocus || []).slice(0, 2).join(", ")}
                      </span>
                      <div style={{ alignSelf: "center" }}>
                        <div className="score-badge" style={{ background: `${scoreColor(r.score)}15`, color: scoreColor(r.score), border: `1px solid ${scoreColor(r.score)}30` }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{r.score}</span>
                          <span style={{ fontSize: 10 }}>/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!processing && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p className="prose">No results yet. Something may have gone wrong.</p>
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {selectedResult && (
          <div className="fade-in">
            <button className="back-btn" style={{ marginBottom: 24 }} onClick={() => setSelectedResult(null)}>
              ← Back to Rankings
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 6 }}>{selectedResult.companyName}</h2>
                {selectedResult._contact?.contactName && (
                  <p className="prose" style={{ fontSize: 14 }}>Your connection: <strong style={{ color: "#e8e0d0" }}>{selectedResult._contact.contactName}</strong>{selectedResult._contact.contactTitle ? `, ${selectedResult._contact.contactTitle}` : ""}</p>
                )}
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 40, fontFamily: "'Playfair Display', serif", color: scoreColor(selectedResult.score), lineHeight: 1 }}>{selectedResult.score}</div>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 10, color: "#ffffff44", letterSpacing: "0.1em", textTransform: "uppercase" }}>/ 10</div>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: scoreColor(selectedResult.score), marginTop: 4 }}>{scoreLabel(selectedResult.score)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div className="card">
                <span className="label">Research Summary</span>
                <p className="prose" style={{ fontSize: 14 }}>{selectedResult.summary}</p>
              </div>
              <div className="card">
                <span className="label">Why This Score</span>
                <p className="prose" style={{ fontSize: 14 }}>{selectedResult.scoreReason}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div className="card">
                <span className="label">Giving Focus</span>
                <div style={{ marginTop: 4 }}>
                  {(selectedResult.givingFocus || []).map((f, i) => <span key={i} className="tag">{f}</span>)}
                </div>
              </div>
              <div className="card">
                <span className="label">Typical Grant Size</span>
                <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 15, color: "#e8e0d0", marginTop: 4 }}>{selectedResult.typicalGrantSize || "Unknown"}</p>
              </div>
              <div className="card">
                <span className="label">Employee Match</span>
                <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 15, color: selectedResult.employeeMatchProgram?.hasProgram === "yes" ? "#22c55e" : "#ffffff44", marginTop: 4 }}>
                  {selectedResult.employeeMatchProgram?.hasProgram === "yes" ? "✓ Yes" : "—"}
                </p>
              </div>
            </div>

            {/* GRANT PROCESS SECTION */}
            {selectedResult.hasGrantProcess && (
              <>
                <div className="card" style={{ marginBottom: 16, background: "#1a2a3a", border: "1px solid #c9a84c33" }}>
                  <span className="label" style={{ color: "#c9a84c" }}>✓ Grant Application Process Available</span>
                  <p className="prose" style={{ fontSize: 14, marginTop: 8 }}>{selectedResult.grantProcessSummary}</p>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <span className="label">Application Requirements</span>
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <span className="label" style={{ fontSize: 11, marginBottom: 6 }}>Eligibility</span>
                      <ul style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#b0a898", lineHeight: 1.8, paddingLeft: 16 }}>
                        {(selectedResult.eligibilityRequirements || []).map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="label" style={{ fontSize: 11, marginBottom: 6 }}>Key Dates & Timeline</span>
                      <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#b0a898", lineHeight: 1.8 }}>
                        <div><strong style={{ color: "#e8e0d0" }}>Deadlines:</strong><br />{selectedResult.applicationDeadlines}</div>
                        <div style={{ marginTop: 8 }}><strong style={{ color: "#e8e0d0" }}>Decision Timeline:</strong><br />{selectedResult.fundingDecisionTimeline}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP BY STEP WALKTHROUGH */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <span className="label">Step-by-Step Application Process</span>
                  <div style={{ marginTop: 16 }}>
                    {(selectedResult.grantApplicationSteps || []).map((step, i) => (
                      <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < (selectedResult.grantApplicationSteps || []).length - 1 ? "1px solid #ffffff0d" : "none" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ width: 24, height: 24, minWidth: 24, background: "#c9a84c", color: "#0a0f1e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600, fontSize: 12 }}>
                            {step.stepNumber}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#e8e0d0", marginBottom: 6 }}>{step.stepName}</h4>
                            <p className="prose" style={{ fontSize: 13, marginBottom: 8 }}>{step.description}</p>
                            {step.requirements && step.requirements.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#c9a84c", fontWeight: 500 }}>REQUIRED DOCUMENTS</span>
                                <div style={{ marginTop: 4 }}>
                                  {step.requirements.map((req, j) => (
                                    <span key={j} className="tag" style={{ fontSize: 11 }}>{req}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {step.timeline && (
                              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#ffffff44" }}>
                                <strong style={{ color: "#b0a898" }}>Timeline:</strong> {step.timeline}
                              </div>
                            )}
                            {step.notes && (
                              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#ffffff55", marginTop: 6, padding: "8px 12px", background: "#ffffff05", borderRadius: 4, borderLeft: "2px solid #c9a84c44" }}>
                                <strong style={{ color: "#c9a84c" }}>Note:</strong> {step.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <span className="label">How to Apply</span>
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>APPLICATION LINK / PORTAL</span>
                      <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#b0a898", marginTop: 6 }}>{selectedResult.applicationLink}</p>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>CONTACT FOR QUESTIONS</span>
                      <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#b0a898", marginTop: 6 }}>{selectedResult.applicationContact}</p>
                    </div>
                  </div>
                </div>

                {selectedResult.restrictionsOrNotes && (
                  <div className="card" style={{ marginBottom: 24, background: "#2a1f1f", border: "1px solid #c9514433" }}>
                    <span className="label" style={{ color: "#ef9a9a" }}>Important Restrictions & Notes</span>
                    <p className="prose" style={{ fontSize: 13, marginTop: 8, color: "#d0a0a0" }}>{selectedResult.restrictionsOrNotes}</p>
                  </div>
                )}
              </>
            )}

            {!selectedResult.hasGrantProcess && (
              <div className="card" style={{ marginBottom: 24, background: "#1a2a1a", border: "1px solid #6db86d33" }}>
                <span className="label" style={{ color: "#86c986" }}>No Formal Grant Process Found</span>
                <p className="prose" style={{ fontSize: 13, marginTop: 8, color: "#a8c0a8" }}>
                  This company does not appear to have a formal grant application process. Consider reaching out directly to their CSR or philanthropy department via email or phone to inquire about funding opportunities.
                </p>
              </div>
            )}

            {/* EMPLOYEE MATCH PROGRAM SECTION */}
            {selectedResult.employeeMatchProgram && (
              <div className="card" style={{ marginBottom: 24, background: "#1a2a3a", border: "1px solid #c9a84c33" }}>
                <span className="label" style={{ color: "#c9a84c" }}>
                  {selectedResult.employeeMatchProgram.hasProgram === "yes" ? "✓ Employee Match Program Available" : "ⓘ Employee Match Program Status"}
                </span>
                {selectedResult.employeeMatchProgram.hasProgram === "yes" ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#c9a84c", fontWeight: 500 }}>MATCH DETAILS</span>
                        <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: "#e8e0d0", marginTop: 6 }}>
                          {selectedResult.employeeMatchProgram.matchPercentage}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#c9a84c", fontWeight: 500 }}>HOW EMPLOYEES CAN GIVE</span>
                        <p className="prose" style={{ fontSize: 12, marginTop: 6 }}>
                          {selectedResult.employeeMatchProgram.howToAccess}
                        </p>
                      </div>
                    </div>
                    {selectedResult.employeeMatchProgram.eligibility && (
                      <div style={{ marginTop: 12, padding: "12px", background: "#ffffff05", borderRadius: 4 }}>
                        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: "#c9a84c", fontWeight: 500 }}>ELIGIBILITY</span>
                        <p className="prose" style={{ fontSize: 12, marginTop: 6 }}>
                          {selectedResult.employeeMatchProgram.eligibility}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="prose" style={{ fontSize: 12, marginTop: 8 }}>No formal employee match program found. Employees may still donate directly.</p>
                )}
              </div>
            )}

            <hr className="divider" />

            <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="label" style={{ margin: 0 }}>📧 Outreach Email Draft</span>
              <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => copyEmail(selectedResult)}>
                {copied ? "✓ Copied!" : "Copy Email"}
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <span className="label">Subject Line</span>
              <div style={{ background: "#0d1320", border: "1px solid #ffffff0d", borderRadius: 6, padding: "12px 16px", fontFamily: "'Source Sans 3', sans-serif", fontSize: 14, color: "#e8e0d0" }}>
                {selectedResult.emailSubject}
              </div>
            </div>

            <div className="email-box">
              {selectedResult.emailBody}
            </div>

            <p className="prose" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
              Review and personalize before sending. This is a starting draft — your voice matters most.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

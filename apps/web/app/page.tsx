const prohibited = [
  "No Indeed or Glassdoor scraping",
  "No headless browser automation",
  "No CAPTCHA bypass or anti-bot evasion",
  "No fake accounts, credentials, cookies, or session replay",
  "No automated applications, saves, recruiter messages, or screening answers",
  "No bulk copying of Glassdoor reviews, salaries, ratings, or interview content",
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 12 }}>Compliance-first MVP</p>
      <h1>Job-search copilot and application CRM</h1>
      <p>
        A manual-first, consent-first workspace for collecting job leads, normalizing job cards, tracking applications,
        and later drafting user-approved materials.
      </p>
      <section>
        <h2>Safe P0 scope</h2>
        <ul>
          <li>User account foundation</li>
          <li>Consent and product boundaries</li>
          <li>Deny-by-default source registry</li>
          <li>Manual job import and source attribution</li>
          <li>Application tracker CRM</li>
          <li>Audit logs, export, and deletion scaffolding</li>
        </ul>
      </section>
      <section>
        <h2>Explicitly not built</h2>
        <ul>
          {prohibited.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

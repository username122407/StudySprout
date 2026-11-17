import { useState } from "react";

const formats = {
  reviewer: "Study reviewer",
  explanation: "Explanation",
  flashcards: "Flashcards",
  quiz: "Practice quiz",
  summary: "Summary",
};

export default function StudyTools() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function generate(event) {
    event.preventDefault();
    if (pending) return;
    const { mode, source } = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, source }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data?.sections)) {
        throw new Error(data?.error || "The study API is unavailable. For local testing, use Vercel Dev.");
      }
      setResult({ mode, sections: data.sections });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto py-4" style={{ maxWidth: "48rem" }}>
      <h1>AI study tools</h1>
      <p>Turn a topic or your notes into study material.</p>
      <form onSubmit={generate}>
        <fieldset disabled={pending}>
          <label className="form-label" htmlFor="study-mode">Study format</label>
          <select id="study-mode" name="mode" className="form-select mb-3">
            {Object.entries(formats).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="form-label" htmlFor="study-source">Topic or notes</label>
          <textarea id="study-source" name="source" className="form-control mb-2" rows={7}
            maxLength={8000} required aria-describedby="study-privacy" />
          <p id="study-privacy" className="small">Your text is sent to Google Gemini. Leave out personal or confidential information.</p>
          <button className="btn btn-primary" type="submit">Generate study material</button>
        </fieldset>
      </form>
      <p role="status" className="mt-3">{pending ? "Generating…" : result ? "Study material ready." : ""}</p>
      {error && <p role="alert">{error}</p>}
      {result && (
        <section aria-label={formats[result.mode]}>
          <h2>{formats[result.mode]}</h2>
          {result.sections.map(({ heading, text }, index) =>
            result.mode === "flashcards" || result.mode === "quiz" ? (
              <details key={index} className="border rounded p-3 mb-2">
                <summary>{heading}</summary>
                <p className="mt-2 mb-0" style={{ whiteSpace: "pre-wrap" }}>{text}</p>
              </details>
            ) : (
              <article key={index} className="border rounded p-3 mb-2">
                <h3 className="h5">{heading}</h3>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{text}</p>
              </article>
            )
          )}
        </section>
      )}
    </section>
  );
}

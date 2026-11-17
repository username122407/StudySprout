import "./journey.css";

export default function HomePage({ onLoadSamples, hasTasks }) {
  return (
    <div className="study-journey">
      <section className="journey-intro">
        <h1>StudySprout</h1>
        <p>Turn your notes into reviewers, explanations, and flashcards. Plan deadlines and track your progress.</p>
        <a href="#/study" className="journey-button">
          Start studying <span aria-hidden="true">▸</span>
        </a>
      </section>
      <section className="journey-scene journey-planning">
        <h2>Find your focus</h2>
        <p>Keep assignments, exams, and readings together. Sort by deadline or priority to see what needs your attention first.</p>
        <a href="#/planner">Open your planner</a>
      </section>
      <section className="journey-scene journey-progress">
        <h2>See your progress</h2>
        <p>Review completed work, upcoming deadlines, and how you’re doing in each subject.</p>
        <a href="#/dashboard">View your dashboard</a>
        {!hasTasks && <button type="button" onClick={onLoadSamples}>Try sample tasks</button>}
      </section>
    </div>
  );
}

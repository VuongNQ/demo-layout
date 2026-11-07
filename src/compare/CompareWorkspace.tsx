import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { downloadMatrix, loadRecord, saveRecord, type ComparisonRecord, type CriterionNote } from './records';
import { scenarioById, scenarios, type DecisionStatus, type Destination, type Scenario } from './scenarios';
import styles from './CompareWorkspace.module.scss';

const statusLabels: Record<DecisionStatus, string> = {
  open: 'Open', testing: 'Testing', recommended: 'Recommended', approved: 'Approved', rejected: 'Rejected'
};

function DestinationCard({ platform, destination, currentUrl }: { platform: string; destination: Destination; currentUrl?: string }) {
  return (
    <section className={styles.destination} aria-label={`${platform} destination`}>
      <h3>{platform}</h3>
      <p><code>{destination.url}</code> <span className={styles.availability}>{destination.availability}</span></p>
      {currentUrl ? <p>Current prototype: <Link to={currentUrl}>{currentUrl}</Link></p> : <p>No screen is available yet. Do not record a result until it exists.</p>}
    </section>
  );
}

function MatrixButton({ currentScenario }: { currentScenario?: Scenario }) {
  function handleDownload() {
    const selected = currentScenario ? [currentScenario] : scenarios;
    const records = Object.fromEntries(selected.map((scenario) => [scenario.id, loadRecord(scenario)]));
    downloadMatrix(selected, records);
  }
  return <button className={styles.button} type="button" onClick={handleDownload}>Download comparison matrix CSV</button>;
}

export function CompareLayout() {
  return (
    <div className={styles.workspace}>
      <a className={styles.skip} href="#compare-main">Skip to comparison content</a>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Design playground</p>
          <Link className={styles.brand} to="/compare">Compare workspace</Link>
          <p>Fictional scenarios. Platform screens open through separate routes.</p>
        </div>
        <MatrixButton />
      </header>
      <div className={styles.columns}>
        <nav className={styles.nav} aria-label="Comparison scenarios">
          <NavLink end to="/compare">Scenario index</NavLink>
          {scenarios.map((scenario) => <NavLink key={scenario.id} to={`/compare/${scenario.id}`}>{scenario.title}</NavLink>)}
        </nav>
        <main id="compare-main" className={styles.main}><Outlet /></main>
      </div>
    </div>
  );
}

export function CompareIndex() {
  return (
    <>
      <p className={styles.eyebrow}>Scenario register</p>
      <h1>Compare Claude and ChatGPT proposals</h1>
      <p>Use the same fictional task and criterion on each platform. Record observations separately, then document a recommendation or team decision. Recommended does not mean approved.</p>
      <p>Claude's current prototype routes are linked below. Proposed platform URLs and all ChatGPT destinations are labeled until integrated.</p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Scenario</th><th scope="col">Claude</th><th scope="col">ChatGPT</th><th scope="col">Decision</th></tr></thead>
          <tbody>{scenarios.map((scenario) => {
            const record = loadRecord(scenario);
            return <tr key={scenario.id}>
              <th scope="row"><Link to={`/compare/${scenario.id}`}>{scenario.title}</Link><small>{scenario.record}</small></th>
              <td><Link to={scenario.claudeCurrentUrl}>Current prototype</Link><small>Proposed /claude route: planned</small></td>
              <td><span className={styles.availability}>Unavailable</span><small>{scenario.chatgpt.url}</small></td>
              <td>{statusLabels[record.status]}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p className={styles.hint}>The CSV has one row per criterion, fixed scenario IDs, both platform URLs, observations, evidence, status, owner and rationale. Blank observations mean untested. Notes are stored only in this browser under a Compare namespace; download the CSV for review or handoff.</p>
    </>
  );
}

function ScenarioDetail({ scenario }: { scenario: Scenario }) {
  const [record, setRecord] = useState<ComparisonRecord>(() => loadRecord(scenario));
  const [saved, setSaved] = useState(true);
  function update(next: ComparisonRecord) {
    setRecord(next);
    setSaved(saveRecord(scenario, next));
  }
  function updateNote(id: string, field: keyof CriterionNote, value: string) {
    const old = record.notes[id] ?? { claude: '', chatgpt: '', evidence: '' };
    update({ ...record, notes: { ...record.notes, [id]: { ...old, [field]: value } } });
  }
  return (
    <>
      <Link to="/compare">← All scenarios</Link>
      <p className={styles.eyebrow}>{scenario.record}</p>
      <h1>{scenario.title}</h1>
      <section className={styles.card}>
        <h2>Task and expected outcome</h2>
        <p><strong>Task:</strong> {scenario.task}</p>
        <p><strong>Expected:</strong> {scenario.expectedOutcome}</p>
        <h3>Reproduction steps</h3>
        <ol>{scenario.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
      <div className={styles.destinationGrid}>
        <DestinationCard platform="Claude" destination={scenario.claude} currentUrl={scenario.claudeCurrentUrl} />
        <DestinationCard platform="ChatGPT" destination={scenario.chatgpt} />
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}><h2>Evaluation matrix</h2><MatrixButton currentScenario={scenario} /></div>
        <p>Use the same check on each platform. Put observed behavior in its own column. Evidence can be a screenshot filename, issue ID or safe link. Leave a cell blank when untested.</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Criterion and check</th><th scope="col">Claude observation</th><th scope="col">ChatGPT observation</th><th scope="col">Evidence notes</th></tr></thead>
            <tbody>{scenario.criteria.map((criterion) => <tr key={criterion.id}>
              <th scope="row">{criterion.label}<small>{criterion.check}</small></th>
              {(['claude', 'chatgpt', 'evidence'] as const).map((field) => <td key={field}>
                <label className={styles.visuallyHidden} htmlFor={`${scenario.id}-${criterion.id}-${field}`}>{criterion.label}: {field} note</label>
                <textarea id={`${scenario.id}-${criterion.id}-${field}`} rows={3} value={record.notes[criterion.id]?.[field] ?? ''} onChange={(event) => updateNote(criterion.id, field, event.target.value)} placeholder={field === 'chatgpt' ? 'Untested — screen unavailable' : 'Observation or evidence'} />
              </td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <h2>Decision record</h2>
        <p>Recommendation is a proposal. Use Approved only after a team decision, with owner, date, rationale and supporting evidence.</p>
        <div className={styles.formGrid}>
          <label>Status<select value={record.status} onChange={(event) => update({ ...record, status: event.target.value as DecisionStatus })}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Decision owner<input value={record.owner} onChange={(event) => update({ ...record, owner: event.target.value })} placeholder="Team or reviewer" /></label>
          <label>Decision date<input type="date" value={record.decisionDate} onChange={(event) => update({ ...record, decisionDate: event.target.value })} /></label>
        </div>
        <label>Rationale<textarea rows={4} value={record.rationale} onChange={(event) => update({ ...record, rationale: event.target.value })} placeholder="Why this status? Cite observations and tradeoffs." /></label>
        <label>Open questions<textarea rows={4} value={record.openQuestions} onChange={(event) => update({ ...record, openQuestions: event.target.value })} /></label>
        <p role="status" className={styles.hint}>{saved ? 'Notes saved in this browser.' : 'Browser storage is unavailable. Download the CSV before leaving this page.'}</p>
      </section>
    </>
  );
}

export function CompareScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const scenario = scenarioById.get(scenarioId ?? '');
  if (!scenario) return <><h1>Scenario not found</h1><p><Link to="/compare">Return to scenario index</Link></p></>;
  return <ScenarioDetail key={scenario.id} scenario={scenario} />;
}

// Mount this route object as a sibling of the platform route trees. The parent
// router keeps responsibility for its basename and provider composition.
export const compareRoute: RouteObject = {
  path: 'compare', element: <CompareLayout />,
  children: [
    { index: true, element: <CompareIndex /> },
    { path: ':scenarioId', element: <CompareScenarioPage /> }
  ]
};

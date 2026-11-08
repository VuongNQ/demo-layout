import { createContext, useContext, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { downloadMatrix, loadRecord, recordsForMatrix, saveRecord, type ComparisonRecord, type CriterionNote } from './records';
import { scenarioById, scenarios, type DecisionStatus, type Destination, type Scenario } from './scenarios';
import styles from './CompareWorkspace.module.scss';
import { PlatformLinks } from '@/routes/PlatformLinks';
import { chatgptPath } from '@/chatgpt/routes/route-meta';

const statusKeys: Record<DecisionStatus, string> = {
  open: 'open', testing: 'testing', recommended: 'recommended', approved: 'approved', rejected: 'rejected'
};

type ActiveRecord = { scenarioId: string; record: ComparisonRecord };
const ActiveRecordContext = createContext<MutableRefObject<ActiveRecord | null> | null>(null);

type PilotLink = { path: string; label: string; help?: string };

function DestinationCard({ platform, destination, currentUrl, pilotLinks }: { platform: string; destination: Destination; currentUrl?: string; pilotLinks?: PilotLink[] }) {
  const { t } = useTranslation(['common', 'compare']);
  const translatedPlatform = platform === 'Claude' ? t('common:claude') : t('common:chatgpt');
  return (
    <section className={styles.destination} aria-label={t('compare:destinationLabel', { platform: translatedPlatform })}>
      <h3>{translatedPlatform}</h3>
      {pilotLinks ? (
        <>
          <p><span className={styles.availability}>{t(`common:${destination.availability}`)}</span></p>
          <ul>
            {pilotLinks.map((pilot) => <li key={pilot.label}><Link to={pilot.path}>{pilot.label}</Link>{pilot.help && <p>{pilot.help}</p>}</li>)}
          </ul>
        </>
      ) : (
        <p>{destination.availability === 'available' ? <Link to={destination.url}>{t('compare:openScreen', { platform: translatedPlatform })}</Link> : <code>{destination.url}</code>} <span className={styles.availability}>{t(`common:${destination.availability}`)}</span></p>
      )}
      {currentUrl ? <p>{t('compare:legacyUrl')}: <Link to={currentUrl}>{currentUrl}</Link></p> : destination.availability !== 'available' ? <p>{t('compare:noChatgptScreen')}</p> : null}
    </section>
  );
}

function scenarioPilotLinks(t: (key: string) => string): PilotLink[] {
  return [
    { path: chatgptPath('productLabels'), label: t('pilotLinks.productLabels') },
    { path: chatgptPath('promotionTypes'), label: t('pilotLinks.promotionTypes') },
    { path: chatgptPath('promotions'), label: t('pilotLinks.promotionOffer') },
    { path: chatgptPath('promotions'), label: t('pilotLinks.promotionHistory'), help: t('pilotLinks.promotionHistoryHelp') }
  ];
}

function MatrixButton({ currentScenario }: { currentScenario?: Scenario }) {
  const { t } = useTranslation('compare');
  const activeRecord = useContext(ActiveRecordContext);
  function handleDownload() {
    const selected = currentScenario ? [currentScenario] : scenarios;
    // The visible worksheet is authoritative even when storage writes or
    // reads fail, or when a stored record has become stale.
    const visible = activeRecord?.current;
    const records = recordsForMatrix(selected, visible);
    downloadMatrix(selected, records);
  }
  return <button className={styles.button} type="button" onClick={handleDownload}>{t('downloadCsv')}</button>;
}

export function CompareLayout() {
  const { t } = useTranslation(['common', 'navigation', 'chatgpt', 'compare']);
  const activeRecord = useRef<ActiveRecord | null>(null);
  return (
    <ActiveRecordContext.Provider value={activeRecord}>
    <div className={styles.workspace}>
      <a className={styles.skip} href="#compare-main">{t('compare:skip')}</a>
      <header className={styles.header}>
        <PlatformLinks />
        <div>
          <p className={styles.eyebrow}>{t('designPlayground', { ns: 'chatgpt' })}</p>
          <Link className={styles.brand} to="/compare">{t('workspace', { ns: 'compare' })}</Link>
          <p>{t('fictional', { ns: 'compare' })}</p>
        </div>
        <MatrixButton />
      </header>
      <div className={styles.columns}>
        <nav className={styles.nav} aria-label={t('scenarioRegister', { ns: 'compare' })}>
          <NavLink end to="/compare">{t('index', { ns: 'compare' })}</NavLink>
          {scenarios.map((scenario) => <NavLink key={scenario.id} to={`/compare/${scenario.id}`}>{t(`scenarioTitle.${scenario.id}`, { ns: 'compare' })}</NavLink>)}
        </nav>
        <main id="compare-main" className={styles.main}><Outlet /></main>
      </div>
    </div>
    </ActiveRecordContext.Provider>
  );
}

export function CompareIndex() {
  const { t } = useTranslation(['compare', 'common']);
  return (
    <>
      <p className={styles.eyebrow}>{t('scenarioRegister')}</p>
      <h1>{t('title')}</h1>
      <p>{t('indexIntro')} {t('localDraftNotice')}</p>
      <p>{t('availabilityIntro')}</p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th scope="col">{t('scenario')}</th><th scope="col">{t('common:claude')}</th><th scope="col">{t('common:chatgpt')}</th><th scope="col">{t('decision')}</th></tr></thead>
          <tbody>{scenarios.map((scenario) => {
            const record = loadRecord(scenario);
            return <tr key={scenario.id}>
              <th scope="row"><Link to={`/compare/${scenario.id}`}>{t(`scenarioTitle.${scenario.id}`)}</Link><small>{t(`scenarioRecord.${scenario.id}`)}</small></th>
              <td><Link to={scenario.claude.url}>{t('openScreen', { platform: t('common:claude') })}</Link><small>{t('common:available')} · {t('legacyUrl')}</small></td>
              <td>
                {scenario.chatgpt.availability === 'available' ? <><Link to={scenario.chatgpt.url}>{t('openScreen', { platform: t('common:chatgpt') })}</Link><small>{t('common:available')}</small></> : <><span className={styles.availability}>{t('common:unavailable')}</span><small>{scenario.chatgpt.url}</small></>}
              </td>
              <td>{t(statusKeys[record.status])}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p className={styles.hint}>{t('csvHint')}</p>
    </>
  );
}

function ScenarioDetail({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation('compare');
  const [record, setRecord] = useState<ComparisonRecord>(() => loadRecord(scenario));
  const [saved, setSaved] = useState(true);
  const activeRecord = useContext(ActiveRecordContext);
  useLayoutEffect(() => {
    if (!activeRecord) return;
    activeRecord.current = { scenarioId: scenario.id, record };
    return () => {
      if (activeRecord.current?.scenarioId === scenario.id) activeRecord.current = null;
    };
  }, [activeRecord, record, scenario.id]);
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
      <Link to="/compare">{t('allScenarios')}</Link>
      <p className={styles.eyebrow}>{t(`scenarioRecord.${scenario.id}`)}</p>
      <h1>{t(`scenarioTitle.${scenario.id}`)}</h1>
      <section className={styles.card}>
        <h2>{t('task')}</h2>
        <p><strong>{t('taskLabel')}:</strong> {t(`scenarioTask.${scenario.id}`)}</p>
        <p><strong>{t('expected')}:</strong> {t(`scenarioExpected.${scenario.id}`)}</p>
        <h3>{t('steps')}</h3>
        <ol>{scenario.steps.map((step, index) => <li key={index}>{t(`scenarioStep.${scenario.id}.${index}`, { defaultValue: step })}</li>)}</ol>
      </section>
      <div className={styles.destinationGrid}>
        <DestinationCard platform="Claude" destination={scenario.claude} currentUrl={scenario.claudeCurrentUrl} />
        <DestinationCard platform="ChatGPT" destination={scenario.chatgpt} pilotLinks={scenario.id === 'drawer-vs-full-page' ? scenarioPilotLinks(t) : undefined} />
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}><h2>{t('evaluation')}</h2><MatrixButton currentScenario={scenario} /></div>
        <p>{t('sameCheck')}</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th scope="col">{t('criterionCheck')}</th><th scope="col">{t('claudeObservation')}</th><th scope="col">{t('chatgptObservation')}</th><th scope="col">{t('evidenceNotes')}</th></tr></thead>
            <tbody>{scenario.criteria.map((criterion) => <tr key={criterion.id}>
              <th scope="row">{t(`criterionLabels.${criterion.id}`, { defaultValue: criterion.label })}<small>{t(`criterionChecks.${criterion.id}`, { defaultValue: criterion.check })}</small></th>
              {(['claude', 'chatgpt', 'evidence'] as const).map((field) => <td key={field}>
                <label className={styles.visuallyHidden} htmlFor={`${scenario.id}-${criterion.id}-${field}`}>{t(`criterionLabels.${criterion.id}`, { defaultValue: criterion.label })}: {t(`${field}Observation`, { defaultValue: field })}</label>
                <textarea id={`${scenario.id}-${criterion.id}-${field}`} rows={3} value={record.notes[criterion.id]?.[field] ?? ''} onChange={(event) => updateNote(criterion.id, field, event.target.value)} placeholder={field === 'chatgpt' ? t('chatgptUntested') : t('noteHelp')} />
              </td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <h2>{t('decisionRecord')}</h2>
        <p>{t('localDraftNotice')}</p>
        <div className={styles.formGrid}>
          <label>{t('status')}<select value={record.status} onChange={(event) => update({ ...record, status: event.target.value as DecisionStatus })}>
            {(['open', 'testing', 'recommended', 'approved', 'rejected'] as DecisionStatus[]).map((value) => <option key={value} value={value}>{t(statusKeys[value])}</option>)}
          </select></label>
          <label>{t('decisionOwner')}<input value={record.owner} onChange={(event) => update({ ...record, owner: event.target.value })} placeholder={t('ownerPlaceholder')} /></label>
          <label>{t('decisionDate')}<input type="date" value={record.decisionDate} onChange={(event) => update({ ...record, decisionDate: event.target.value })} /></label>
        </div>
        <label>{t('rationale')}<textarea rows={4} value={record.rationale} onChange={(event) => update({ ...record, rationale: event.target.value })} placeholder={t('rationalePlaceholder')} /></label>
        <label>{t('openQuestions')}<textarea rows={4} value={record.openQuestions} onChange={(event) => update({ ...record, openQuestions: event.target.value })} /></label>
        <p role="status" className={styles.hint}>{saved ? t('saved') : t('storageUnavailable')}</p>
      </section>
    </>
  );
}

export function CompareScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const scenario = scenarioById.get(scenarioId ?? '');
  if (!scenario) return <UnknownScenario />;
  return <ScenarioDetail key={scenario.id} scenario={scenario} />;
}

function UnknownScenario() {
  const { t } = useTranslation('compare');
  return <><h1>{t('unknown')}</h1><p><Link to="/compare">{t('returnIndex')}</Link></p></>;
}

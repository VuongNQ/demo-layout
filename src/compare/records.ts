import type { DecisionStatus, Scenario } from './scenarios';

export type CriterionNote = { claude: string; chatgpt: string; evidence: string };
export type ComparisonRecord = {
  status: DecisionStatus;
  owner: string;
  decisionDate: string;
  rationale: string;
  openQuestions: string;
  notes: Record<string, CriterionNote>;
};

const storagePrefix = 'compare-workspace:v1:';

export function emptyRecord(scenario: Scenario): ComparisonRecord {
  return {
    status: 'open', owner: '', decisionDate: '', rationale: '',
    openQuestions: scenario.openQuestions.join('\n'),
    notes: Object.fromEntries(scenario.criteria.map(({ id }) => [id, { claude: '', chatgpt: '', evidence: '' }]))
  };
}

export function loadRecord(scenario: Scenario): ComparisonRecord {
  const blank = emptyRecord(scenario);
  try {
    const raw = localStorage.getItem(storagePrefix + scenario.id);
    if (!raw) return blank;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return blank;
    const value = saved as Partial<ComparisonRecord>;
    const statuses: DecisionStatus[] = ['open', 'testing', 'recommended', 'approved', 'rejected'];
    const notes = Object.fromEntries(scenario.criteria.map(({ id }) => {
      const note = value.notes?.[id];
      return [id, {
        claude: typeof note?.claude === 'string' ? note.claude : '',
        chatgpt: typeof note?.chatgpt === 'string' ? note.chatgpt : '',
        evidence: typeof note?.evidence === 'string' ? note.evidence : ''
      }];
    }));
    return {
      status: statuses.includes(value.status as DecisionStatus) ? value.status as DecisionStatus : 'open',
      owner: typeof value.owner === 'string' ? value.owner : '',
      decisionDate: typeof value.decisionDate === 'string' ? value.decisionDate : '',
      rationale: typeof value.rationale === 'string' ? value.rationale : '',
      openQuestions: typeof value.openQuestions === 'string' ? value.openQuestions : blank.openQuestions,
      notes
    };
  } catch {
    return blank;
  }
}

export function saveRecord(scenario: Scenario, record: ComparisonRecord): boolean {
  try {
    localStorage.setItem(storagePrefix + scenario.id, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function matrixCsv(scenarios: Scenario[], records: Record<string, ComparisonRecord>): string {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [['scenario_id', 'scenario', 'fictional_record', 'task', 'expected_outcome', 'reproduction_steps', 'criterion_id', 'criterion', 'check', 'claude_url', 'claude_current_url', 'claude_availability', 'chatgpt_url', 'chatgpt_availability', 'claude_observation', 'chatgpt_observation', 'evidence', 'decision_status', 'decision_owner', 'decision_date', 'rationale', 'open_questions']];
  for (const scenario of scenarios) {
    const record = records[scenario.id] ?? emptyRecord(scenario);
    for (const criterion of scenario.criteria) {
      const note = record.notes[criterion.id] ?? { claude: '', chatgpt: '', evidence: '' };
      rows.push([scenario.id, scenario.title, scenario.record, scenario.task, scenario.expectedOutcome,
        scenario.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'), criterion.id, criterion.label, criterion.check,
        scenario.claude.url, scenario.claudeCurrentUrl, scenario.claude.availability, scenario.chatgpt.url, scenario.chatgpt.availability,
        note.claude, note.chatgpt, note.evidence, record.status, record.owner, record.decisionDate,
        record.rationale, record.openQuestions]);
    }
  }
  return '\uFEFF' + rows.map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n';
}

export function downloadMatrix(scenarios: Scenario[], records: Record<string, ComparisonRecord>) {
  const blob = new Blob([matrixCsv(scenarios, records)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'compare-matrix.csv';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

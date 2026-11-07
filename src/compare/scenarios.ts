export type DecisionStatus = 'open' | 'testing' | 'recommended' | 'approved' | 'rejected';
export type Destination = { url: string; availability: 'available' | 'planned' | 'unavailable' };
export type Criterion = { id: string; label: string; check: string };
export type Scenario = {
  id: string;
  title: string;
  record: string;
  task: string;
  expectedOutcome: string;
  steps: string[];
  claude: Destination;
  claudeCurrentUrl: string;
  chatgpt: Destination;
  criteria: Criterion[];
  openQuestions: string[];
};

const common: Criterion[] = [
  { id: 'completion', label: 'Task completion', check: 'Can the operator finish the task and identify the saved result?' },
  { id: 'context', label: 'Navigation context', check: 'Can the operator return to the right list and retain useful context?' },
  { id: 'keyboard', label: 'Keyboard path', check: 'Can the task be completed and errors recovered using a keyboard?' },
  { id: 'narrow', label: 'Narrow width', check: 'Are fields, actions and feedback reachable at a narrow viewport?' },
  { id: 'confidence', label: 'Operator confidence', check: 'Is the next action and outcome clear without guessing?' }
];

export const scenarios: Scenario[] = [
  {
    id: 'drawer-vs-full-page', title: 'Drawer vs full-page edit', record: 'Fictional offer offer-1',
    task: 'Edit the fictional offer description, then return to the list.',
    expectedOutcome: 'The change is saved once, the operator can find validation feedback, and the return destination is clear.',
    steps: ['Open offer-1 from the list as a drawer.', 'Edit its description and inspect Save and Cancel.', 'Repeat through the full-page edit link with the same fictional record.', 'Reload each deep link and check the return path.'],
    claude: { url: '/claude/offer-types/offer-1', availability: 'available' },
    claudeCurrentUrl: '/offer-types/offer-1',
    chatgpt: { url: '/chatgpt/offer-types/offer-1', availability: 'unavailable' },
    criteria: [...common, { id: 'validation', label: 'Validation recovery', check: 'Can the operator locate and fix a failing field in each substrate?' }, { id: 'deep-link', label: 'Deep link', check: 'Does direct loading provide a usable close or back destination?' }],
    openQuestions: ['Which task complexity requires a full page?', 'Should one record expose both edit substrates?']
  },
  {
    id: 'unsaved-changes', title: 'Unsaved changes', record: 'Fictional drawer draft',
    task: 'Change a field, then try Cancel, close, mask, Escape, Back, platform navigation and refresh.',
    expectedOutcome: 'Every exit path communicates the unsaved state and permits a deliberate stay or discard choice.',
    steps: ['Open the local drawer and type a draft.', 'Try each close path and note the event log.', 'Repeat in the route-bound drawer.', 'Repeat the same exit paths in ChatGPT when available.'],
    claude: { url: '/claude/experiments/unsaved-changes', availability: 'available' },
    claudeCurrentUrl: '/experiments/unsaved-changes',
    chatgpt: { url: '/chatgpt/experiments/unsaved-changes', availability: 'unavailable' },
    criteria: [...common, { id: 'exit-paths', label: 'Exit path coverage', check: 'Do Cancel, X, mask, Escape, Back, link and refresh behave consistently?' }, { id: 'focus', label: 'Focus return', check: 'Does focus return to a useful control after a closed drawer?' }],
    openQuestions: ['Which exits require a prompt?', 'Is draft recovery or autosave desired?']
  },
  {
    id: 'reorder-pagination', title: 'Reorder with pagination', record: 'Fictional 120-offer list',
    task: 'Move an offer across a page boundary and verify the resulting order.',
    expectedOutcome: 'The operator can express the target position, save it explicitly, and verify the final order.',
    steps: ['Try page-local drag on page 1 and inspect page 2.', 'Try all-item sort mode and its Save action.', 'Try direct position entry.', 'Repeat comparable actions in ChatGPT when available.'],
    claude: { url: '/claude/experiments/reorder-pagination', availability: 'available' },
    claudeCurrentUrl: '/experiments/reorder-pagination',
    chatgpt: { url: '/chatgpt/experiments/reorder-pagination', availability: 'unavailable' },
    criteria: [...common, { id: 'cross-page', label: 'Cross-page accuracy', check: 'Can an item move beyond the current page and land at the intended rank?' }, { id: 'save-feedback', label: 'Save and conflict feedback', check: 'Is the pending and committed order visible, including a stale-order failure?' }],
    openQuestions: ['Should reorder semantics be universal or list-specific?', 'What is the keyboard alternative?']
  },
  {
    id: 'tabs-vs-anchor', title: 'Tabs vs anchor validation', record: 'Fictional offer with reminderDaysBefore = 45',
    task: 'Submit a form whose last group contains a 45-day reminder against a 30-day limit.',
    expectedOutcome: 'The operator sees the error location, reaches the field, fixes it and can submit.',
    steps: ['Leave the prefilled invalid value untouched.', 'Save in the Tabs variant and locate the error.', 'Reset, then save in the section and anchor variant.', 'Repeat with ChatGPT when available.'],
    claude: { url: '/claude/experiments/tabs-vs-anchor', availability: 'available' },
    claudeCurrentUrl: '/experiments/tabs-vs-anchor',
    chatgpt: { url: '/chatgpt/experiments/tabs-vs-anchor', availability: 'unavailable' },
    criteria: [...common, { id: 'error-discovery', label: 'Error discovery', check: 'Is the final-group error named and visible after Save?' }, { id: 'error-focus', label: 'Error focus', check: 'Can summary or navigation move focus to the invalid field?' }],
    openQuestions: ['Should tabs be limited to non-form content?', 'What summary and focus behavior is required?']
  },
  {
    id: 'contextual-save', title: 'Contextual save placement', record: 'Fictional product settings product-setting-1',
    task: 'Edit a setting in a long form, move between sections, then save or discard.',
    expectedOutcome: 'Save state and actions stay discoverable without hiding fields or creating accidental submissions.',
    steps: ['Open the fictional product settings record.', 'Change a field near the top and another near the bottom.', 'Inspect the top contextual bar and discard behavior.', 'Compare with ChatGPT save placement when available.'],
    claude: { url: '/claude/product-settings/product-setting-1', availability: 'available' },
    claudeCurrentUrl: '/product-settings/product-setting-1',
    chatgpt: { url: '/chatgpt/product-settings/product-setting-1', availability: 'unavailable' },
    criteria: [...common, { id: 'action-reach', label: 'Action reachability', check: 'Are Save and Discard reachable throughout a long form?' }, { id: 'dirty-state', label: 'Dirty and save state', check: 'Are changed, saving, saved and failed states clear?' }],
    openQuestions: ['Top bar, footer or section action?', 'Should save confirmation vary by action risk?']
  }
];

export const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

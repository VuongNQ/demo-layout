// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Required Information submodule (docs/modules/
// products/required-information.md: code/name/inputType/supplyMethod,
// CSV export/create/edit/view/history), kept under a fictional route/
// service path per the naming-policy decision.

export type RequiredInfoInputType =
  | 'TEXT'
  | 'NUMBER'
  | 'EMAIL'
  | 'ADDRESS'
  | 'DATE_TIME'
  | 'PHONE_NUMBER'
  | 'FAMILY_RELATIVE'
  | 'DROP_DOWN'
  | 'RADIO_GROUP';

export type RequiredInfoSupplyMethod = 'TYPING' | 'SELECTION' | 'RADIO_GROUP' | 'COMPOSED';

export type RequiredInfoHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
};

export type RequiredInformation = {
  id: string;
  code: string;
  name: string;
  inputType: RequiredInfoInputType;
  supplyMethod: RequiredInfoSupplyMethod;
  status: 'active' | 'inactive';
  history: RequiredInfoHistoryEntry[];
};

const NAMES = ['Họ và tên', 'Số điện thoại', 'Địa chỉ thường trú', 'Email liên hệ', 'Quan hệ người thân', 'Ngày sinh'];
const INPUT_TYPES: RequiredInfoInputType[] = [
  'TEXT',
  'NUMBER',
  'EMAIL',
  'ADDRESS',
  'DATE_TIME',
  'PHONE_NUMBER',
  'FAMILY_RELATIVE',
  'DROP_DOWN',
  'RADIO_GROUP'
];
const SUPPLY_METHODS: RequiredInfoSupplyMethod[] = ['TYPING', 'SELECTION', 'RADIO_GROUP', 'COMPOSED'];
const EDITORS = ['admin1', 'admin2', 'ops.user'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateRequiredInformation(count: number): RequiredInformation[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `required-info-${seed}`,
      code: `RINFO-${String(seed).padStart(3, '0')}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      inputType: pick(INPUT_TYPES, seed),
      supplyMethod: pick(SUPPLY_METHODS, seed),
      status: seed % 5 === 0 ? 'inactive' : 'active',
      history: [{ id: `${seed}-h1`, changedAt: '2026-01-01', changedBy: pick(EDITORS, seed), action: 'Tạo mới' }]
    };
  });
}

export const INITIAL_REQUIRED_INFORMATION_COUNT = 8;
export { INPUT_TYPES, SUPPLY_METHODS };

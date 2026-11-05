// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Display Information Set submodule (docs/modules/
// products/product-configuration/display-information-set.md: image, label
// set, fee set, required-info set, and two "show in" visibility flags,
// scoped to a product line), kept under a fictional route/service path per
// the naming-policy decision.

export type ProductLineCode = 'CL' | 'CD';

export type DisplayInformationSet = {
  id: string;
  code: string;
  name: string;
  productLineCode: ProductLineCode;
  previewColor: string; // stands in for the uploaded image
  labelIds: string[];
  requiredInformationSetId: string;
  feeIds: string[];
  showInApp: boolean;
  showInWeb: boolean;
  status: 'active' | 'inactive';
};

const NAMES = ['Bộ hiển thị cơ bản', 'Bộ hiển thị khuyến mãi', 'Bộ hiển thị VIP', 'Bộ hiển thị mặc định'];
const LABELS = ['Nổi bật', 'Mới', 'Ưu đãi', 'Hot'];
const REQUIRED_INFO_SETS = ['Bộ hồ sơ cá nhân', 'Bộ hồ sơ doanh nghiệp', 'Bộ hồ sơ rút gọn'];
const FEES = ['FEE-001', 'FEE-002', 'FEE-003'];
const COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(arr[(seed + i) % arr.length]);
  return [...new Set(out)];
}

export function generateDisplayInformationSets(count: number): DisplayInformationSet[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `display-set-${seed}`,
      code: `DISP-${String(seed).padStart(3, '0')}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      productLineCode: seed % 2 === 0 ? 'CD' : 'CL',
      previewColor: pick(COLORS, seed),
      labelIds: pickMany(LABELS, seed, 1 + (seed % 2)),
      requiredInformationSetId: pick(REQUIRED_INFO_SETS, seed),
      feeIds: pickMany(FEES, seed, 1 + (seed % 2)),
      showInApp: seed % 2 === 0,
      showInWeb: seed % 3 !== 0,
      status: seed % 5 === 0 ? 'inactive' : 'active'
    };
  });
}

export const INITIAL_DISPLAY_INFORMATION_SET_COUNT = 6;
export { LABELS, REQUIRED_INFO_SETS, FEES };

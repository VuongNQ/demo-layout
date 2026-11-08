import type { CSSProperties } from 'react';
import type { ThemeConfig } from 'antd';

// Approved DS-03 roles. Interaction/focus/navigation roles remain undecided.
export const colors = {
  brandPrimary: '#DB1F26', brandSecondary: '#0E377B', brandOrange: '#EE7117',
  brandYellow: '#F7D107', brandSun: '#F4A60E',
  textPrimary: '#111827', textSecondary: '#4B5563', textMuted: '#6B7280',
  page: '#F9FAFB', base: '#FFFFFF', subtle: '#F3F4F6',
  success: '#15803D', successBg: '#F0FDF4',
  warning: '#B45309', warningBg: '#FFFBEB',
  error: '#B91C1C', errorBg: '#FEF2F2',
  info: '#1D4ED8', infoBg: '#EFF6FF',
  border: '#D1D5DB', controlBorder: '#6B7280',
  accentBg: '#E8EFFB'
} as const;

export const chatgptTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.brandPrimary,
    colorError: colors.error,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorInfo: colors.info,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorBgLayout: colors.page,
    colorBgContainer: colors.base,
    // This local prototype uses the approved control boundary for AntD's
    // generic border slot; the final component-level mapping is open.
    colorBorder: colors.controlBorder,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14
  }
};

export const chatgptCssVars = {
  '--cg-brand': colors.brandPrimary, '--cg-secondary': colors.brandSecondary,
  '--cg-text': colors.textPrimary, '--cg-text-secondary': colors.textSecondary,
  '--cg-muted': colors.textMuted, '--cg-page': colors.page, '--cg-base': colors.base,
  '--cg-subtle': colors.subtle, '--cg-border': colors.border,
  '--cg-control-border': colors.controlBorder,
  '--cg-success': colors.success, '--cg-success-bg': colors.successBg,
  '--cg-warning': colors.warning, '--cg-warning-bg': colors.warningBg,
  '--cg-error': colors.error, '--cg-error-bg': colors.errorBg,
  '--cg-info': colors.info, '--cg-info-bg': colors.infoBg,
  '--cg-accent': colors.brandSecondary, '--cg-accent-bg': colors.accentBg
} as CSSProperties;

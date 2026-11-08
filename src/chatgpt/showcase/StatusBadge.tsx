import styles from './StatusBadge.module.scss';

export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

export function StatusBadge({ label, variant, className }: { label: string; variant: StatusBadgeVariant; className?: string }) {
  return <span className={`${styles.badge} ${styles[variant]} ${className ?? ''}`.trim()}>{label}</span>;
}

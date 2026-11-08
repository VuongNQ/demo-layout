import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Descriptions, Empty, Form, Input, Modal, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { PromotionHistoryEvent } from '@/features/promotions/promotion-history.data';
import { getPromotionHistoryEvents } from '@/features/promotions/promotion-history.data';
import { appendPromotionHistoryComment, formatPromotionHistoryCopyText, isValidPromotionHistoryComment, type PromotionHistoryComment } from '@/features/promotions/promotion-history.utils';
import styles from './PromotionHistoryLogViewer.module.scss';

type Props = {
  open: boolean;
  promotionId?: string;
  promotionName?: string;
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
  onClose: () => void;
  onAfterClose: () => void;
};

type CommentFormValues = { comment: string };
type CloseConfirmation = { kind: 'close' } | { kind: 'switch'; eventId: string } | null;

function formatTimestamp(value: string, language: string): string {
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC', timeZoneName: 'short'
  }).format(new Date(value));
}

function displayValue(value: string | readonly string[] | null, notApplicable: string): string {
  if (value === null) return notApplicable;
  if (typeof value === 'string') return value;
  return value.length ? value.join(', ') : notApplicable;
}

export function PromotionHistoryLogViewer({
  open, promotionId, promotionName, selectedEventId, onSelectEvent, onClose, onAfterClose
}: Props) {
  const { t, i18n } = useTranslation('chatgpt');
  const [form] = Form.useForm<CommentFormValues>();
  const [commentsByEvent, setCommentsByEvent] = useState<Record<string, PromotionHistoryComment[]>>({});
  const [nextSequence, setNextSequence] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState<{ eventId: string; kind: 'success' | 'failure' }>();
  const [commentFeedbackEventId, setCommentFeedbackEventId] = useState<string>();
  const [confirmation, setConfirmation] = useState<CloseConfirmation>(null);
  const modalTitleRef = useRef<HTMLHeadingElement>(null);
  const eventHeadingRef = useRef<HTMLHeadingElement>(null);
  const keepDraftRef = useRef<HTMLButtonElement>(null);
  const submitLockRef = useRef(false);
  const selectedEventIdRef = useRef(selectedEventId);
  const submittingEventIdRef = useRef<string>();
  selectedEventIdRef.current = selectedEventId;
  const events = useMemo(() => promotionId ? getPromotionHistoryEvents(promotionId) : undefined, [promotionId]);
  const event = events?.find((candidate) => candidate.id === selectedEventId);
  const activeDraft = Form.useWatch('comment', form) ?? '';
  const hasMeaningfulDraft = isValidPromotionHistoryComment(activeDraft);
  const comments = event ? (commentsByEvent[event.id] ?? []) : [];
  const timestamp = (value: string) => formatTimestamp(value, i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => (eventHeadingRef.current ?? modalTitleRef.current)?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [event?.id, open]);

  useEffect(() => {
    setCommentFeedbackEventId(undefined);
  }, [event?.id]);

  useEffect(() => {
    if (!confirmation) return;
    const frame = window.requestAnimationFrame(() => keepDraftRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [confirmation]);

  function requestClose() {
    if (submitLockRef.current) return;
    if (hasMeaningfulDraft) {
      setConfirmation({ kind: 'close' });
      return;
    }
    form.resetFields();
    setConfirmation(null);
    onClose();
  }

  function requestEventChange(nextEventId: string) {
    if (submitLockRef.current) return;
    if (nextEventId === selectedEventId) return;
    if (hasMeaningfulDraft) {
      setConfirmation({ kind: 'switch', eventId: nextEventId });
      return;
    }
    form.resetFields();
    setConfirmation(null);
    onSelectEvent(nextEventId);
  }

  function stayOnCurrentView() {
    setConfirmation(null);
    window.requestAnimationFrame(() => {
      document.getElementById('promotion-history-comment')?.focus();
    });
  }

  function discardDraftAndContinue() {
    const pending = confirmation;
    form.resetFields();
    setConfirmation(null);
    if (pending?.kind === 'switch') onSelectEvent(pending.eventId);
    else if (pending?.kind === 'close') onClose();
  }

  async function copyEventDetails(selected: PromotionHistoryEvent) {
    const labels = {
      eventId: t('pages.promotion.history.eventId'),
      promotionId: t('pages.promotion.history.promotionId'),
      action: t('pages.promotion.history.action'),
      eventAction: t(`pages.promotion.history.actions.${selected.action}`),
      timestamp: t('pages.promotion.history.timestamp'),
      actor: t('pages.promotion.history.actor'),
      source: t('pages.promotion.history.source'),
      changes: t('pages.promotion.history.changes'),
      before: t('pages.promotion.history.before'),
      after: t('pages.promotion.history.after'),
      notApplicable: t('pages.promotion.history.notApplicable'),
      fields: {
        name: t('pages.promotion.name'),
        code: t('pages.promotion.code'),
        offerType: t('pages.promotion.offerType'),
        status: t('pages.promotion.status'),
        assignedProducts: t('pages.promotion.assignedProducts')
      }
    } as const;
    const content = formatPromotionHistoryCopyText(selected, labels);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      setCopyFeedback({ eventId: selected.id, kind: 'success' });
    } catch {
      setCopyFeedback({ eventId: selected.id, kind: 'failure' });
    }
  }

  function captureCommentSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLockRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    submitLockRef.current = true;
    submittingEventIdRef.current = selectedEventIdRef.current;
  }

  function releaseCommentSubmit() {
    submitLockRef.current = false;
    submittingEventIdRef.current = undefined;
  }

  function submitComment(values: CommentFormValues) {
    const submissionEventId = submittingEventIdRef.current;
    const submissionEvent = events?.find((candidate) => candidate.id === submissionEventId);
    if (!submissionEvent || submissionEventId !== selectedEventIdRef.current
      || form.getFieldValue('comment') !== values.comment || !values.comment.trim()) {
      releaseCommentSubmit();
      return;
    }
    const comment: PromotionHistoryComment = {
      id: `mock-comment-${submissionEvent.id}-${nextSequence}`,
      eventId: submissionEvent.id,
      body: values.comment,
      author: t('pages.promotion.history.commentAuthor'),
      createdAt: new Date().toISOString(),
      sequence: nextSequence
    };
    setCommentsByEvent((current) => ({
      ...current,
      [submissionEvent.id]: appendPromotionHistoryComment(current[submissionEvent.id] ?? [], comment)
    }));
    setNextSequence((sequence) => sequence + 1);
    setCommentFeedbackEventId(submissionEvent.id);
    form.resetFields();
    setConfirmation(null);
    releaseCommentSubmit();
  }

  const copyText = event ? formatPromotionHistoryCopyText(event, {
    eventId: t('pages.promotion.history.eventId'),
    promotionId: t('pages.promotion.history.promotionId'),
    action: t('pages.promotion.history.action'),
    eventAction: t(`pages.promotion.history.actions.${event.action}`),
    timestamp: t('pages.promotion.history.timestamp'),
    actor: t('pages.promotion.history.actor'),
    source: t('pages.promotion.history.source'),
    changes: t('pages.promotion.history.changes'),
    before: t('pages.promotion.history.before'),
    after: t('pages.promotion.history.after'),
    notApplicable: t('pages.promotion.history.notApplicable'),
    fields: {
      name: t('pages.promotion.name'),
      code: t('pages.promotion.code'),
      offerType: t('pages.promotion.offerType'),
      status: t('pages.promotion.status'),
      assignedProducts: t('pages.promotion.assignedProducts')
    }
  }) : '';

  return (
    <Modal
      open={open}
      width={880}
      title={(
        <Typography.Title level={2} id="promotion-history-modal-title" ref={modalTitleRef} tabIndex={-1} className={styles.title}>
          {t('pages.promotion.history.title', { name: promotionName ?? promotionId ?? '' })}
        </Typography.Title>
      )}
      aria-labelledby="promotion-history-modal-title"
      onCancel={requestClose}
      afterOpenChange={(visible) => { if (!visible) onAfterClose(); }}
      maskClosable
      keyboard
      wrapClassName={styles.modal}
      footer={<Button onClick={requestClose}>{t('pages.promotion.history.close')}</Button>}
    >
      {!promotionId || !events ? (
        <Empty description={t('pages.promotion.history.promotionNotFound')} />
      ) : events.length === 0 ? (
        <Empty description={t('pages.promotion.history.noEvents')} />
      ) : !event ? (
        <Alert type="warning" showIcon role="status" message={t('pages.promotion.history.eventNotFound')} />
      ) : (
        <div className={styles.content}>
          <Alert type="info" showIcon message={t('pages.promotion.history.demoNotice')} className={styles.demoNotice} />

          <div className={styles.viewerGrid}>
            <nav className={styles.eventList} aria-label={t('pages.promotion.history.eventList')}>
              <Typography.Title level={3} className={styles.subheading}>{t('pages.promotion.history.eventList')}</Typography.Title>
              {events.map((historyEvent) => (
                <Button
                  key={historyEvent.id}
                  type={historyEvent.id === event.id ? 'primary' : 'default'}
                  aria-pressed={historyEvent.id === event.id}
                  className={styles.eventButton}
                  onClick={() => requestEventChange(historyEvent.id)}
                >
                  <span>{t(`pages.promotion.history.actions.${historyEvent.action}`)}</span>
                  <small>{timestamp(historyEvent.occurredAt)}</small>
                </Button>
              ))}
            </nav>

            <div className={styles.detailColumn}>
              <section aria-labelledby="promotion-history-event-heading" className={styles.eventSection}>
                <Typography.Title level={3} id="promotion-history-event-heading" ref={eventHeadingRef} tabIndex={-1} className={styles.subheading}>
                  {t(`pages.promotion.history.actions.${event.action}`)}
                </Typography.Title>
                <Descriptions size="small" column={1} className={styles.metadata}>
                  <Descriptions.Item label={t('pages.promotion.history.eventId')}>{event.id}</Descriptions.Item>
                  <Descriptions.Item label={t('pages.promotion.history.promotionId')}>{event.promotionId}</Descriptions.Item>
                  <Descriptions.Item label={t('pages.promotion.history.timestamp')}>{timestamp(event.occurredAt)}</Descriptions.Item>
                  <Descriptions.Item label={t('pages.promotion.history.actor')}>{event.actor || t('pages.promotion.history.notProvided')}</Descriptions.Item>
                  <Descriptions.Item label={t('pages.promotion.history.source')}>{event.source || t('pages.promotion.history.notProvided')}</Descriptions.Item>
                </Descriptions>
                <Typography.Title level={4} className={styles.subheading}>{t('pages.promotion.history.changes')}</Typography.Title>
                <div className={styles.changes}>
                  {event.changes.map((change, index) => (
                    <div key={`${event.id}-${change.field}-${index}`} className={styles.changeRow}>
                      <Typography.Text strong className={styles.changeField}>{t(`pages.promotion.history.fields.${change.field}`)}</Typography.Text>
                      <div><Typography.Text type="secondary">{t('pages.promotion.history.before')}</Typography.Text><Typography.Paragraph className={styles.value}>{displayValue(change.before, t('pages.promotion.history.notApplicable'))}</Typography.Paragraph></div>
                      <div><Typography.Text type="secondary">{t('pages.promotion.history.after')}</Typography.Text><Typography.Paragraph className={styles.value}>{displayValue(change.after, t('pages.promotion.history.notApplicable'))}</Typography.Paragraph></div>
                    </div>
                  ))}
                </div>

                <Space wrap className={styles.copyActions}>
                  <Button onClick={() => void copyEventDetails(event)}>{t('pages.promotion.history.copyEvent')}</Button>
                  {copyFeedback?.eventId === event.id && copyFeedback.kind === 'success' && <Typography.Text role="status" aria-live="polite">{t('pages.promotion.history.copySuccess')}</Typography.Text>}
                </Space>
                {copyFeedback?.eventId === event.id && copyFeedback.kind === 'failure' && (
                  <Alert type="warning" showIcon role="alert" message={t('pages.promotion.history.copyFailure')} description={<pre className={styles.copyPreview}>{copyText}</pre>} />
                )}
              </section>

              <section aria-labelledby="promotion-history-comments-heading" className={styles.commentSection}>
                <Typography.Title level={3} id="promotion-history-comments-heading" className={styles.subheading}>
                  {t('pages.promotion.history.commentsTitle', { count: comments.length })}
                </Typography.Title>
                <Typography.Paragraph type="secondary">{t('pages.promotion.history.commentLifetime')}</Typography.Paragraph>
                {comments.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('pages.promotion.history.threadEmpty')} />
                ) : (
                  <ol className={styles.commentList} aria-live="polite">
                    {comments.map((comment) => (
                      <li key={comment.id} className={styles.comment}>
                        <Space wrap className={styles.commentMetadata}>
                          <Typography.Text strong>{comment.author}</Typography.Text>
                          <Typography.Text type="secondary">{timestamp(comment.createdAt)}</Typography.Text>
                        </Space>
                        <Typography.Paragraph className={styles.commentBody}>{comment.body}</Typography.Paragraph>
                      </li>
                    ))}
                  </ol>
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onSubmitCapture={captureCommentSubmit}
                  onFinish={submitComment}
                  onFinishFailed={releaseCommentSubmit}
                  onValuesChange={() => setCommentFeedbackEventId(undefined)}
                  className={styles.commentForm}
                >
                  <Form.Item
                    name="comment"
                    label={t('pages.promotion.history.commentLabel')}
                    rules={[{ validator: async (_, value: string | undefined) => value?.trim() ? Promise.resolve() : Promise.reject(new Error(t('pages.promotion.history.commentRequired'))) }]}
                  >
                    <Input.TextArea id="promotion-history-comment" rows={3} autoSize={{ minRows: 3, maxRows: 7 }} aria-label={t('pages.promotion.history.commentLabel')} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    {t('pages.promotion.history.commentSubmit')}
                  </Button>
                </Form>
                {commentFeedbackEventId === event.id && <Typography.Text role="status" aria-live="polite">{t('pages.promotion.history.commentSuccess')}</Typography.Text>}
              </section>
            </div>
          </div>

          {confirmation && (
            <Alert
              type="warning"
              showIcon
              role="alert"
              message={t('pages.promotion.history.draftConfirmationTitle')}
              description={t(confirmation.kind === 'close' ? 'pages.promotion.history.discardDraftOnClose' : 'pages.promotion.history.discardDraftOnSwitch')}
              action={(
                <Space wrap>
                  <Button ref={keepDraftRef} size="small" onClick={stayOnCurrentView}>{t('pages.promotion.history.keepDraft')}</Button>
                  <Button size="small" danger onClick={discardDraftAndContinue}>{t('pages.promotion.history.discardDraft')}</Button>
                </Space>
              )}
              className={styles.confirmation}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

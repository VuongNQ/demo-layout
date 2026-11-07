import { Form, Input, Select, DatePicker, Avatar, Space, Button, type FormInstance } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { BackgroundLock } from './demo-background-lock-data';

export type BackgroundLockFormValues = Omit<BackgroundLock, 'id' | 'priority'>;

type BackgroundLockFormProps = {
  form: FormInstance<BackgroundLockFormValues>;
  initialValues?: BackgroundLockFormValues;
};

// Short form (6 fields) — deliberately on the opposite end of the
// field-count spectrum from offer-type's ~30-field form, so the Drawer
// substrate can be judged against a screen it clearly fits, not only
// against the long-form case.
export function BackgroundLockForm({ form, initialValues }: BackgroundLockFormProps) {
  const { t } = useTranslation('claude');
  return (
    <Form<BackgroundLockFormValues> form={form} layout="vertical" initialValues={initialValues}>
      <Form.Item label={t('pages.background.preview')}>
        <Space>
          <Avatar
            shape="square"
            size={64}
            style={{ backgroundColor: initialValues?.imagePreviewColor ?? '#d9d9d9' }}
            icon={<PictureOutlined />}
          />
          <Button disabled>{t('pages.background.chooseImage')}</Button>
        </Space>
      </Form.Item>
      <Form.Item name="name" label={t('pages.background.name')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label={t('pages.background.status')} rules={[{ required: true, message: t('validation:required') }]}>
        <Select
          options={[
            { value: 'active', label: t('pages.background.active') },
            { value: 'draft', label: t('pages.background.draft') },
            { value: 'inactive', label: t('pages.background.inactive') }
          ]}
        />
      </Form.Item>
      <Form.Item name="customerSegments" label={t('pages.background.segments')} rules={[{ required: true, message: t('validation:required') }]}>
        <Select
          mode="multiple"
          options={['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp'].map((v) => ({ value: v, label: v }))}
        />
      </Form.Item>
      <Form.Item label={t('pages.background.validity')} required>
        <Space.Compact>
          <Form.Item
            name="effectiveFrom"
            noStyle
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker placeholder={t('pages.background.from')} />
          </Form.Item>
          <Form.Item
            name="effectiveTo"
            noStyle
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker placeholder={t('pages.background.to')} />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
    </Form>
  );
}

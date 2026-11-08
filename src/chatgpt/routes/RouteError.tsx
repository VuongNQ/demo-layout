import { Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router-dom';
import { chatgptPath } from './route-meta';

export function ChatGPTRouteError() {
  const { t } = useTranslation('chatgpt');
  const error = useRouteError();
  // Keep technical error details out of this public fictional prototype.
  void error;
  return <Alert type="error" showIcon message={t('routeLoadError')} description={<>{t('routeLoadHelp')} <Link to={chatgptPath('overview')}>{t('overview')}</Link>.</>} />;
}

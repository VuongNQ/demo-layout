import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { themeTokens } from '@/theme/tokens';
import { router } from '@/routes/router';

const queryClient = new QueryClient();

export function App() {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'en' ? enUS : viVN;

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeTokens} locale={locale}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}

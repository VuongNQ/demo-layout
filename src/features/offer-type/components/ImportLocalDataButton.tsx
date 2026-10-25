import { useRef } from 'react';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { setLocalDataOverride } from '@/local-data-loader/local-data.store';
import type { OfferType } from '@/data/demo-data';
import { offerTypeQueryKeys } from '@/queryKeys/offer-type.query-keys';

// Lets a presenter load a real-shaped JSON file from their own disk at
// demo time, without that file ever being committed or deployed. The file
// is read entirely client-side; nothing is uploaded anywhere.
export function ImportLocalDataButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as OfferType[];
      if (!Array.isArray(parsed)) throw new Error('File JSON phải là một mảng OfferType[]');
      setLocalDataOverride(parsed);
      await queryClient.invalidateQueries({ queryKey: offerTypeQueryKeys.all() });
      message.success(`Đã nạp ${parsed.length} bản ghi từ file local.`);
    } catch (error) {
      message.error(`Không đọc được file: ${(error as Error).message}`);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button icon={<UploadOutlined />} onClick={() => inputRef.current?.click()}>
        Nhập dữ liệu local
      </Button>
    </>
  );
}

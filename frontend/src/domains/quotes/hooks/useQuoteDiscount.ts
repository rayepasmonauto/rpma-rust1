import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Quote } from '@/shared/types';

export function useQuoteDiscount(quoteId: string) {
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDiscount = useCallback(async (type: string | null, value: number | null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke('quote_update', {
        sessionToken: localStorage.getItem('session_token'),
        id: quoteId,
        data: {
          discount_type: type,
          discount_value: value,
        },
      }) as { success: boolean; data?: Quote; error?: { message: string } };

      if (response.success && response.data) {
        setDiscountType(type);
        setDiscountValue(value || 0);
      } else {
        setError(response.error?.message || 'Failed to update discount');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update discount');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  return {
    discountType,
    discountValue,
    setDiscountType,
    setDiscountValue,
    updateDiscount,
    loading,
    error,
  };
}

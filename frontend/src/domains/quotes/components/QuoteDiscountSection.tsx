'use client';

import { Quote, UpdateQuoteRequest } from '@/shared/types';

export interface QuoteDiscountSectionProps {
  quote?: Quote;
  discountType?: string | null;
  discountValue?: number | null;
  currencyCode?: string;
  onUpdateDiscount: (type: string | null, value: number | null) => void;
  disabled?: boolean;
  discountAmount?: number | null;
}

export function QuoteDiscountSection({
  quote,
  discountType,
  discountValue,
  currencyCode = 'EUR',
  onUpdateDiscount,
  disabled = false,
  discountAmount,
}: QuoteDiscountSectionProps) {
  const handleDiscountTypeChange = (value: string) => {
    if (value === 'none') {
      onUpdateDiscount(null, 0);
    } else {
      onUpdateDiscount(value, discountValue || 0);
    }
  };

  const handleDiscountValueChange = (value: number) => {
    onUpdateDiscount(discountType || null, value);
  };

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ${currencyCode}`;
  };

  const subtotalBeforeDiscount = quote?.subtotal || 0;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Discount</h3>
        <span className="text-xs text-gray-500">
          {discountAmount ? `Saved: ${formatCurrency(discountAmount)}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Discount Type Selector */}
        <select
          value={discountType || 'none'}
          onChange={(e) => handleDiscountTypeChange(e.target.value)}
          disabled={disabled}
          className="h-9 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="none">None</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed Amount</option>
        </select>

        {/* Discount Value Input */}
        {discountType && discountType !== 'none' && (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : undefined}
              step={discountType === 'percentage' ? '1' : '0.01'}
              value={discountValue || 0}
              onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className="flex-1 h-9 px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={discountType === 'percentage' ? '%' : currencyCode}
            />
            <span className="text-sm text-gray-500 min-w-[3rem]">
              {discountType === 'percentage' ? '%' : currencyCode}
            </span>
          </div>
        )}
      </div>

      {/* Preview */}
      {discountAmount !== null && discountAmount !== undefined && discountAmount > 0 && (
        <div className="text-xs text-gray-600 border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span>Subtotal (before discount):</span>
            <span className="font-medium">{formatCurrency(subtotalBeforeDiscount)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

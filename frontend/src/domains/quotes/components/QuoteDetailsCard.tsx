'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuoteDetailsCardProps {
  validUntil: string;
  onValidUntilChange: (date: string) => void;
  inspectionId?: string | null;
}

export function QuoteDetailsCard({
  validUntil,
  onValidUntilChange,
  inspectionId,
}: QuoteDetailsCardProps) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <h3 className="text-sm font-semibold">Détails du devis</h3>

      <div className="space-y-1">
        <Label htmlFor="validUntil" className="text-xs">
          Valide jusqu&apos;au
        </Label>
        <Input
          id="validUntil"
          type="date"
          value={validUntil}
          onChange={(e) => onValidUntilChange(e.target.value)}
        />
      </div>

      {inspectionId && (
        <Link
          href={`/inspections/${inspectionId}`}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Voir l&apos;inspection</span>
        </Link>
      )}
    </div>
  );
}

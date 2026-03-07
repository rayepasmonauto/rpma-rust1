'use client';

import { useState } from 'react';
import { Car, Users, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerOption {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface QuoteVehicleCustomerCardProps {
  // Client — existing selection
  customerId: string;
  customers: CustomerOption[];
  onCustomerIdChange: (id: string) => void;
  // Client — inline creation fields
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientType: 'individual' | 'business';
  onClientNameChange: (v: string) => void;
  onClientEmailChange: (v: string) => void;
  onClientPhoneChange: (v: string) => void;
  onClientTypeChange: (v: 'individual' | 'business') => void;
  // Vehicle fields (sent inline on the quote)
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  vehicleVin: string;
  onVehicleMakeChange: (v: string) => void;
  onVehicleModelChange: (v: string) => void;
  onVehicleYearChange: (v: string) => void;
  onVehiclePlateChange: (v: string) => void;
  onVehicleVinChange: (v: string) => void;
}

export function QuoteVehicleCustomerCard({
  customerId,
  customers,
  onCustomerIdChange,
  clientName,
  clientEmail,
  clientPhone,
  clientType,
  onClientNameChange,
  onClientEmailChange,
  onClientPhoneChange,
  onClientTypeChange,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  vehiclePlate,
  vehicleVin,
  onVehicleMakeChange,
  onVehicleModelChange,
  onVehicleYearChange,
  onVehiclePlateChange,
  onVehicleVinChange,
}: QuoteVehicleCustomerCardProps) {
  const [clientMode, setClientMode] = useState<'create' | 'select'>('create');

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleClearClient = () => {
    onCustomerIdChange('');
  };

  return (
    <div className="space-y-4">
      {/* ── Client ─────────────────────────────────────────── */}
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Client <span className="text-destructive">*</span>
          </h3>
          {!selectedCustomer && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setClientMode('create')}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  clientMode === 'create'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nouveau
              </button>
              <button
                type="button"
                onClick={() => setClientMode('select')}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  clientMode === 'select'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="h-3 w-3 inline mr-1" />
                Existant
              </button>
            </div>
          )}
        </div>

        {/* Selected client badge */}
        {selectedCustomer ? (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{selectedCustomer.name}</span>
              {selectedCustomer.company && (
                <span className="ml-1.5 text-muted-foreground text-xs">
                  {selectedCustomer.company}
                </span>
              )}
              {selectedCustomer.email && (
                <div className="text-xs text-muted-foreground truncate">
                  {selectedCustomer.email}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleClearClient}
              title="Changer de client"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : clientMode === 'create' ? (
          /* Inline client fields — created automatically on quote submit */
          <div className="space-y-2">
            <Input
              placeholder="Nom du client *"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                type="email"
                value={clientEmail}
                onChange={(e) => onClientEmailChange(e.target.value)}
              />
              <Input
                placeholder="Téléphone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
              />
            </div>
            <Select
              value={clientType}
              onValueChange={(v) => onClientTypeChange(v as 'individual' | 'business')}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Particulier</SelectItem>
                <SelectItem value="business">Entreprise</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le client sera créé automatiquement à la soumission du devis.
            </p>
          </div>
        ) : (
          /* Select existing client */
          <Select
            value={customerId || 'none'}
            onValueChange={(v) => onCustomerIdChange(v === 'none' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Aucun —</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.company && ` (${c.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Véhicule ───────────────────────────────────────── */}
      <div className="rounded-lg border p-3 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5" />
          Véhicule{' '}
          <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Marque</Label>
            <Input
              placeholder="ex: Toyota"
              value={vehicleMake}
              onChange={(e) => onVehicleMakeChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modèle</Label>
            <Input
              placeholder="ex: Yaris"
              value={vehicleModel}
              onChange={(e) => onVehicleModelChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Année</Label>
            <Input
              placeholder="ex: 2022"
              value={vehicleYear}
              maxLength={4}
              onChange={(e) => onVehicleYearChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Immatriculation</Label>
            <Input
              placeholder="ex: AB-123-CD"
              value={vehiclePlate}
              onChange={(e) => onVehiclePlateChange(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">VIN</Label>
          <Input
            placeholder="Numéro de châssis"
            value={vehicleVin}
            onChange={(e) => onVehicleVinChange(e.target.value.toUpperCase())}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Users, X, Plus, Loader2 } from 'lucide-react';
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
import { clientIpc } from '@/domains/clients';
import { useAuth } from '@/domains/auth';
import { toast } from 'sonner';

interface CustomerOption {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string | null;
  customerId: string | null;
  customerName: string | null;
}

interface QuoteVehicleCustomerCardProps {
  customerId: string;
  vehicleId: string;
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  onCustomerIdChange: (id: string) => void;
  onVehicleIdChange: (id: string) => void;
  onCustomerCreated?: (clientId: string) => void;
  refreshCustomers?: () => void;
}

export function QuoteVehicleCustomerCard({
  customerId,
  vehicleId,
  customers,
  vehicles,
  onCustomerIdChange,
  onVehicleIdChange,
  onCustomerCreated,
  refreshCustomers,
}: QuoteVehicleCustomerCardProps) {
  const { user } = useAuth();
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'individual' as 'individual' | 'business',
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const handleVehicleChange = (v: string) => {
    const vid = v === 'none' ? '' : v;
    onVehicleIdChange(vid);
    if (vid) {
      const vehicle = vehicles.find((veh) => veh.id === vid);
      if (vehicle?.customerId) {
        onCustomerIdChange(vehicle.customerId);
      }
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }
    if (!user?.token) return;

    setCreating(true);
    try {
      const client = await clientIpc.create(
        {
          name: newClient.name,
          email: newClient.email || null,
          phone: newClient.phone || null,
          customer_type: newClient.type,
          address_street: null,
          address_city: null,
          address_state: null,
          address_zip: null,
          address_country: null,
          tax_id: null,
          company_name: null,
          contact_person: null,
          notes: null,
          tags: null,
        },
        user.token
      );
      toast.success(`Client "${client.name}" créé avec succès`);
      setShowNewClientForm(false);
      setNewClient({ name: '', email: '', phone: '', type: 'individual' });
      onCustomerIdChange(client.id);
      onCustomerCreated?.(client.id);
      refreshCustomers?.();
    } catch (error) {
      toast.error('Erreur lors de la création du client');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <h3 className="text-sm font-semibold">Véhicule & Client</h3>

      {/* Vehicle */}
      <div className="space-y-1">
        <Label className="text-xs">Véhicule</Label>
        <Select value={vehicleId || 'none'} onValueChange={handleVehicleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un véhicule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
                {v.licensePlate && ` (${v.licensePlate})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle display */}
      {selectedVehicle && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Link
            href={`/vehicles/${selectedVehicle.id}`}
            target="_blank"
            className="min-w-0 flex-1 text-sm hover:underline"
          >
            <span className="font-medium">
              {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
            </span>
            {selectedVehicle.licensePlate && (
              <span className="ml-1.5 text-muted-foreground">
                {selectedVehicle.licensePlate}
              </span>
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onVehicleIdChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Customer */}
      <div className="space-y-1">
        <Label className="text-xs">Client</Label>
        <Select
          value={customerId || 'none'}
          onValueChange={(v) => onCustomerIdChange(v === 'none' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.company && ` (${c.company})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Customer display */}
      {selectedCustomer && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Link
            href={`/clients/${selectedCustomer.id}`}
            target="_blank"
            className="min-w-0 flex-1 text-sm hover:underline"
          >
            <span className="font-medium">{selectedCustomer.name}</span>
            {selectedCustomer.company && (
              <span className="ml-1.5 text-muted-foreground">
                {selectedCustomer.company}
              </span>
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onCustomerIdChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Inline New Client Form */}
      {showNewClientForm ? (
        <div className="rounded-md border border-dashed p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Nouveau client</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setShowNewClientForm(false);
                setNewClient({ name: '', email: '', phone: '', type: 'individual' });
              }}
            >
              Annuler
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Nom du client *"
              value={newClient.name}
              onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Téléphone"
              type="tel"
              value={newClient.phone}
              onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Select
              value={newClient.type}
              onValueChange={(v) => setNewClient((prev) => ({ ...prev, type: v as 'individual' | 'business' }))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Particulier</SelectItem>
                <SelectItem value="business">Entreprise</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="w-full text-xs"
              size="sm"
              onClick={handleCreateClient}
              disabled={creating || !newClient.name.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3 w-3" />
                  Créer le client
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowNewClientForm(true)}
        >
          <Plus className="mr-2 h-3 w-3" />
          Créer un nouveau client
        </Button>
      )}
    </div>
  );
}

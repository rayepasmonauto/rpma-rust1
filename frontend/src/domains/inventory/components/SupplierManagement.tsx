'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventorySuppliers } from '../hooks/useInventoryData';

export function SupplierManagement() {
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '' });
  const { suppliers, isLoading, createSupplier } = useInventorySuppliers();

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;

    try {
      await createSupplier.mutateAsync(newSupplier);
      setNewSupplier({ name: '', email: '', phone: '' });
      toast.success('Fournisseur ajouté avec succès');
    } catch (_error) {
      toast.error('Erreur lors de l\'ajout du fournisseur');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Gestion des fournisseurs</CardTitle>
          <CardDescription className="text-muted-foreground">
            Gérez votre réseau de fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSupplier} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="col-span-1">
              <Label htmlFor="supplierName" className="text-muted-foreground">Nom *</Label>
              <Input
                id="supplierName"
                placeholder="Nom..."
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                disabled={createSupplier.isPending}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="supplierEmail" className="text-muted-foreground">Email</Label>
              <Input
                id="supplierEmail"
                type="email"
                placeholder="Email..."
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                disabled={createSupplier.isPending}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="supplierPhone" className="text-muted-foreground">Téléphone</Label>
              <Input
                id="supplierPhone"
                placeholder="Téléphone..."
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                disabled={createSupplier.isPending}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={createSupplier.isPending || !newSupplier.name.trim()}>
                {createSupplier.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </form>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement des fournisseurs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nom</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Téléphone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

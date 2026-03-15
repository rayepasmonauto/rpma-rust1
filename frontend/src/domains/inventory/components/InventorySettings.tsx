'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryCategories } from '../hooks/useInventoryData';

export function InventorySettings() {
  const [newCategoryName, setNewCategoryName] = useState('');
  const { categories, isLoading, createCategory } = useInventoryCategories();

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory.mutateAsync({ name: newCategoryName.trim() });
      setNewCategoryName('');
      toast.success('Catégorie créée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création de la catégorie');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Gestion des catégories</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ajoutez ou modifiez les catégories de matériel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="categoryName" className="sr-only text-muted-foreground">Nom de la catégorie</Label>
              <Input
                id="categoryName"
                placeholder="Nouvelle catégorie..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={createCategory.isPending}
                className="bg-background border-border text-foreground"
              />
            </div>
            <Button type="submit" disabled={createCategory.isPending || !newCategoryName.trim()}>
              {createCategory.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </form>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement des catégories...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nom</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled className="text-muted-foreground opacity-50">Modifier</Button>
                    </TableCell>
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

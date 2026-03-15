'use client';

import { BarChart3, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryReports } from '../hooks/useInventoryData';

export function InventoryReports() {
  const { data, isLoading } = useInventoryReports();

  if (isLoading) {
    return <div className="p-8 text-center">Chargement des rapports...</div>;
  }

  const lowStockMaterials = data?.lowStockMaterials || [];
  const movementSummary = data?.movementSummary || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertes stock bas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{lowStockMaterials.length}</div>
            <p className="text-xs text-muted-foreground">Articles sous le seuil critique</p>
          </CardContent>
        </Card>

        <Card className="bg-muted border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mouvements (30j)</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {movementSummary.reduce((acc, m) => acc + (m.total_stock_out || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total des articles mouvementés</p>
          </CardContent>
        </Card>

        <Card className="bg-muted border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de rotation</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <p className="text-xs text-muted-foreground">Calcul en cours...</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Articles en stock critique</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockMaterials.length === 0 ? (
            <p className="text-muted-foreground py-4">Aucune alerte de stock pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Article</TableHead>
                  <TableHead className="text-muted-foreground">SKU</TableHead>
                  <TableHead className="text-muted-foreground text-right">Stock actuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockMaterials.map((item) => (
                  <TableRow key={item.material_id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-foreground">{item.sku}</TableCell>
                    <TableCell className="text-right text-foreground font-bold text-yellow-500">
                      {item.current_stock}
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

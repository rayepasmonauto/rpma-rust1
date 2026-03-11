'use client';

import React from 'react';
import {
  Zap,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Trash2,
  Download,
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle,
  Save,
} from 'lucide-react';
import { UserSession } from '@/lib/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserAccount } from '@/types';
import { usePerformanceSettings, formatNumber } from '../hooks/usePerformanceSettings';

interface PerformanceSettingsTabProps {
  user?: UserSession;
  profile?: UserAccount;
}

export function PerformanceTab({ user }: PerformanceSettingsTabProps) {
  const {
    isLoading,
    isSaving,
    saveSuccess,
    saveError,
    cacheStats,
    syncStats,
    isOnline,
    form,
    onSubmit,
    handleClearCache,
    handleForceSync,
  } = usePerformanceSettings(user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Paramètres de performance mis à jour avec succès
          </AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {isOnline ? 'Connecté' : 'Hors ligne'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline
                  ? 'Synchronisation automatique activée'
                  : 'Fonctionnement en mode hors ligne'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Connectivity Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Connectivité et démarrage
              </CardTitle>
               <CardDescription>
                 Configurez le mode hors ligne et la synchronisation au démarrage
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="offline_mode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mode hors ligne</FormLabel>
                      <FormDescription>
                        Active un comportement optimisé pour les connexions instables
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Cache Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestion du cache
              </CardTitle>
               <CardDescription>
                 Contrôlez l&apos;utilisation du cache pour optimiser les performances
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="cache_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Cache activé</FormLabel>
                      <FormDescription>
                        Utiliser le cache local pour améliorer les performances
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cache_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille maximale du cache</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="50"
                        max="500"
                        {...field}
                        value={isNaN(field.value) ? '' : field.value}
                        onChange={(e) => { const v = parseInt(e.target.value, 10); field.onChange(v); }}
                      />
                    </FormControl>
                    <FormDescription>
                      Espace maximum alloué au cache local (50-500 MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

               {/* Cache Statistics */}
               <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                 <h4 className="text-sm font-medium">Statistiques du cache</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-muted-foreground">Utilisation mémoire</p>
                     <div className="flex items-center gap-2">
                       <Progress value={Math.min(((cacheStats.used_memory_mb ?? 0) / 512) * 100, 100)} className="flex-1" />
                       <span className="text-sm font-medium">
                         {formatNumber(cacheStats.used_memory_mb)} MB
                       </span>
                     </div>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Total des clés</p>
                     <p className="text-sm font-medium">{cacheStats.total_keys.toLocaleString()}</p>
                   </div>
                 </div>

                 {/* Cache Types Breakdown */}
                 {cacheStats.cache_types.length > 0 && (
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Répartition par type:</p>
                     <div className="space-y-1">
                       {cacheStats.cache_types.map((cacheType) => (
                         <div key={cacheType.cache_type} className="flex justify-between text-xs">
                           <span>{cacheType.cache_type}</span>
                           <span>{cacheType.keys_count} clés ({formatNumber(cacheType.memory_used_mb)} MB)</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Performance Metrics */}
                 {(cacheStats.hit_rate != null || cacheStats.avg_response_time_ms != null) && (
                   <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                     {cacheStats.hit_rate != null && (
                       <div>
                         <p className="text-sm text-muted-foreground">Taux de succès</p>
                         <p className="text-sm font-medium">{formatNumber(cacheStats.hit_rate * 100, 1)}%</p>
                       </div>
                     )}
                     {cacheStats.avg_response_time_ms != null && (
                       <div>
                         <p className="text-sm text-muted-foreground">Temps de réponse</p>
                         <p className="text-sm font-medium">{formatNumber(cacheStats.avg_response_time_ms, 1)} ms</p>
                       </div>
                     )}
                   </div>
                 )}

                 <div className="flex items-center justify-end pt-2">
                   <Button variant="outline" size="sm" onClick={handleClearCache}>
                     <Trash2 className="h-4 w-4 mr-2" />
                     Vider le cache
                   </Button>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Synchronization Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Synchronisation
              </CardTitle>
              <CardDescription>
                Gérez les paramètres de synchronisation avec le serveur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="sync_on_startup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sync au démarrage</FormLabel>
                        <FormDescription>
                          Synchroniser les données au lancement de l&apos;application
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="background_sync"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sync en arrière-plan</FormLabel>
                        <FormDescription>
                          Synchroniser automatiquement en arrière-plan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Sync Statistics */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">État de la synchronisation</h4>
                  <div className="flex items-center gap-2">
                    {syncStats.syncStatus === 'syncing' && <Badge variant="secondary">Synchronisation...</Badge>}
                    {syncStats.syncStatus === 'error' && <Badge variant="destructive">Erreur</Badge>}
                    {syncStats.syncStatus === 'idle' && <Badge variant="outline">Inactif</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière sync</p>
                    <p className="text-sm font-medium">
                      {syncStats.lastSync ? new Date(syncStats.lastSync).toLocaleString('fr-FR') : 'Jamais'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        <span className="text-sm">{syncStats.pendingUploads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span className="text-sm">{syncStats.pendingDownloads}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceSync}
                  disabled={syncStats.syncStatus === 'syncing' || !isOnline}
                  className="w-full"
                >
                  {syncStats.syncStatus === 'syncing' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Forcer la synchronisation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Performance Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Options supplémentaires
              </CardTitle>
              <CardDescription>
                Paramètres avancés pour optimiser les performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="image_compression"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Compression d&apos;images</FormLabel>
                        <FormDescription>
                          Compresser automatiquement les images pour économiser l&apos;espace
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preload_data"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Préchargement des données</FormLabel>
                        <FormDescription>
                          Précharger les données fréquemment utilisées
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder les paramètres
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

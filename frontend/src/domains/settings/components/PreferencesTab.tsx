'use client';

import React from 'react';
import { UserSession } from '@/lib/backend';
import { UserAccount } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { usePreferencesForm } from '../hooks/usePreferencesForm';

interface PreferencesSettingsTabProps {
  user?: UserSession;
  profile?: UserAccount;
}

export function PreferencesTab({ user, profile: _profile }: PreferencesSettingsTabProps) {
  const { form, isLoading, isSaving, saveSuccess, saveError, onSubmit } = usePreferencesForm(user);
  const { control, handleSubmit, formState: { isDirty } } = form;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Préférences sauvegardées</AlertDescription>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Affichage & Langue */}
        <Card>
          <CardHeader>
            <CardTitle>Affichage & Langue</CardTitle>
            <CardDescription>Personnalisez l&apos;apparence et la langue de l&apos;application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Thème</Label>
                <Controller
                  control={control}
                  name="preferences.theme"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Système (automatique)</SelectItem>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Langue</Label>
                <Controller
                  control={control}
                  name="preferences.language"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Format de date</Label>
                <Controller
                  control={control}
                  name="preferences.date_format"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA (31/12/2024)</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA (12/31/2024)</SelectItem>
                        <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ (2024-12-31)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Format d&apos;heure</Label>
                <Controller
                  control={control}
                  name="preferences.time_format"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h (14:30)</SelectItem>
                        <SelectItem value="12h">12h (02:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choisissez les événements pour lesquels vous souhaitez être notifié</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium">Tâches assignées</p>
                  <p className="text-xs text-muted-foreground">Lorsqu&apos;une tâche vous est assignée</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_assigned"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium">Mises à jour de tâches</p>
                  <p className="text-xs text-muted-foreground">Modifications sur les tâches que vous suivez</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_updated"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium">Tâches en retard</p>
                  <p className="text-xs text-muted-foreground">Rappels pour les tâches dépassant leur échéance</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_overdue"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium">Alertes système</p>
                  <p className="text-xs text-muted-foreground">Notifications importantes de l&apos;application</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.system_alerts"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Son des notifications</p>
                  <p className="text-xs text-muted-foreground">Activer le son lors des notifications</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.sound_enabled"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Heures silencieuses</p>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Activer les heures silencieuses</p>
                  <p className="text-xs text-muted-foreground">Suspendre les notifications pendant une plage horaire</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.quiet_hours_enabled"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibilité */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibilité</CardTitle>
            <CardDescription>Options pour améliorer la lisibilité et l&apos;ergonomie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium">Contraste élevé</p>
                <p className="text-xs text-muted-foreground">Augmente le contraste des couleurs</p>
              </div>
              <Controller
                control={control}
                name="accessibility.high_contrast"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium">Texte agrandi</p>
                <p className="text-xs text-muted-foreground">Augmente la taille du texte dans l&apos;interface</p>
              </div>
              <Controller
                control={control}
                name="accessibility.large_text"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Réduire les animations</p>
                <p className="text-xs text-muted-foreground">Limite les effets visuels animés</p>
              </div>
              <Controller
                control={control}
                name="accessibility.reduce_motion"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={isSaving || !isDirty} className="flex items-center gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSaving || !isDirty}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}

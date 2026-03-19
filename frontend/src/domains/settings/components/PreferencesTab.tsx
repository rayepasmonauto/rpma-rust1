'use client';

import React from 'react';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { UserSession } from '@/lib/backend';
import { UserAccount } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePreferencesForm } from '../hooks/usePreferencesForm';

interface PreferencesSettingsTabProps {
  user?: UserSession;
  profile?: UserAccount;
}

export function PreferencesTab({ user, profile: _profile }: PreferencesSettingsTabProps) {
  const { form, isLoading, isSaving, saveSuccess, saveError, onSubmit } = usePreferencesForm(user);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
    watch,
  } = form;
  const quietHoursEnabled = watch('notifications.quiet_hours_enabled');

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
          <AlertDescription className="text-green-800">Preferences sauvegardees</AlertDescription>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Affichage & Langue</CardTitle>
            <CardDescription>Personnalisez l&apos;apparence et la langue de l&apos;application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Controller
                  control={control}
                  name="preferences.theme"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner un theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Systeme (automatique)</SelectItem>
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
                        <SelectValue placeholder="Selectionner une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Francais</SelectItem>
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

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configurez les notifications in-app actuellement prises en charge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-sm font-medium">Canal pris en charge</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cette version utilise uniquement les notifications dans l&apos;application. Les canaux email, SMS et push restent masques tant qu&apos;ils ne sont pas reellement branches.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Activer les notifications in-app</p>
                  <p className="text-xs text-muted-foreground">Affiche les nouvelles notifications dans la cloche et dans le panneau</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.in_app_enabled"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-sm font-medium">Notifications automatiques</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ces alertes sont creees automatiquement par l&apos;application selon les evenements actuellement supportes.
                </p>
              </div>

              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Taches assignees</p>
                  <p className="text-xs text-muted-foreground">Lorsqu&apos;une tache vous est assignee</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_assigned"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Mises a jour de taches</p>
                  <p className="text-xs text-muted-foreground">Modifications sur les taches que vous suivez</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_updated"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Taches terminees</p>
                  <p className="text-xs text-muted-foreground">Quand une tache suivie passe a l&apos;etat terminee</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_completed"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Taches en retard</p>
                  <p className="text-xs text-muted-foreground">Rappels pour les taches depassant leur echeance</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.task_overdue"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-sm font-medium">Alertes systeme</p>
                  <p className="text-xs text-muted-foreground">Alertes critiques affichees dans l&apos;application</p>
                </div>
                <Controller
                  control={control}
                  name="notifications.system_alerts"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="rounded-lg border border-dashed border-border/60 p-4">
                <p className="text-sm font-medium">Hors scope de cette version</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les envois email/SMS/push, les sons et les resumes planifies reviendront quand leurs traitements reels seront disponibles.
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Heures silencieuses</p>
                  <p className="text-xs text-muted-foreground">Suspend les toasts temps reel pendant une plage horaire, sans supprimer les notifications du panneau</p>
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

            {quietHoursEnabled && (
              <div className="grid grid-cols-1 gap-4 border-t border-border/40 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quiet-hours-start">Debut</Label>
                  <Controller
                    control={control}
                    name="notifications.quiet_hours_start"
                    render={({ field }) => (
                      <Input
                        id="quiet-hours-start"
                        type="time"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-hours-end">Fin</Label>
                  <Controller
                    control={control}
                    name="notifications.quiet_hours_end"
                    render={({ field }) => (
                      <Input
                        id="quiet-hours-end"
                        type="time"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibilite</CardTitle>
            <CardDescription>Options pour ameliorer la lisibilite et l&apos;ergonomie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 py-2">
              <div>
                <p className="text-sm font-medium">Contraste eleve</p>
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

            <div className="flex items-center justify-between border-b border-border/40 py-2">
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
                <p className="text-sm font-medium">Reduire les animations</p>
                <p className="text-xs text-muted-foreground">Limite les effets visuels animes</p>
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
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les preferences'}
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

"use client";

import { useState } from "react";
import { Bell, Clock3, Lock, RefreshCw, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAppSettings } from "../hooks/useAdminAppSettings";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

const NOTIFICATION_FIELDS = [
  ["push_notifications", "Notifications push"],
  ["email_notifications", "Notifications email"],
  ["sms_notifications", "Notifications SMS"],
  ["task_assignments", "Affectations de tâches"],
  ["task_completions", "Fin de tâche"],
  ["system_alerts", "Alertes système"],
  ["daily_digest", "Digest quotidien"],
] as const;

export function AppSettingsTab() {
  const [activeTab, setActiveTab] = useState("general");
  const {
    settings,
    businessHours,
    isLoading,
    isSaving,
    hasChanges,
    save,
    reset,
    updateGeneral,
    updateSecurity,
    updateNotifications,
    setBusinessHours,
  } = useAdminAppSettings();

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Paramètres applicatifs</h2>
          <p className="text-sm text-muted-foreground">
            Configuration réelle du poste RPMA: préférences globales, sécurité et horaires atelier.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={reset} disabled={!hasChanges || isSaving}>
            Annuler
          </Button>
          <Button onClick={() => void save()} disabled={!hasChanges || isSaving}>
            {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-4">
          <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" />Général</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Lock className="h-4 w-4" />Sécurité</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="hours" className="gap-2"><Clock3 className="h-4 w-4" />Horaires</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences globales</CardTitle>
              <CardDescription>Valeurs communes à l’application locale RPMA.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Input id="language" value={settings.general.language} onChange={(event) => updateGeneral((current) => ({ ...current, language: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Input id="timezone" value={settings.general.timezone} onChange={(event) => updateGeneral((current) => ({ ...current, timezone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Format de date</Label>
                <Input id="date-format" value={settings.general.date_format} onChange={(event) => updateGeneral((current) => ({ ...current, date_format: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input id="currency" value={settings.general.currency} onChange={(event) => updateGeneral((current) => ({ ...current, currency: event.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
                <div>
                  <Label htmlFor="auto-save">Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">Conserve les modifications des formulaires sans action manuelle.</p>
                </div>
                <Switch id="auto-save" checked={settings.general.auto_save} onCheckedChange={(checked) => updateGeneral((current) => ({ ...current, auto_save: checked }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité système</CardTitle>
              <CardDescription>Politique locale de session et de mot de passe.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout session (minutes)</Label>
                <Input id="session-timeout" type="number" min="5" value={settings.security.session_timeout} onChange={(event) => updateSecurity((current) => ({ ...current, session_timeout: Number(event.target.value) || 5 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-length">Longueur mini mot de passe</Label>
                <Input id="password-length" type="number" min="6" value={settings.security.password_min_length} onChange={(event) => updateSecurity((current) => ({ ...current, password_min_length: Number(event.target.value) || 8 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-attempts">Tentatives max</Label>
                <Input id="login-attempts" type="number" min="1" value={settings.security.login_attempts_max} onChange={(event) => updateSecurity((current) => ({ ...current, login_attempts_max: Number(event.target.value) || 1 }))} />
              </div>
              <div className="rounded-lg border p-4 space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-2fa">2FA globale</Label>
                  <Switch id="system-2fa" checked={settings.security.two_factor_enabled} onCheckedChange={(checked) => updateSecurity((current) => ({ ...current, two_factor_enabled: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-special">Caractères spéciaux requis</Label>
                  <Switch id="require-special" checked={settings.security.password_require_special_chars} onCheckedChange={(checked) => updateSecurity((current) => ({ ...current, password_require_special_chars: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-numbers">Chiffres requis</Label>
                  <Switch id="require-numbers" checked={settings.security.password_require_numbers} onCheckedChange={(checked) => updateSecurity((current) => ({ ...current, password_require_numbers: checked }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications globales</CardTitle>
              <CardDescription>Réglages applicatifs communs pour les alertes et affectations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_FIELDS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <Label htmlFor={key}>{label}</Label>
                  <Switch id={key} checked={settings.notifications[key]} onCheckedChange={(checked) => updateNotifications((current) => ({ ...current, [key]: checked }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Horaires atelier</CardTitle>
              <CardDescription>Référence utilisée pour l’organisation terrain et les créneaux.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hours-timezone">Fuseau horaire atelier</Label>
                <Input id="hours-timezone" value={businessHours.timezone} onChange={(event) => setBusinessHours((current) => ({ ...current, timezone: event.target.value }))} />
              </div>
              {DAYS.map(({ key, label }) => {
                const day = businessHours.schedule[key] ?? { start: "08:00", end: "18:00", enabled: false };
                return (
                  <div key={key} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[180px_1fr_1fr_auto]">
                    <div className="flex items-center font-medium">{label}</div>
                    <Input type="time" value={day.start} disabled={!day.enabled} onChange={(event) => setBusinessHours((current) => ({ ...current, schedule: { ...current.schedule, [key]: { ...day, start: event.target.value } } }))} />
                    <Input type="time" value={day.end} disabled={!day.enabled} onChange={(event) => setBusinessHours((current) => ({ ...current, schedule: { ...current.schedule, [key]: { ...day, end: event.target.value } } }))} />
                    <div className="flex items-center justify-end gap-3">
                      <Label htmlFor={`enabled-${key}`}>Ouvert</Label>
                      <Switch id={`enabled-${key}`} checked={day.enabled} onCheckedChange={(checked) => setBusinessHours((current) => ({ ...current, schedule: { ...current.schedule, [key]: { ...day, enabled: checked } } }))} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showSaveDialog, showOpenDialog } from '@/lib/ipc/platform';
import { settingsIpc } from '@/domains/settings/ipc/settings.ipc';

// ── helpers ────────────────────────────────────────────────────────────────

function buildDefaultBackupName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    'rpma-backup',
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('-') + '.db';
}

// ── component ──────────────────────────────────────────────────────────────

export default function DataSettingsPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportResult, setExportResult] = useState<
    { ok: true; path: string } | { ok: false; message: string } | null
  >(null);

  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<
    { ok: true } | { ok: false; message: string } | null
  >(null);

  // Pending restore — path chosen in dialog, waiting for confirmation.
  const [pendingRestorePath, setPendingRestorePath] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── export ──────────────────────────────────────────────────────────────

  async function handleExport() {
    setExportResult(null);
    let dest: string | null = null;

    try {
      dest = await showSaveDialog({
        title: 'Exporter la sauvegarde',
        defaultPath: buildDefaultBackupName(),
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }],
      });
    } catch {
      setExportResult({ ok: false, message: 'Impossible d\'ouvrir la boîte de dialogue.' });
      return;
    }

    if (!dest) return; // user cancelled

    setExportLoading(true);
    try {
      await settingsIpc.exportDataBackup(dest);
      setExportResult({ ok: true, path: dest });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'export.';
      setExportResult({ ok: false, message: msg });
    } finally {
      setExportLoading(false);
    }
  }

  // ── restore — step 1: pick file ─────────────────────────────────────────

  async function handleRestorePickFile() {
    setRestoreResult(null);
    let src: string | null = null;

    try {
      src = await showOpenDialog({
        title: 'Sélectionner une sauvegarde',
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }],
      });
    } catch {
      setRestoreResult({ ok: false, message: 'Impossible d\'ouvrir la boîte de dialogue.' });
      return;
    }

    if (!src) return; // user cancelled

    setPendingRestorePath(src);
    setConfirmOpen(true);
  }

  // ── restore — step 2: confirmed ─────────────────────────────────────────

  async function handleRestoreConfirmed() {
    if (!pendingRestorePath) return;
    setConfirmOpen(false);
    setRestoreLoading(true);
    setRestoreResult(null);

    try {
      await settingsIpc.restoreDataBackup(pendingRestorePath);
      setRestoreResult({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la restauration.';
      setRestoreResult({ ok: false, message: msg });
    } finally {
      setRestoreLoading(false);
      setPendingRestorePath(null);
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[hsl(var(--rpma-teal))]/20 rounded-lg">
          <Database className="h-5 w-5 text-[hsl(var(--rpma-teal))]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gestion des données</h2>
          <p className="text-sm text-muted-foreground">
            Toutes les données sont stockées localement sur cet appareil.
          </p>
        </div>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Exporter toutes les données
          </CardTitle>
          <CardDescription>
            Crée une copie complète de la base de données locale. Utilisez cette sauvegarde
            pour archiver vos données ou les transférer vers un autre appareil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? 'Export en cours…' : 'Exporter la base de données'}
          </Button>

          {exportResult?.ok === true && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Sauvegarde exportée avec succès :{' '}
                <span className="font-mono text-xs break-all">{exportResult.path}</span>
              </AlertDescription>
            </Alert>
          )}
          {exportResult?.ok === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{exportResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Restaurer depuis une sauvegarde
          </CardTitle>
          <CardDescription>
            Remplace toutes les données locales par celles d&apos;une sauvegarde précédemment
            exportée. Cette opération est <strong>irréversible</strong> : les données actuelles
            seront écrasées au prochain démarrage de l&apos;application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleRestorePickFile}
            disabled={restoreLoading}
            className="flex items-center gap-2 border-destructive/40 text-destructive hover:bg-destructive/5"
          >
            <Upload className="h-4 w-4" />
            {restoreLoading ? 'Validation en cours…' : 'Restaurer une sauvegarde…'}
          </Button>

          {restoreResult?.ok === true && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Sauvegarde préparée.</strong> Quittez et redémarrez l&apos;application
                pour finaliser la restauration. Les données actuelles seront remplacées au
                prochain démarrage.
              </AlertDescription>
            </Alert>
          )}
          {restoreResult?.ok === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{restoreResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Destructive confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Restaurer la base de données ?"
        description={
          pendingRestorePath
            ? `Cette opération remplacera toutes les données locales par le contenu de :\n${pendingRestorePath}\n\nLes données actuelles seront définitivement écrasées au prochain démarrage.`
            : 'Cette opération est irréversible.'
        }
        confirmText="Confirmer la restauration"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleRestoreConfirmed}
      />
    </div>
  );
}

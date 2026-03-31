import React from 'react';
import { Download, Share2, Printer, ArrowLeft, Home, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/shared/hooks';

type CompletedActionBarProps = {
  onSaveReport: () => Promise<void>;
  onDownloadDataJson: () => void;
  onShareTask: () => void;
  onPrintReport: () => Promise<void>;
  onBackToTask?: () => void;
  onBackToTasks?: () => void;
  isExporting: boolean;
  exportProgress: string;
  lastExportTime: Date | null;
  taskId: string;
};

export function CompletedActionBar({
  onSaveReport,
  onDownloadDataJson,
  onShareTask,
  onPrintReport,
  onBackToTask,
  onBackToTasks,
  isExporting,
  exportProgress,
  lastExportTime,
}: CompletedActionBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('completed.pageLabel')}</span>
          </div>

          {lastExportTime && (
            <div className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {t('completed.actionBar.lastExport')}:{' '}
              {lastExportTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}

          {isExporting && exportProgress && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{exportProgress}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onSaveReport}
            size="sm"
            aria-label={t('completed.actionBar.downloadPdf')}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('completed.actionBar.downloadPdf')}
          </Button>

          <Button
            onClick={onDownloadDataJson}
            variant="outline"
            size="sm"
            aria-label={t('completed.actionBar.downloadJson')}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('completed.actionBar.downloadJson')}
          </Button>

          <Button
            onClick={onPrintReport}
            disabled={isExporting}
            variant="outline"
            size="sm"
            aria-label={t('completed.actionBar.print')}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('completed.actionBar.generating')}
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                {t('completed.actionBar.print')}
              </>
            )}
          </Button>

          <Button
            onClick={onShareTask}
            variant="outline"
            size="sm"
            aria-label={t('completed.actionBar.share')}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t('completed.actionBar.share')}
          </Button>

          {onBackToTask && (
            <Button
              onClick={onBackToTask}
              variant="ghost"
              size="sm"
              aria-label={t('completed.actionBar.details')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('completed.actionBar.details')}
            </Button>
          )}

          {onBackToTasks && (
            <Button
              onClick={onBackToTasks}
              variant="ghost"
              size="sm"
              aria-label={t('completed.actionBar.tasks')}
            >
              <Home className="mr-2 h-4 w-4" />
              {t('completed.actionBar.tasks')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

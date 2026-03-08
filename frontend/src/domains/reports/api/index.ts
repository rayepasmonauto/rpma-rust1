// Public API surface for the reports domain.
// All cross-domain imports must go through this file.
export { ReportsProvider, useReportsContext } from './ReportsProvider';
export type { ReportsContextValue } from './ReportsProvider';
export { reportsIpc } from '../ipc';
export { useInterventionReport, useInterventionReportPreview } from '../hooks';
export { InterventionReportSection, ReportPreviewPanel } from '../components';
export type { InterventionReportViewModel, ReportStepViewModel } from '../services';

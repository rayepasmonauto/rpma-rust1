
emaMA@LAPTOP-76DN517M MINGW64 /d/rpma-rust/frontend (fix-fonction)
$ npm run lint

> rpma-frontend@0.1.0 lint
> eslint . --ext .ts,.tsx --max-warnings 10000


D:\rpma-rust\frontend\src\__tests__\setup.ts
  2:1  warning  `react` import should occur after import of `util`  import/order

D:\rpma-rust\frontend\src\app\AppNavigation.tsx
  3:1  warning  `@/domains/auth` import should occur after import of `@/components/RPMALayout`  import/order

D:\rpma-rust\frontend\src\app\RootClientLayout.tsx
   4:1  warning  `next/font/local` import should occur before import of `@/app/providers`              import/order
   9:1  warning  `next/navigation` import should occur before import of `@/app/providers`              import/order
  10:1  warning  `react` import should occur before import of `@/app/providers`                        import/order
  11:1  warning  `@/shared/utils` import should occur before import of `@/domains/auth`                import/order
  12:1  warning  `@/shared/hooks/useMenuEvents` import should occur before import of `@/domains/auth`  import/order
  15:1  warning  `@/shared/ui/theme-provider` import should occur before import of `@/domains/auth`    import/order
  16:1  warning  `@/components/ui/skeleton` import should occur before import of `@/domains/auth`      import/order
  17:1  warning  `@/lib/utils` import should occur before import of `@/app/providers`                  import/order

D:\rpma-rust\frontend\src\app\api\admin\business-rules\[id]\route.ts
  3:1  warning  `@/domains/admin/server` import should occur after import of `@/lib/api-auth`  import/order

D:\rpma-rust\frontend\src\app\api\admin\business-rules\route.ts
  4:2  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\[id]\route.ts
  3:1  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\business-hours\route.ts
  3:2  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\category\[category]\route.ts
  5:1  warning  `@/types/configuration.types` import should occur before import of `@/domains/admin/server`  import/order
  6:1  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`               import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\history\route.ts
  4:2  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\route.ts
  3:2  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\status\route.ts
  4:2  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\configuration\validate\route.ts
  3:1  warning  `@/types/configuration.types` import should occur before import of `@/domains/admin/server`  import/order
  4:1  warning  `@/lib/api-auth` import should occur before import of `@/domains/admin/server`               import/order

D:\rpma-rust\frontend\src\app\api\admin\integrations\route.ts
  5:1  warning  `zod` import should occur before import of `@/lib/supabase/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\performance\route.ts
  4:1  warning  `zod` import should occur before import of `@/lib/supabase/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\statistics\route.ts
  2:2  warning  `next/server` import should occur before import of `@/lib/supabase/server`  import/order

D:\rpma-rust\frontend\src\app\api\admin\tasks\bulk\route.ts
  2:1  warning  `next/server` import should occur before import of `@supabase/supabase-js`  import/order

D:\rpma-rust\frontend\src\app\api\admin\update-role\route.ts
  3:1  warning  `zod` import should occur before import of `@/lib/middleware/auth.middleware`  import/order

D:\rpma-rust\frontend\src\app\api\admin\users\[userId]\route.ts
  2:1  warning  `../../../../../lib/supabase/server` import should occur after import of `@/types/database.types`  import/order
  4:1  warning  `@/domains/users/server` import should occur after import of `@/types/database.types`              import/order

D:\rpma-rust\frontend\src\app\api\admin\users\route.ts
  3:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/users/server`  import/order
  4:1  warning  `zod` import should occur before import of `@/domains/users/server`                               import/order

D:\rpma-rust\frontend\src\app\api\auth\profile\route.ts
  3:1  warning  `@/domains/users/server` import should occur after type import of `@/lib/middleware/auth.middleware`  import/order
  5:1  warning  `@/types/utility.types` import should occur after type import of `@/lib/middleware/auth.middleware`   import/order

D:\rpma-rust\frontend\src\app\api\auth\signin\route.ts
  4:1  warning  `zod` import should occur before import of `@/lib/logger`  import/order

D:\rpma-rust\frontend\src\app\api\auth\signup\route.ts
  3:1  warning  `@/lib/logger` import should occur before import of `@/domains/users/server`  import/order
  4:1  warning  `zod` import should occur before import of `@/domains/users/server`           import/order

D:\rpma-rust\frontend\src\app\api\clients\[id]\route.ts
  2:1  warning  `@/domains/clients/server` import should occur after import of `@/lib/api-auth`  import/order

D:\rpma-rust\frontend\src\app\api\clients\route.ts
  2:2  warning  `@/domains/clients/server` import should occur after import of `@/lib/api-auth`  import/order
  3:2  warning  `@/types/client.types` import should occur after import of `@/lib/api-auth`      import/order

D:\rpma-rust\frontend\src\app\api\clients\search\route.ts
  3:2  warning  `@/types/api` import should occur before import of `@/domains/clients/server`  import/order

D:\rpma-rust\frontend\src\app\api\clients\stats\route.ts
  3:2  warning  `@/types/api` import should occur before import of `@/domains/clients/server`  import/order

D:\rpma-rust\frontend\src\app\api\interventions\[id]\advance\route.ts
  13:1   warning  `@/domains/interventions/server` import should occur after type import of `@/lib/backend`  import/order
  14:1   warning  `@/types/ppf-intervention` type import should occur after type import of `@/lib/backend`   import/order
  95:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u    @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\[id]\finalize\route.ts
   13:1  warning  `@/lib/backend` type import should occur before import of `@/domains/interventions/server`  import/order
  219:3  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u              @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\[id]\progress\route.ts
    9:1   warning  `@/domains/interventions/server` import should occur after import of `@/types/ppf-intervention`  import/order
   76:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  193:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\[id]\route.ts
  12:1   warning  `@/types/ppf-intervention` import should occur before import of `@/domains/interventions/server`  import/order
  69:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\[id]\steps\route.ts
  30:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\[id]\validate\route.ts
  13:1   warning  `@/types/ppf-intervention` import should occur before import of `@/domains/interventions/server`  import/order
  67:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\interventions\active-by-task\route.ts
  5:3  warning  `@/lib/api-auth` import should occur before import of `@/domains/tasks/server`      import/order
  6:3  warning  `@/lib/backend` type import should occur before import of `@/domains/tasks/server`  import/order

D:\rpma-rust\frontend\src\app\api\interventions\route.ts
  12:1  warning  `@/domains/interventions/server` import should occur after import of `@/lib/http-status`  import/order
  13:1  warning  `@/types/enums` import should occur after import of `@/lib/http-status`                   import/order

D:\rpma-rust\frontend\src\app\api\notifications\route.ts
  3:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/notifications/server`  import/order

D:\rpma-rust\frontend\src\app\api\photos\route.ts
  3:2  warning  `@/types/api` import should occur before import of `@/domains/tasks/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\accessibility\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\export\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\notifications\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\password\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\performance\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\preferences\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\profile\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\reset\route.ts
  2:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\settings\route.ts
  8:1  warning  `@/lib/middleware/auth.middleware` import should occur before import of `@/domains/settings/server`  import/order

D:\rpma-rust\frontend\src\app\api\tasks\[id]\route.ts
   6:1  warning  `@/lib/backend` type import should occur before import of `@/domains/tasks/server`       import/order
  25:7  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  99:7  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\api\tasks\route.ts
   65:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  141:11  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\audit\page.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/shared/ui/layout/PageShell`  import/order

D:\rpma-rust\frontend\src\app\bootstrap-admin\page.tsx
  3:1  warning  `@/domains/auth` import should occur after import of `@/components/ui/alert`  import/order

D:\rpma-rust\frontend\src\app\clients\[id]\edit\page.tsx
  4:1  warning  `next/link` import should occur before import of `lucide-react`  import/order

D:\rpma-rust\frontend\src\app\clients\[id]\page.tsx
  4:1  warning  `next/link` import should occur before import of `lucide-react`  import/order

D:\rpma-rust\frontend\src\app\clients\new\page.tsx
  4:1  warning  `next/link` import should occur before import of `lucide-react`  import/order

D:\rpma-rust\frontend\src\app\clients\page.tsx
  4:1  warning  `@/domains/clients` import should occur after import of `@/shared/ui/layout/PageShell`  import/order
  5:1  warning  `lucide-react` import should occur after import of `next/link`                          import/order
  7:1  warning  `@/domains/clients` import should occur after import of `@/shared/ui/layout/PageShell`  import/order

D:\rpma-rust\frontend\src\app\dashboard\page.tsx
  5:1  warning  `@/domains/auth` import should occur after import of `@/shared/ui/layout/LoadingState`  import/order

D:\rpma-rust\frontend\src\app\error.tsx
  13:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\app\global-error.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\app\login\page.tsx
  4:1  warning  `@/domains/auth` import should occur after import of `@/shared/ui/animations/UILoader`  import/order

D:\rpma-rust\frontend\src\app\messages\page.tsx
  10:1  warning  `@/shared/ui/layout/PageShell` import should occur before import of `@/domains/notifications`   import/order
  11:1  warning  `@/components/ui/page-header` import should occur before import of `@/domains/notifications`    import/order
  12:1  warning  `@/shared/ui/layout/ErrorState` import should occur before import of `@/domains/notifications`  import/order

D:\rpma-rust\frontend\src\app\not-found.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`     import/order
  7:1  warning  `framer-motion` import should occur before import of `@/components/ui/button`    import/order
  8:1  warning  `next/navigation` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\app\onboarding\page.tsx
  12:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\app\providers.tsx
  4:1  warning  `react` import should occur before import of `@tanstack/react-query`  import/order
  6:1  warning  `sonner` import should occur before import of `@/domains/auth`        import/order

D:\rpma-rust\frontend\src\app\quotes\new\page.tsx
  3:1  warning  `lucide-react` import should occur after import of `next/link`                     import/order
  6:1  warning  `@/domains/quotes` import should occur after import of `@/components/ui/skeleton`  import/order
  7:1  warning  `@/domains/quotes` import should occur after import of `@/components/ui/skeleton`  import/order

D:\rpma-rust\frontend\src\app\quotes\page.tsx
   5:1  warning  `lucide-react` import should occur after import of `next/link`                          import/order
  10:1  warning  `@/domains/quotes` import should occur after import of `@/shared/ui/animations/FadeIn`  import/order

D:\rpma-rust\frontend\src\app\settings\__tests__\SettingsPage.auth-props.test.tsx
  4:1  warning  `next/navigation` import should occur before import of `@testing-library/react`  import/order

D:\rpma-rust\frontend\src\app\settings\accessibility\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\settings\layout.tsx
   9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`               import/order
  22:1  warning  `@/shared/ui/layout/PageShell` import should occur before import of `@/domains/auth`     import/order
  23:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order
  24:1  warning  `@/components/ui/page-header` import should occur before import of `@/domains/auth`      import/order
  25:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`    import/order
  26:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/card`                import/order

D:\rpma-rust\frontend\src\app\settings\notifications\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\settings\organization\page.tsx
   6:1   warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order
  14:11  warning  'user' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\settings\performance\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\settings\preferences\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\settings\profile\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\settings\security\page.tsx
  6:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\signup\page.tsx
  10:1  warning  `@/constants` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\app\staff\page.tsx
  58:5  warning  'showForm' is assigned a value but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars
  59:5  warning  'editingUser' is assigned a value but never used. Allowed unused vars must match /^_/u        @typescript-eslint/no-unused-vars
  60:5  warning  'handleCreateUser' is assigned a value but never used. Allowed unused vars must match /^_/u   @typescript-eslint/no-unused-vars
  61:5  warning  'handleEditUser' is assigned a value but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars
  62:5  warning  'handleFormClose' is assigned a value but never used. Allowed unused vars must match /^_/u    @typescript-eslint/no-unused-vars
  63:5  warning  'handleFormSuccess' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\app\tasks\[id]\workflow\ppf\page.tsx
  6:1  warning  `@/components/ui/button` import should occur after type import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\app\tasks\[id]\workflow\ppf\steps\finalization\page.tsx
  24:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/alert-dialog`  import/order

D:\rpma-rust\frontend\src\app\tasks\[id]\workflow\ppf\steps\inspection\page.tsx
  17:1  warning  `@/lib/backend` type import should occur before import of `@/domains/interventions`  import/order

D:\rpma-rust\frontend\src\app\tasks\[id]\workflow\ppf\steps\preparation\page.tsx
  14:1  warning  `@/lib/backend` type import should occur before import of `@/domains/interventions`  import/order

D:\rpma-rust\frontend\src\app\unauthorized\page.tsx
  6:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\app\users\page.tsx
   5:1  warning  `@/components/ui/page-header` import should occur before import of `@/domains/users`      import/order
   6:1  warning  `@/shared/ui/layout/PageShell` import should occur before import of `@/domains/users`     import/order
   7:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/users`  import/order
   8:1  warning  `@/shared/ui/layout/ErrorState` import should occur before import of `@/domains/users`    import/order
   9:1  warning  `lucide-react` import should occur before import of `@/domains/users`                     import/order
  10:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/users`    import/order

D:\rpma-rust\frontend\src\components\layout\DrawerSidebar.tsx
  10:1  warning  `@/components/ui/avatar` import should occur before import of `@/domains/auth`  import/order
  11:1  warning  `@tanstack/react-query` import should occur before import of `@/lib/utils`      import/order
  12:1  warning  `sonner` import should occur before import of `@/lib/utils`                     import/order
  13:1  warning  `framer-motion` import should occur before import of `@/lib/utils`              import/order

D:\rpma-rust\frontend\src\components\ui\animations.tsx
  6:1  warning  `react` import should occur before import of `framer-motion`  import/order

D:\rpma-rust\frontend\src\components\ui\error-boundary.tsx
  6:1  warning  `framer-motion` import should occur before import of `./button`  import/order

D:\rpma-rust\frontend\src\components\ui\page-header.tsx
  4:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\components\ui\skeleton.tsx
  2:1  warning  `react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\components\ui\status-badge.tsx
  4:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\components\ui\workflow-header-band.tsx
  3:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\constants\taskForm.constants.tsx
  2:1  warning  `react` import should occur before import of `lucide-react`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\AdminOverviewTab.tsx
  19:1  warning  `@/shared/hooks/useTranslation` import should occur before type import of `@/domains/admin`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\AdminSystemTab.tsx
  16:1  warning  `@/shared/hooks/useTranslation` import should occur before type import of `@/domains/admin`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\BusinessRuleFormDialog.tsx
  10:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\BusinessRulesTab.tsx
  11:1  warning  `framer-motion` import should occur before import of `@/components/ui/card`  import/order
  12:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order

D:\rpma-rust\frontend\src\domains\admin\components\ConfigurationPageContent.tsx
  9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\IntegrationCard.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\IntegrationsTab.tsx
   13:1   warning  `sonner` import should occur before import of `@/components/ui/card`                     import/order
   15:1   warning  `lucide-react` import should occur before import of `@/components/ui/card`               import/order
   23:1   warning  `@/shared/utils` import should occur before import of `@/domains/auth`                   import/order
   24:1   warning  `@/shared/types` type import should occur before import of `@/domains/auth`              import/order
   76:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   93:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  137:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  183:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\admin\components\MonitoringTab.tsx
  6:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\PerformanceConfigCard.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\PerformanceConfigForm.tsx
  10:1  warning  `lucide-react` import should occur before import of `@/components/ui/input`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\PerformanceTab.tsx
  6:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\admin\components\SecurityDashboard.tsx
   8:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order
  10:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/card`     import/order
  11:1  warning  `sonner` import should occur before import of `@/components/ui/card`        import/order

D:\rpma-rust\frontend\src\domains\admin\components\SecurityPoliciesTab.tsx
   15:1   warning  `sonner` import should occur before import of `@/components/ui/card`                     import/order
   16:1   warning  `lucide-react` import should occur before import of `@/components/ui/card`               import/order
   32:1   warning  `@/shared/utils` import should occur before import of `@/domains/auth`                   import/order
   33:1   warning  `@/shared/types` type import should occur before import of `@/domains/auth`              import/order
   82:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   99:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  144:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  166:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\admin\components\SystemSettingsTab.tsx
   14:1   warning  `sonner` import should occur before import of `@/components/ui/card`                     import/order
   17:1   warning  `framer-motion` import should occur before import of `@/components/ui/card`              import/order
   18:1   warning  `lucide-react` import should occur before import of `@/components/ui/card`               import/order
   38:1   warning  `@/shared/utils` import should occur before import of `@/domains/auth`                   import/order
   39:1   warning  `@/shared/types` type import should occur before import of `@/domains/auth`              import/order
  106:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  162:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  215:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\admin\components\__tests__\SystemSettingsTab.test.tsx
  7:1  warning  `@/shared/utils` import should occur before import of `../SystemSettingsTab`  import/order

D:\rpma-rust\frontend\src\domains\admin\hooks\useAdminDashboard.ts
  5:1  warning  `@/shared/utils` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\admin\hooks\useAdminPage.ts
  8:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\admin\hooks\useAdminUserManagement.ts
  4:1  warning  `@/domains/auth` import should occur after type import of `@/shared/types`  import/order

D:\rpma-rust\frontend\src\domains\admin\hooks\useBusinessRules.ts
    8:1   warning  `@/shared/utils` import should occur before import of `@/domains/auth`                   import/order
    9:1   warning  `@/shared/types` type import should occur before import of `@/domains/auth`              import/order
   10:1   warning  `lucide-react` import should occur before import of `@/shared/hooks/useLogger`           import/order
   18:1   warning  `@/shared/types` type import should occur before import of `@/domains/auth`              import/order
   53:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  102:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  145:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  162:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\admin\hooks\usePerformanceConfig.ts
    4:1   warning  `@/domains/auth` import should occur after type import of `@/shared/types`               import/order
   72:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   93:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  134:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  156:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\audit\services\change-log.service.ts
  96:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\auth\__tests__\AuthProvider.test.tsx
  6:1  warning  `@/lib/secureStorage` import should occur before import of `../api/AuthProvider`  import/order
  7:1  warning  `sonner` import should occur before import of `../api/AuthProvider`               import/order

D:\rpma-rust\frontend\src\domains\auth\api\AuthProvider.tsx
  8:1  warning  `sonner` import should occur before import of `@/lib/secureStorage`  import/order

D:\rpma-rust\frontend\src\domains\auth\components\LoginForm.tsx
  4:1  warning  `@/shared/ui` import should occur after import of `react-hook-form`        import/order
  7:1  warning  `../api/types` type import should occur after import of `react-hook-form`  import/order

D:\rpma-rust\frontend\src\domains\auth\components\SignupForm.tsx
  4:1  warning  `@/shared/ui` import should occur after import of `react-hook-form`    import/order
  9:1  warning  `../api/useAuth` import should occur after import of `@/shared/utils`  import/order

D:\rpma-rust\frontend\src\domains\auth\components\TOTPSetup.tsx
  7:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../server`  import/order

D:\rpma-rust\frontend\src\domains\auth\hooks\useBootstrapAdminPage.ts
   9:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../api/bootstrapAdmin`  import/order
  10:1  warning  `@/shared/utils` import should occur before import of `../api/bootstrapAdmin`                 import/order

D:\rpma-rust\frontend\src\domains\auth\hooks\useDashboardPage.ts
  6:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../api/useAuth`  import/order

D:\rpma-rust\frontend\src\domains\auth\hooks\useLoginForm.ts
  5:1  warning  `@/shared/utils` import should occur before import of `../api/useAuth`  import/order

D:\rpma-rust\frontend\src\domains\auth\hooks\useSignupForm.ts
  5:1  warning  `../api/useAuth` import should occur after import of `@/shared/hooks/useTranslation`  import/order
  6:1  warning  `../api/types` import should occur after import of `@/shared/hooks/useTranslation`    import/order

D:\rpma-rust\frontend\src\domains\auth\server\services\mfa.service.ts
  55:18  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  69:52  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  86:31  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  96:19  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\calendar\components\AgendaView.tsx
  3:1  warning  `@/lib/backend` type import should occur before import of `./TaskCard`  import/order

D:\rpma-rust\frontend\src\domains\calendar\components\CalendarDashboard.tsx
  12:1  warning  `../stores/calendarStore` import should occur before import of `./CalendarHeader`  import/order
  13:1  warning  `../hooks/useCalendar` import should occur before import of `./CalendarHeader`     import/order
  14:1  warning  `@/components/ui/button` import should occur before import of `./CalendarHeader`   import/order
  15:1  warning  `lucide-react` import should occur before import of `./CalendarHeader`             import/order
  16:1  warning  `sonner` import should occur before import of `./CalendarHeader`                   import/order

D:\rpma-rust\frontend\src\domains\calendar\components\CalendarFilters.tsx
   4:1  warning  `../stores/calendarStore` import should occur after type import of `@/lib/backend`      import/order
   5:1  warning  `@/domains/auth` import should occur after type import of `@/lib/backend`               import/order
   6:1  warning  `@/components/ui/button` import should occur after type import of `@/lib/backend`       import/order
   7:1  warning  `@/components/ui/input` import should occur after type import of `@/lib/backend`        import/order
   8:1  warning  `@/components/ui/label` import should occur after type import of `@/lib/backend`        import/order
   9:1  warning  `@/components/ui/checkbox` import should occur after type import of `@/lib/backend`     import/order
  10:1  warning  `@/components/ui/badge` import should occur after type import of `@/lib/backend`        import/order
  11:1  warning  `@/components/ui/separator` import should occur after type import of `@/lib/backend`    import/order
  12:1  warning  `@/components/ui/collapsible` import should occur after type import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\domains\calendar\components\CalendarView.tsx
   9:1  warning  `../hooks/useCalendar` import should occur before import of `./CalendarHeader`           import/order
  10:1  warning  `@/lib/backend` type import should occur before import of `./CalendarHeader`             import/order
  11:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `./CalendarHeader`  import/order

D:\rpma-rust\frontend\src\domains\calendar\components\DayView.tsx
  4:1  warning  `./TaskCard` import should occur after import of `@/lib/design-tokens`  import/order

D:\rpma-rust\frontend\src\domains\calendar\components\MonthView.tsx
  4:1  warning  `@/lib/backend` type import should occur before import of `./TaskCard`  import/order

D:\rpma-rust\frontend\src\domains\calendar\components\WeekView.tsx
  4:1  warning  `./TaskCard` import should occur after import of `@/lib/design-tokens`  import/order

D:\rpma-rust\frontend\src\domains\calendar\hooks\useCalendar.ts
  2:1  warning  `../ipc/calendar` import should occur after import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\clients\__tests__\client-stats.test.ts
  2:1  warning  `@/shared/types` type import should occur before import of `../utils/client-stats`  import/order

D:\rpma-rust\frontend\src\domains\clients\components\ClientCard.tsx
   6:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  27:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order
  28:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/card`    import/order

D:\rpma-rust\frontend\src\domains\clients\components\ClientDetail.tsx
   8:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  32:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\clients\components\ClientForm.tsx
  27:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`   import/order
  37:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\clients\components\ClientList.tsx
   6:1  warning  `@/components/ui/button` import should occur before import of `./ClientCard`    import/order
   7:1  warning  `@/components/ui/input` import should occur before import of `./ClientCard`     import/order
   8:1  warning  `@/components/ui/select` import should occur before import of `./ClientCard`    import/order
  15:1  warning  `lucide-react` import should occur before import of `@/lib/backend`             import/order
  21:1  warning  `@tanstack/react-virtual` import should occur before import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\domains\clients\components\ClientSelector.tsx
   9:1  warning  `lucide-react` import should occur before import of `@/lib/accessibility.ts`          import/order
  10:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/command`          import/order
  11:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/command`        import/order
  12:1  warning  `@/lib/secureStorage` import should occur before import of `@/components/ui/command`  import/order
  13:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/command`            import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useClient.ts
  2:1  warning  `@/domains/auth` import should occur after import of `@/types/utility.types`          import/order
  3:1  warning  `../services` import should occur after import of `@/types/utility.types`             import/order
  5:1  warning  `@/shared/hooks/useLogger` import should occur after import of `@/lib/logging/types`  import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useClientDetailPage.ts
  5:1  warning  `@/shared/types` import should occur before import of `@/domains/auth`                 import/order
  6:1  warning  `@/shared/utils` import should occur before import of `@/domains/auth`                 import/order
  7:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order
  8:1  warning  `@/lib/logging` import should occur before import of `@/domains/auth`                  import/order
  9:1  warning  `@/lib/logging/types` import should occur before import of `@/domains/auth`            import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useClientStats.ts
  4:1  warning  `@/shared/hooks/useLogger` import should occur before import of `@/domains/auth`  import/order
  5:1  warning  `@/lib/logging/types` import should occur before import of `@/domains/auth`       import/order
  6:1  warning  `@/types/utility.types` import should occur before import of `@/domains/auth`     import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useClients.ts
  2:1  warning  `@/domains/auth` import should occur after import of `@/types/utility.types`          import/order
  3:1  warning  `../services` import should occur after import of `@/types/utility.types`             import/order
  6:1  warning  `@/shared/hooks/useLogger` import should occur after import of `@/lib/logging/types`  import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useClientsPage.ts
   8:1  warning  `../utils/client-stats` import should occur before import of `./useClients`            import/order
   9:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`            import/order
  10:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order
  11:1  warning  `@/lib/logging` import should occur before import of `@/domains/auth`                  import/order
  12:1  warning  `@/lib/logging/types` import should occur before import of `@/domains/auth`            import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useEditClientPage.ts
  6:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order
  7:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`            import/order
  8:1  warning  `@/lib/logging` import should occur before import of `@/domains/auth`                  import/order
  9:1  warning  `@/lib/logging/types` import should occur before import of `@/domains/auth`            import/order

D:\rpma-rust\frontend\src\domains\clients\hooks\useNewClientPage.ts
   8:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`            import/order
   9:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order
  10:1  warning  `@/lib/logging` import should occur before import of `@/domains/auth`                  import/order
  11:1  warning  `@/lib/logging/types` import should occur before import of `@/domains/auth`            import/order

D:\rpma-rust\frontend\src\domains\clients\ipc\client.ipc.ts
  6:1  warning  `@/lib/backend` type import should occur before type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\domains\clients\services\client-creation.service.ts
  2:1  warning  `@/lib/backend` import should occur before import of `./client.service`  import/order

D:\rpma-rust\frontend\src\domains\clients\services\client.service.ts
  13:1  warning  `@/lib/ipc` import should occur before type import of `@/types/client.types`                     import/order
  14:1  warning  `@/lib/validation/ipc-schemas` import should occur before type import of `@/types/client.types`  import/order

D:\rpma-rust\frontend\src\domains\documents\components\PhotoUpload.tsx
   8:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`           import/order
   9:1  warning  `next/image` import should occur before import of `lucide-react`                      import/order
  10:1  warning  `react-dropzone` import should occur before import of `@/components/ui/button`        import/order
  12:1  warning  `@/shared/utils` import should occur before import of `../hooks/usePhotoUpload`       import/order
  14:1  warning  `@/types/photo.types` import should occur before import of `../hooks/usePhotoUpload`  import/order

D:\rpma-rust\frontend\src\domains\documents\hooks\usePhotoUpload.ts
  4:1  warning  `@/types/photo.types` import should occur before import of `../server`  import/order

D:\rpma-rust\frontend\src\domains\documents\services\task-photo.service.ts
   89:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  110:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\interventions\api\PPFWorkflowProvider.tsx
  7:1  warning  `@/domains/auth` import should occur after type import of `@/lib/StepType`  import/order

D:\rpma-rust\frontend\src\domains\interventions\api\WorkflowProvider.tsx
  4:1  warning  `@/domains/auth` import should occur after import of `@/types/type-utils`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\ppf\PpfPhotoGrid.tsx
  7:1  warning  `sonner` import should occur before import of `@/lib/utils`                import/order
  8:1  warning  `@tauri-apps/api/core` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\ppf\PpfWorkflowLayout.tsx
   9:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/button`  import/order
  10:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`         import/order

D:\rpma-rust\frontend\src\domains\interventions\components\ppf\ppfWorkflow.config.ts
  2:1  warning  `lucide-react` import should occur before type import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\workflow\WorkflowNavigationButton.tsx
  4:1  warning  `@/components/ui/button` import should occur after import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\workflow\ppf\PPFStepProgress.tsx
  6:1  warning  `next/navigation` import should occur before import of `framer-motion`                         import/order
  9:1  warning  `@/lib/StepType` type import should occur before import of `../../../api/PPFWorkflowProvider`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\workflow\ppf\PPFWorkflowHeader.tsx
  6:1  warning  `next/navigation` import should occur before import of `framer-motion`                            import/order
  8:1  warning  `@/components/ui/button` import should occur before import of `../../../api/PPFWorkflowProvider`  import/order

D:\rpma-rust\frontend\src\domains\interventions\components\workflow\ppf\VehicleDiagram.tsx
   9:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`   import/order
  10:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\interventions\hooks\useInstallationStep.ts
  8:1  warning  `@/lib/backend` type import should occur before import of `@/domains/interventions/api/client`  import/order

D:\rpma-rust\frontend\src\domains\interventions\hooks\useInterventionActions.ts
  3:1  warning  `../services/intervention-workflow.service` import should occur after type import of `@/types/ppf-intervention`  import/order
  4:1  warning  `../services/intervention-mappers` import should occur after type import of `@/types/ppf-intervention`           import/order
  9:1  warning  `../services/intervention-mappers` type import should occur after type import of `@/types/ppf-intervention`      import/order

D:\rpma-rust\frontend\src\domains\interventions\hooks\useInterventionData.ts
  3:1  warning  `@/domains/auth` import should occur after import of `@/lib/logging/types`  import/order

D:\rpma-rust\frontend\src\domains\interventions\hooks\useInterventionSync.ts
    2:1   warning  `@tanstack/react-query` import should occur after import of `react`                      import/order
    5:1   warning  `../services` import should occur after type import of `@/types/ppf-intervention`        import/order
  124:15  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\interventions\hooks\useInterventionWorkflow.ts
  10:1  warning  `@/lib/logging` import should occur before import of `./useInterventionState`                  import/order
  11:1  warning  `@/lib/logging/types` import should occur before import of `./useInterventionState`            import/order
  12:1  warning  `@/types/ppf-intervention` type import should occur before import of `./useInterventionState`  import/order

D:\rpma-rust\frontend\src\domains\interventions\hooks\usePpfWorkflow.ts
  5:1  warning  `@/domains/auth` import should occur after type import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\domains\interventions\ipc\interventions.ipc.ts
  9:1  warning  `@/types/json` type import should occur after import of `@/lib/logging/types`  import/order

D:\rpma-rust\frontend\src\domains\interventions\services\intervention-workflow.service.ts
  5:1  warning  `@/lib/backend` type import should occur before type import of `@/types/api`                     import/order
  7:1  warning  `@/types/api` type import should occur before import of `../ipc/interventions.ipc`               import/order
  8:1  warning  `@/types/ppf-intervention` type import should occur before import of `../ipc/interventions.ipc`  import/order

D:\rpma-rust\frontend\src\domains\interventions\services\photo.service.ts
   66:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   87:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  100:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\interventions\services\ppf.ts
    2:1   warning  `@/types/ppf-intervention` type import should occur after type import of `@/lib/backend`  import/order
    3:1   warning  `@/types/api` import should occur after type import of `@/lib/backend`                    import/order
   56:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
   94:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  134:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  158:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  175:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\interventions\services\workflow-service-adapter.ts
  17:1  warning  `@/lib/backend` type import should occur before type import of `@/types/workflow.types`  import/order

D:\rpma-rust\frontend\src\domains\interventions\workflow\services\workflow.service.ts
  8:1  warning  `@/lib/backend` type import should occur before import of `@/types`  import/order

D:\rpma-rust\frontend\src\domains\inventory\__tests__\InventoryProvider.test.tsx
  3:1  warning  `@/domains/auth` import should occur before import of `../api/InventoryProvider`  import/order

D:\rpma-rust\frontend\src\domains\inventory\__tests__\response-utils.test.ts
  1:1  warning  `../server/response-utils` import should occur after import of `@/lib/ipc/commands`  import/order

D:\rpma-rust\frontend\src\domains\inventory\__tests__\useInventory.test.tsx
  3:1  warning  `@/domains/auth` import should occur before import of `../api/useInventory`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventoryDashboard.tsx
  3:1  warning  `@/components/ui/card` import should occur after import of `lucide-react`                         import/order
  5:1  warning  `../hooks/useInventoryStats` import should occur after import of `@/shared/hooks/useTranslation`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventoryLayout.tsx
  4:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `./InventoryTabs`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventoryManager.tsx
  15:1  warning  `../hooks/useInventory` import should occur before import of `./StockLevelIndicator`          import/order
  16:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `./StockLevelIndicator`  import/order
  17:1  warning  `@/shared/types` import should occur before import of `./StockLevelIndicator`                 import/order
  18:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`                  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventoryReports.tsx
   7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  14:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventorySettings.tsx
  12:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  16:1  warning  `sonner` import should occur before import of `@/components/ui/card`         import/order
  19:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\InventoryTabs.tsx
   7:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`              import/order
  12:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `./MaterialCatalog`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\MaterialForm.tsx
  11:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../hooks/useMaterialForm`  import/order
  12:1  warning  `@/components/ui/loading` import should occur before import of `../hooks/useMaterialForm`        import/order
  13:1  warning  `sonner` import should occur before import of `@/components/ui/button`                           import/order

D:\rpma-rust\frontend\src\domains\inventory\components\StockLevelIndicator.test.tsx
  4:1  warning  `@/shared/types` import should occur before import of `./StockLevelIndicator`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\StockLevelIndicator.tsx
  9:1  warning  `lucide-react` import should occur before import of `@/components/ui/progress`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\SupplierManagement.tsx
  12:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  16:1  warning  `sonner` import should occur before import of `@/components/ui/card`         import/order
  19:1  warning  `@/shared/types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\inventory\components\__tests__\StockLevelIndicator.test.tsx
  4:1  warning  `@/shared/types` import should occur before import of `../StockLevelIndicator`  import/order

D:\rpma-rust\frontend\src\domains\inventory\hooks\useInventory.ts
   5:1  warning  `@/types/auth.types` import should occur before import of `@/domains/auth`  import/order
  17:1  warning  `@/types/json` type import should occur before import of `@/domains/auth`   import/order

D:\rpma-rust\frontend\src\domains\inventory\hooks\useInventoryStats.ts
  5:1  warning  `@/types/auth.types` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\inventory\hooks\useMaterialForm.ts
  6:1  warning  `@/types/json` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\inventory\ipc\inventory.ipc.ts
  1:1  warning  `../server` import should occur after type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\domains\notifications\components\MessageComposer.tsx
  13:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../api/useMessages`  import/order
  14:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/button`         import/order
  15:1  warning  `sonner` import should occur before import of `@/components/ui/button`                     import/order
  16:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`               import/order

D:\rpma-rust\frontend\src\domains\notifications\components\MessageInbox.tsx
  11:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/card`  import/order
  12:1  warning  `date-fns` import should occur before import of `@/components/ui/card`            import/order
  13:1  warning  `date-fns/locale` import should occur before import of `@/components/ui/card`     import/order
  14:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`        import/order

D:\rpma-rust\frontend\src\domains\notifications\components\NotificationPreferences.tsx
  12:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/card`  import/order
  13:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`        import/order

D:\rpma-rust\frontend\src\domains\notifications\hooks\useMessage.ts
    4:1  warning  `@/lib/backend` type import should occur before import of `@/domains/auth`                                            import/order
   13:1  warning  `sonner` import should occur before import of `@/lib/ipc/message`                                                     import/order
   33:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps
   63:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps
   79:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps
  115:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps
  148:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps
  164:6  warning  React Hook useCallback has an unnecessary dependency: 'user.token'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

D:\rpma-rust\frontend\src\domains\notifications\hooks\useMessagesPage.ts
  5:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\notifications\hooks\useNotificationUpdates.ts
  7:1  warning  `@/domains/auth` import should occur before import of `../stores/notificationStore`  import/order

D:\rpma-rust\frontend\src\domains\notifications\services\notificationActions.ts
  2:1  warning  `sonner` import should occur before import of `@/lib/ipc/notification`  import/order

D:\rpma-rust\frontend\src\domains\notifications\services\notifications.service.ts
   3:1   warning  `@/lib/ipc/types/index` type import should occur before type import of `@/types/json`  import/order
  38:74  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u         @typescript-eslint/no-unused-vars
  42:67  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u         @typescript-eslint/no-unused-vars
  49:93  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u         @typescript-eslint/no-unused-vars
  53:38  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u         @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\organizations\components\OrganizationSettingsTab.tsx
   8:10  warning  'Separator' is defined but never used. Allowed unused vars must match /^_/u    @typescript-eslint/no-unused-vars
   9:1   warning  `react-hook-form` import should occur before import of `@/components/ui/card`  import/order
  10:1   warning  `lucide-react` import should occur before import of `@/components/ui/card`     import/order

D:\rpma-rust\frontend\src\domains\quotes\__tests__\QuoteDetailPageContent.test.tsx
  5:1  warning  `@/types/quote.types` type import should occur before import of `../components/QuoteDetailPageContent`  import/order

D:\rpma-rust\frontend\src\domains\quotes\__tests__\QuoteItemsTable.test.tsx
  4:1  warning  `@/types/quote.types` type import should occur before import of `../components/QuoteItemsTable`  import/order

D:\rpma-rust\frontend\src\domains\quotes\__tests__\QuoteStatusBadge.test.tsx
  4:1  warning  `@/types/quote.types` type import should occur before import of `../components/QuoteStatusBadge`  import/order

D:\rpma-rust\frontend\src\domains\quotes\__tests__\quote-stats.test.ts
  2:1  warning  `@/shared/types` type import should occur before import of `../utils/quote-stats`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteCharts.tsx
  4:1  warning  `recharts` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteConvertDialog.tsx
   4:1  warning  `../hooks/useQuotes` import should occur after import of `@/domains/tasks`  import/order
   5:1  warning  `@/components/ui/button` import should occur after import of `sonner`       import/order
   6:1  warning  `@/components/ui/input` import should occur after import of `sonner`        import/order
   7:1  warning  `@/components/ui/label` import should occur after import of `sonner`        import/order
   8:1  warning  `@/components/ui/checkbox` import should occur after import of `sonner`     import/order
   9:1  warning  `@/components/ui/scroll-area` import should occur after import of `sonner`  import/order
  10:1  warning  `@/components/ui/dialog` import should occur after import of `sonner`       import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteDetailPageContent.tsx
  22:1  warning  `./QuoteConvertDialog` import should occur after import of `@/shared/ui/animations/FadeIn`              import/order
  25:1  warning  `./QuoteStatusBadge` import should occur after import of `@/shared/ui/animations/FadeIn`                import/order
  26:1  warning  `./QuoteWorkflowPanel` import should occur after import of `@/shared/ui/animations/FadeIn`              import/order
  27:1  warning  `../utils/formatting` import should occur after import of `@/shared/ui/animations/FadeIn`               import/order
  28:1  warning  `../hooks/useQuoteDetailPage` import should occur after import of `@/shared/ui/animations/FadeIn`       import/order
  29:1  warning  `../hooks/useQuoteDetailPage` type import should occur after import of `@/shared/ui/animations/FadeIn`  import/order
  30:1  warning  `@/shared/ui/layout/PageShell` import should occur after import of `sonner`                             import/order
  31:1  warning  `@/shared/ui` import should occur after import of `sonner`                                              import/order
  32:1  warning  `@/components/ui/tabs` import should occur after import of `sonner`                                     import/order
  33:1  warning  `@/components/ui/button` import should occur after import of `sonner`                                   import/order
  34:1  warning  `@/components/ui/input` import should occur after import of `sonner`                                    import/order
  35:1  warning  `@/components/ui/label` import should occur after import of `sonner`                                    import/order
  36:1  warning  `@/components/ui/textarea` import should occur after import of `sonner`                                 import/order
  37:1  warning  `@/components/ui/card` import should occur after import of `sonner`                                     import/order
  38:1  warning  `@/components/ui/dropdown-menu` import should occur after import of `sonner`                            import/order
  45:1  warning  `@/components/ui/alert-dialog` import should occur after import of `sonner`                             import/order
  55:1  warning  `@/components/ui/badge` import should occur after import of `sonner`                                    import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteDocumentsManager.tsx
   7:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`                        import/order
  16:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/quotes/hooks/useQuotes`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteImagesManager.tsx
   8:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`                                import/order
  12:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/quotes/utils/image-compression`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteLaborSection.tsx
  7:1  warning  `@/lib/format` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuotePartsSection.tsx
  7:1  warning  `@/lib/format` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteStatusBadge.tsx
  6:1  warning  `@/lib/utils` import should occur before type import of `@/types/quote.types`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuoteTotalsCard.tsx
  14:1  warning  `lucide-react` import should occur before import of `@/lib/format`  import/order

D:\rpma-rust\frontend\src\domains\quotes\components\QuotesStatusTabs.tsx
  5:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useNewQuotePage.ts
  7:1  warning  `@/domains/clients` import should occur before import of `./useQuotes`    import/order
  8:1  warning  `@/domains/auth` import should occur before import of `./useQuotes`       import/order
  9:1  warning  `@/shared/types` type import should occur before import of `./useQuotes`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuoteAttachments.ts
  2:1  warning  `@/domains/auth` import should occur after import of `@/types/utility.types`                   import/order
  3:1  warning  `@/domains/quotes/ipc/quotes.ipc` import should occur after import of `@/types/utility.types`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuoteDetailPage.ts
  17:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuoteItems.ts
  4:1  warning  `@/types/json` type import should occur before import of `@/domains/auth`         import/order
  5:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuoteOperations.ts
  4:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuoteStatus.ts
  4:1  warning  `@/types/quote.types` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuotesCrud.ts
  2:1  warning  `@/domains/auth` import should occur after import of `@/types/utility.types`                   import/order
  3:1  warning  `@/domains/quotes/ipc/quotes.ipc` import should occur after import of `@/types/utility.types`  import/order

D:\rpma-rust\frontend\src\domains\quotes\hooks\useQuotesPage.ts
  4:1  warning  `@/domains/auth` import should occur after type import of `@/types/client.types`                               import/order
  5:1  warning  `./useQuotes` import should occur after type import of `@/types/client.types`                                  import/order
  7:1  warning  `../services/quote-client-enrichment.service` import should occur after type import of `@/types/client.types`  import/order

D:\rpma-rust\frontend\src\domains\quotes\services\quote-client-enrichment.service.ts
  2:1  warning  `@/types/client.types` type import should occur before import of `@/domains/clients`  import/order

D:\rpma-rust\frontend\src\domains\reports\components\ReportPreviewPanel.tsx
  12:1  warning  `../services/report-view-model.types` type import should occur before import of `./preview/ReportPreviewMeta`  import/order

D:\rpma-rust\frontend\src\domains\reports\components\preview\ReportPreviewStepsList.tsx
  4:1  warning  `../../services/report-view-model.types` type import should occur before import of `./ReportPreviewStepCard`  import/order

D:\rpma-rust\frontend\src\domains\reports\hooks\__tests__\useInterventionReport.test.tsx
  5:1  warning  `sonner` import should occur before import of `../useInterventionReport`  import/order

D:\rpma-rust\frontend\src\domains\reports\hooks\useInterventionReport.ts
  4:1  warning  `@/lib/query-keys` import should occur before import of `../ipc/reports.ipc`  import/order

D:\rpma-rust\frontend\src\domains\reports\hooks\useInterventionReportPreview.ts
  6:1  warning  `@/lib/query-keys` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\reports\services\__tests__\buildInterventionReportViewModel.test.ts
  3:1  warning  `@/domains/interventions` type import should occur before import of `../buildInterventionReportViewModel`  import/order

D:\rpma-rust\frontend\src\domains\settings\api\useSettings.ts
  6:1  warning  `@/lib/backend` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\AccessibilityTab.tsx
   9:1  warning  `react-hook-form` import should occur before import of `@/components/ui/card`          import/order
  10:1  warning  `@hookform/resolvers/zod` import should occur before import of `@/components/ui/card`  import/order
  11:1  warning  `zod` import should occur before import of `@/components/ui/card`                      import/order
  12:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`             import/order
  28:1  warning  `@/lib/logging/types` import should occur before import of `@/components/ui/card`      import/order
  29:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/card`                import/order
  30:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`            import/order

D:\rpma-rust\frontend\src\domains\settings\components\NotificationSections.tsx
   7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`          import/order
  17:1  warning  `react-hook-form` type import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\NotificationsTab.tsx
   7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  15:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\PerformanceTab.tsx
  11:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  26:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\PreferencesTab.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`   import/order
  8:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\ProfileSettingsTab.tsx
  11:1  warning  `react-hook-form` import should occur before import of `@/components/ui/card`                     import/order
  12:1  warning  `@hookform/resolvers/zod` import should occur before import of `@/components/ui/card`             import/order
  13:1  warning  `zod` import should occur before import of `@/components/ui/card`                                 import/order
  14:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`                        import/order
  18:1  warning  `@/lib/logging/types` import should occur before import of `@/components/ui/card`                 import/order
  19:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/card`                           import/order
  20:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`                       import/order
  22:1  warning  `@/lib/validation/settings-schemas` import should occur before import of `@/components/ui/card`   import/order
  26:1  warning  `@/lib/utils/settings-error-handler` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\SecurityTab.tsx
  11:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  25:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\SettingsPageContent.tsx
   9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`               import/order
  22:1  warning  `@/shared/ui/layout/PageShell` import should occur before import of `@/domains/auth`     import/order
  23:1  warning  `@/shared/ui/layout/LoadingState` import should occur before import of `@/domains/auth`  import/order
  24:1  warning  `@/components/ui/page-header` import should occur before import of `@/domains/auth`      import/order
  25:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `@/domains/auth`    import/order

D:\rpma-rust\frontend\src\domains\settings\components\__tests__\PerformanceTab.payload.test.tsx
  3:1  warning  `@/lib/backend` type import should occur before import of `../PerformanceTab`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\__tests__\PreferencesTab.payload.test.tsx
  3:1  warning  `@/lib/backend` type import should occur before import of `../PreferencesTab`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\__tests__\SecurityTab.contract.test.tsx
  3:1  warning  `@/lib/backend` type import should occur before import of `../SecurityTab`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\__tests__\SecurityTab.error.test.tsx
  3:1  warning  `@/lib/backend` type import should occur before import of `../SecurityTab`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\preferences\AccessibilitySection.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\preferences\DisplaySection.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\preferences\NotificationsSection.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\preferences\PerformanceSection.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\settings\components\useNotificationSettings.ts
   7:1  warning  `@/shared/hooks/useLogger` import should occur after type import of `@/lib/backend`  import/order
  14:3  warning  'sessionToken' is defined but never used. Allowed unused args must match /^_/u       @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\settings\hooks\usePerformanceSettings.ts
  7:1  warning  `@/shared/hooks/useLogger` import should occur after type import of `@/lib/backend`  import/order
  9:1  warning  `../ipc/settings.ipc` import should occur after type import of `@/lib/backend`       import/order

D:\rpma-rust\frontend\src\domains\settings\hooks\usePreferencesForm.ts
  5:1  warning  `@/shared/hooks/useLogger` import should occur after import of `@/lib/utils/settings-error-handler`  import/order

D:\rpma-rust\frontend\src\domains\settings\hooks\useSecuritySettings.ts
   8:1  warning  `@/lib/logging/types` import should occur before import of `@/shared/hooks/useLogger`  import/order
  10:1  warning  `@/lib/backend` type import should occur before import of `@/shared/hooks/useLogger`   import/order

D:\rpma-rust\frontend\src\domains\settings\services\configuration.service.ts
   43:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   66:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   82:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  108:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  142:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  164:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  189:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  208:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  261:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  282:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  315:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  380:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  405:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\settings\services\settings-client.service.ts
  11:1  warning  `@/lib/backend` type import should occur before import of `./settings.service`  import/order

D:\rpma-rust\frontend\src\domains\settings\services\settings.service.ts
    3:1   warning  `@/lib/backend` type import should occur before type import of `@/types/json`                import/order
    5:3   warning  'UserPreferences' is defined but never used. Allowed unused vars must match /^_/u            @typescript-eslint/no-unused-vars
    6:3   warning  'UserNotificationSettings' is defined but never used. Allowed unused vars must match /^_/u   @typescript-eslint/no-unused-vars
    7:3   warning  'UserAccessibilitySettings' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
    8:3   warning  'UserPerformanceSettings' is defined but never used. Allowed unused vars must match /^_/u    @typescript-eslint/no-unused-vars
    9:3   warning  'UserProfileSettings' is defined but never used. Allowed unused vars must match /^_/u        @typescript-eslint/no-unused-vars
   98:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
  190:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
  222:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\sync\components\EntitySyncIndicator.tsx
  2:1  warning  `..` import should occur after import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\domains\sync\components\SyncIndicator.tsx
  3:1  warning  `..` import should occur after import of `@/shared/hooks/useTranslation`  import/order

D:\rpma-rust\frontend\src\domains\sync\hooks\useEntitySyncStatus.ts
  2:1  warning  `./useSyncStatus` import should occur after import of `../services`  import/order

D:\rpma-rust\frontend\src\domains\sync\hooks\useOfflineActions.ts
  6:1  warning  `@/types/task.types` import should occur before import of `@/domains/tasks`  import/order

D:\rpma-rust\frontend\src\domains\sync\hooks\useRealTimeUpdates.ts
  2:1  warning  `@/lib/websocket` import should occur after import of `sonner`             import/order
  3:1  warning  `@/domains/tasks` import should occur after type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\domains\sync\hooks\useSyncStatus.ts
  2:1  warning  `react` import should occur before import of `@tanstack/react-query`  import/order

D:\rpma-rust\frontend\src\domains\tasks\__tests__\TaskProvider.test.tsx
  4:1  warning  `@/types/task.types` type import should occur before import of `../api/TaskProvider`  import/order

D:\rpma-rust\frontend\src\domains\tasks\__tests__\useTasks.integration.test.tsx
  4:1  warning  `@/types/task.types` type import should occur before import of `../api/useTasks`  import/order

D:\rpma-rust\frontend\src\domains\tasks\api\TaskProvider.tsx
  5:1  warning  `./types` type import should occur after import of `../services/task.service`  import/order

D:\rpma-rust\frontend\src\domains\tasks\api\taskGateway.ts
  3:1  warning  `@/lib/ipc/status` import should occur before import of `../services/task.service`    import/order
  4:1  warning  `@/types/json` type import should occur before import of `../services/task.service`   import/order
  5:1  warning  `@/lib/backend` type import should occur before import of `../services/task.service`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\FilterDrawer.tsx
  22:1  warning  `@/lib/design-tokens` import should occur before import of `@/components/ui/button`  import/order
  23:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/button`   import/order

D:\rpma-rust\frontend\src\domains\tasks\components\QuickAddDialog.tsx
   9:1  warning  `@/lib/design-tokens` import should occur before import of `@/components/ui/dialog`  import/order
  13:1  warning  `@/lib/backend` type import should occur before import of `@/components/ui/dialog`   import/order
  14:1  warning  `date-fns` import should occur before import of `@/components/ui/dialog`             import/order
  15:1  warning  `sonner` import should occur before import of `@/components/ui/dialog`               import/order

D:\rpma-rust\frontend\src\domains\tasks\components\SignatureCapture.tsx
  7:1  warning  `lucide-react` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\StatusColumn.tsx
  4:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\ActionButtons.tsx
   9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`          import/order
  21:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/card`           import/order
  25:1  warning  `@/lib/enhanced-toast` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\ActionsCard.tsx
  18:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/select`    import/order
  19:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/select`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\DelayTaskModal.tsx
   7:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/dialog`          import/order
   9:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/dialog`              import/order
  10:1  warning  `@tanstack/react-query` import should occur before import of `@/components/ui/dialog`  import/order
  11:1  warning  `@/components/ui/loading` import should occur before import of `@/domains/auth`        import/order
  12:1  warning  `@/lib/enhanced-toast` import should occur before import of `@/components/ui/dialog`   import/order
  13:1  warning  `@/lib/query-keys` import should occur before import of `@/components/ui/dialog`       import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\DelegatedActionCard.tsx
  3:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/badge`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\DelegatedTaskActionPanel.tsx
  17:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\EditTaskModal.tsx
   9:1  warning  `@/lib/backend` import should occur before type import of `@/types/json`          import/order
  11:1  warning  `@/lib/ipc` import should occur before type import of `@/types/json`              import/order
  12:1  warning  `@tanstack/react-query` import should occur before type import of `@/types/json`  import/order
  13:1  warning  `@/components/ui/loading` import should occur before import of `@/domains/auth`   import/order
  14:1  warning  `@/lib/enhanced-toast` import should occur before type import of `@/types/json`   import/order
  15:1  warning  `@/lib/query-keys` import should occur before type import of `@/types/json`       import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\ManagedTaskActionPanel.tsx
  18:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/select`    import/order
  19:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/select`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\PrimaryActionButton.tsx
  4:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/button`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\PrioritySelector.tsx
  3:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/select`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\ReportIssueModal.tsx
   7:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/dialog`          import/order
   9:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/dialog`              import/order
  10:1  warning  `@tanstack/react-query` import should occur before import of `@/components/ui/dialog`  import/order
  11:1  warning  `@/components/ui/loading` import should occur before import of `@/domains/auth`        import/order
  12:1  warning  `@/lib/enhanced-toast` import should occur before import of `@/components/ui/dialog`   import/order
  13:1  warning  `@/lib/query-keys` import should occur before import of `@/components/ui/dialog`       import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\SendMessageModal.tsx
   7:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/dialog`          import/order
   9:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/dialog`              import/order
  10:1  warning  `@tanstack/react-query` import should occur before import of `@/components/ui/dialog`  import/order
  11:1  warning  `@/components/ui/loading` import should occur before import of `@/domains/auth`        import/order
  12:1  warning  `@/lib/enhanced-toast` import should occur before import of `@/components/ui/dialog`   import/order
  13:1  warning  `@/lib/query-keys` import should occur before import of `@/components/ui/dialog`       import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\__tests__\EditTaskModal.test.tsx
  4:1  warning  `@/lib/backend` type import should occur before import of `../EditTaskModal`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskActions\useTaskActions.ts
   2:1  warning  `next/navigation` import should occur before import of `@tanstack/react-query`   import/order
   5:1  warning  `sonner` import should occur before import of `@/lib/backend`                    import/order
   7:1  warning  `@/domains/auth` import should occur before import of `../../services`           import/order
   8:1  warning  `@/domains/interventions` import should occur before import of `../../services`  import/order
   9:1  warning  `@/lib/utils/phone` import should occur before import of `@/types/task.types`    import/order
  11:1  warning  `@/lib/query-keys` import should occur before import of `@/types/task.types`     import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskAttachments.tsx
  4:1  warning  `@/domains/auth` import should occur before import of `./TaskPhotos`         import/order
  5:1  warning  `@/lib/ipc` import should occur before import of `./TaskPhotos`              import/order
  6:1  warning  `@tanstack/react-query` import should occur before import of `./TaskPhotos`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskChecklist.tsx
  5:1  warning  `@/types/task.types` import should occur before import of `./TaskInfo/ChecklistView`  import/order
  6:1  warning  `@/lib/backend` import should occur before import of `./TaskInfo/ChecklistView`       import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\PhotoSummaryCard.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  6:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\PoseDetail.tsx
   3:1  warning  `@/shared/types` import should occur after import of `sonner`                            import/order
   4:1  warning  `@/lib/backend` type import should occur after import of `sonner`                        import/order
   5:1  warning  `@/domains/interventions` import should occur after import of `sonner`                   import/order
   6:1  warning  `@/domains/interventions` import should occur after import of `sonner`                   import/order
   8:1  warning  `@/shared/utils` import should occur after import of `sonner`                            import/order
  11:1  warning  `@/shared/ui` import should occur after import of `sonner`                               import/order
  15:1  warning  `@/shared/hooks/useIntersectionObserver` import should occur after import of `sonner`    import/order
  17:1  warning  `@/shared/hooks/useDebounce` import should occur after import of `sonner`                import/order
  18:1  warning  `../../services/task.service` import should occur after import of `@/domains/auth`       import/order
  25:1  warning  `./WorkflowStatusCard` import should occur after import of `../TaskActions/ActionsCard`  import/order
  26:1  warning  `./PhotoSummaryCard` import should occur after import of `../TaskActions/ActionsCard`    import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\PoseDetailSkeleton.tsx
  3:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/skeleton`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\StatusBadge.tsx
  3:1  warning  `@/lib/utils` import should occur before import of `@/components/ui/badge`   import/order
  4:1  warning  `lucide-react` import should occur before import of `@/components/ui/badge`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\StepContent.tsx
   9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`   import/order
  19:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\TaskStepperBand.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetail\WorkflowStatusCard.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskDetails.tsx
   5:1  warning  `lucide-react` import should occur before import of `@/shared/ui`                       import/order
   7:1  warning  `@/lib/backend` type import should occur before import of `@/shared/ui`                 import/order
  11:1  warning  `@/lib/query-keys` import should occur before import of `@/shared/ui`                   import/order
  13:1  warning  `../hooks/useTasks` import should occur before import of `./TaskChecklist`              import/order
  14:1  warning  `@/domains/auth` import should occur before import of `./TaskChecklist`                 import/order
  15:1  warning  `../services/task.service` import should occur before import of `./TaskChecklist`       import/order
  16:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `./TaskChecklist`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskForm\TaskFormSubmission.tsx
  3:1  warning  `@/domains/auth` import should occur after import of `@/lib/logging/types`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskForm\TaskFormWizard.tsx
  6:1  warning  `lucide-react` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskForm\steps\CustomerStep.tsx
  20:1  warning  `@/lib/backend` import should occur before import of `../types`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskForm\useTaskForm.ts
  5:1  warning  `./types` import should occur after import of `@/lib/utils/validation-utils`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskHistory.tsx
  4:1  warning  `lucide-react` import should occur before import of `@/components/ui/skeleton`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskListCard.tsx
  10:1  warning  `@/shared/ui/facade` import should occur before import of `@/domains/tasks/utils/display`  import/order
  25:1  warning  `@/shared/utils` import should occur before import of `@/domains/tasks/utils/display`      import/order
  27:1  warning  `@/lib/ipc` import should occur before type import of `@/types/task.types`                 import/order
  28:1  warning  `@/lib/query-keys` import should occur before type import of `@/types/task.types`          import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskListTable.tsx
  10:1  warning  `@/shared/ui/facade` import should occur before import of `@/domains/tasks/utils/display`  import/order
  24:1  warning  `@/shared/utils` import should occur before import of `@/domains/tasks/utils/display`      import/order
  26:1  warning  `@/lib/ipc` import should occur before type import of `@/types/task.types`                 import/order
  27:1  warning  `@/lib/query-keys` import should occur before type import of `@/types/task.types`          import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskManager.tsx
    7:1  warning  `@/components/ui/confirm-dialog` import should occur after import of `@/lib/logging/types`                          import/order
    8:1  warning  `@/shared/ui` import should occur after import of `@/lib/logging/types`                                             import/order
    9:1  warning  `@/types` import should occur after import of `@/lib/logging/types`                                                 import/order
  213:6  warning  React Hook useCallback has a missing dependency: 'user?.user_id'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\rpma-rust\frontend\src\domains\tasks\components\TaskOverview\TaskOverview.tsx
   4:1  warning  `@/components/ui/badge` import should occur after import of `@/lib/backend`  import/order
  16:1  warning  `@/types/task.types` import should occur after import of `@/lib/backend`     import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskOverview\TechnicalDetailsCard.tsx
  4:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskOverview\VehicleInfoCard.tsx
  4:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TaskPhotos.tsx
   3:1  warning  `@tanstack/react-query` import should occur before import of `@/lib/accessibility.ts`  import/order
   8:1  warning  `next/image` import should occur before import of `@/lib/accessibility.ts`             import/order
   9:1  warning  `@/lib/ipc` import should occur before import of `@/components/ui/button`              import/order
  11:1  warning  `@/shared/utils` import should occur before import of `@/domains/auth`                 import/order
  12:1  warning  `@/lib/query-keys` import should occur before import of `@/components/ui/button`       import/order
  14:1  warning  `lucide-react` import should occur before import of `@/lib/accessibility.ts`           import/order
  15:1  warning  `@/lib/backend` import should occur before import of `@/components/ui/button`          import/order

D:\rpma-rust\frontend\src\domains\tasks\components\TasksPageContent.tsx
  11:1  warning  `@/shared/ui/facade` import should occur before import of `@/domains/tasks/utils/display`  import/order
  20:1  warning  `@/shared/utils` import should occur before import of `@/domains/tasks/utils/display`      import/order

D:\rpma-rust\frontend\src\domains\tasks\components\WorkflowProgressCard.tsx
  9:1  warning  `lucide-react` import should occur before import of `@/components/ui/card`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\__tests__\TaskDetails.test.tsx
  7:1  warning  `@/shared/types` import should occur before import of `../../services/task.service`  import/order
  8:1  warning  `date-fns` import should occur before import of `../../services/task.service`        import/order

D:\rpma-rust\frontend\src\domains\tasks\components\__tests__\TaskManager.test.tsx
  5:1  warning  `@/lib/ipc` import should occur before import of `../TaskManager`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\__tests__\WorkflowProgressCard.integration.test.tsx
  3:1  warning  `@/lib/ipc/client` import should occur before import of `../WorkflowProgressCard`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\__tests__\WorkflowProgressCard.test.tsx
  4:1  warning  `@/lib/ipc/client` import should occur before import of `../WorkflowProgressCard`  import/order

D:\rpma-rust\frontend\src\domains\tasks\components\completed\CompletedTaskPageContent.tsx
  12:1  warning  `lucide-react` import should occur before import of `@/shared/utils/media`                         import/order
  20:1  warning  `@/components/ui/card` import should occur before import of `./CompletedActionBar`                 import/order
  27:1  warning  `@/components/ui/separator` import should occur before import of `./CompletedActionBar`            import/order
  28:1  warning  `lucide-react` import should occur before import of `@/shared/utils/media`                         import/order
  40:1  warning  `@/shared/hooks` import should occur before import of `./CompletedActionBar`                       import/order
  41:1  warning  `../../hooks/useCompletedTaskPage` import should occur before import of `./CompletedActionBar`     import/order
  42:1  warning  `@/shared/types/inventory.types` type import should occur before import of `./CompletedActionBar`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useCompletedTaskPage.ts
   5:1  warning  `@/shared/hooks` import should occur after import of `@/lib/query-keys`                           import/order
   6:1  warning  `@/domains/interventions` import should occur after type import of `@/types/task.types`           import/order
  14:1  warning  `@/shared/types` type import should occur after import of `@/lib/query-keys`                      import/order
  16:1  warning  `@/shared/types/inventory.types` type import should occur after import of `@/lib/query-keys`      import/order
  18:1  warning  `../services/completed-task-report.service` import should occur after import of `@/domains/auth`  import/order
  19:1  warning  `@/domains/interventions` import should occur after type import of `@/types/task.types`           import/order
  21:1  warning  `./useNormalizedTask` import should occur after import of `@/domains/auth`                        import/order
  22:1  warning  `../api/taskGateway` import should occur after import of `@/domains/auth`                         import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useEditTaskPage.ts
  8:1  warning  `@/shared/hooks` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTaskActions.ts
  2:1  warning  `@/lib/backend` import should occur after import of `sonner`                              import/order
  3:1  warning  `../services/task.service` import should occur after type import of `@/types/task.types`  import/order
  4:1  warning  `@/lib/api-error` import should occur after import of `sonner`                            import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTaskDetailPage.ts
  5:1  warning  `@/shared/hooks` import should occur before import of `@/domains/auth`  import/order
  8:1  warning  `@/shared/utils` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTaskStatus.ts
  4:1  warning  `@/lib/backend` type import should occur before import of `../ipc/task.ipc`  import/order
  5:1  warning  `sonner` import should occur before import of `@/lib/ipc/status`             import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTaskSync.ts
  3:1  warning  `../services/task.service` import should occur after type import of `@/types/task.types`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTasks.ts
  6:1  warning  `@/lib/backend` type import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useTasksPage.ts
   8:1  warning  `@/shared/utils` import should occur before import of `@/domains/tasks/api/taskGateway`  import/order
  11:1  warning  `@/shared/hooks` import should occur before import of `@/domains/tasks/api/taskGateway`  import/order

D:\rpma-rust\frontend\src\domains\tasks\hooks\useWorkflowActions.ts
  6:1  warning  `@/lib/ipc/client` import should occur before import of `@/domains/auth`  import/order
  7:1  warning  `next/navigation` import should occur before import of `sonner`           import/order

D:\rpma-rust\frontend\src\domains\tasks\ipc\task.ipc.ts
  11:1  warning  `@/lib/backend` type import should occur before type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\domains\tasks\services\completed-task-report.service.ts
  4:1  warning  `@/lib/query-keys` import should occur before import of `@/domains/documents`  import/order

D:\rpma-rust\frontend\src\domains\tasks\services\task-csv.service.ts
  2:1  warning  `@/shared/utils` import should occur before import of `../api/taskGateway`  import/order

D:\rpma-rust\frontend\src\domains\tasks\services\task-history.service.ts
  56:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\tasks\services\task-workflow-sync.service.ts
   5:1   warning  `@/lib/secureStorage` import should occur before type import of `@/types/task.types`     import/order
  39:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  94:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\tasks\services\task.service.ts
  5:1  warning  `@/domains/interventions` import should occur before import of `../ipc/task.ipc`               import/order
  6:1  warning  `@/lib/secureStorage` import should occur before type import of `@/types/task.types`           import/order
  7:1  warning  `@/lib/validation/api-schemas` import should occur before type import of `@/types/task.types`  import/order

D:\rpma-rust\frontend\src\domains\users\api\useUserActions.ts
  4:1  warning  `@/domains/auth` import should occur after type import of `@/lib/backend`  import/order

D:\rpma-rust\frontend\src\domains\users\api\useUsers.ts
  5:1  warning  `@/lib/ipc` import should occur before import of `@/domains/auth`  import/order

D:\rpma-rust\frontend\src\domains\users\components\ChangeRoleDialog.tsx
  9:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../api/useUserActions`  import/order

D:\rpma-rust\frontend\src\domains\users\components\UserForm.tsx
  7:1  warning  `@/shared/hooks/useTranslation` import should occur before import of `../api/useUserActions`  import/order

D:\rpma-rust\frontend\src\domains\users\components\__tests__\UserForm.test.tsx
  6:1  warning  `@/types` import should occur before import of `../UserForm`  import/order

D:\rpma-rust\frontend\src\domains\users\hooks\useUserList.ts
  4:1  warning  `@/domains/auth` import should occur after type import of `@/types`  import/order
  5:1  warning  `../services` import should occur after type import of `@/types`     import/order

D:\rpma-rust\frontend\src\domains\users\hooks\useUsersPage.ts
  5:1  warning  `@/domains/auth` import should occur before import of `../hooks/useUserList`       import/order
  6:1  warning  `@/shared/types` type import should occur before import of `../hooks/useUserList`  import/order

D:\rpma-rust\frontend\src\domains\users\server\services\auth.service.ts
   3:1   warning  `@/lib/backend` type import should occur before type import of `@/types`  import/order
  47:23  warning  'token' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  59:32  warning  'token' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\users\server\services\user.service.ts
    1:1   warning  `@/types/unified.types` import should occur after type import of `@/lib/backend`  import/order
   41:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   72:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  149:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  166:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\users\services\technician.service.ts
  42:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  56:13  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\domains\users\services\user.service.ts
    3:1   warning  `@/types/unified.types` import should occur after type import of `@/lib/backend`         import/order
   26:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   55:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   78:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  105:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  122:13  warning  'sessionToken' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\error-boundaries\GlobalErrorBoundary.tsx
  4:1  warning  `./BaseErrorBoundary` import should occur after import of `@/lib/logging/types`         import/order
  6:1  warning  `@/components/ui/button` import should occur after import of `@/lib/logging/types`      import/order
  7:1  warning  `@/components/ui/card` import should occur after import of `@/lib/logging/types`        import/order
  8:1  warning  `@/types/utility.types` type import should occur after import of `@/lib/logging/types`  import/order
  9:1  warning  `@/types/type-utils` import should occur after import of `@/lib/logging/types`          import/order

D:\rpma-rust\frontend\src\error-boundaries\TaskErrorBoundary.tsx
  4:1  warning  `./BaseErrorBoundary` import should occur after import of `@/types/type-utils`  import/order
  5:1  warning  `lucide-react` import should occur after import of `next/navigation`            import/order
  6:1  warning  `@/components/ui/button` import should occur after import of `next/navigation`  import/order

D:\rpma-rust\frontend\src\error-boundaries\WorkflowErrorBoundary.tsx
  4:1  warning  `./BaseErrorBoundary` import should occur after import of `@/components/ui/alert`  import/order

D:\rpma-rust\frontend\src\lib\backend\calendar.ts
  3:15  warning  'Task' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  3:21  warning  'TaskPriority' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  3:35  warning  'TaskStatus' is defined but never used. Allowed unused vars must match /^_/u    @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\lib\enhanced-toast.ts
  2:1  warning  `react` import should occur before import of `sonner`  import/order

D:\rpma-rust\frontend\src\lib\ipc\__tests__\auth-ipc-contract.test.ts
  2:1  warning  `@/lib/validation/ipc-schemas` import should occur before import of `../client`  import/order

D:\rpma-rust\frontend\src\lib\ipc\__tests__\inventory-ipc-contract-new.test.ts
  8:1  warning  `@/lib/ipc/core` import should occur before import of `@/domains/inventory/server`  import/order

D:\rpma-rust\frontend\src\lib\ipc\cache.ts
  2:1  warning  `@/types/json` type import should occur before import of `./utils`  import/order

D:\rpma-rust\frontend\src\lib\ipc\client.ts
    2:1  warning  `./utils` import should occur after import of `@/lib/validation/backend-type-guards`                import/order
    3:1  warning  `./cache` import should occur after import of `@/lib/validation/backend-type-guards`                import/order
    6:1  warning  `@/types/json` type import should occur after import of `@/lib/validation/backend-type-guards`      import/order
  178:1  warning  `@/types/calendar` type import should occur after import of `@/lib/validation/backend-type-guards`  import/order
  227:7  warning  'getUserSettingsCacheKey' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\lib\ipc\core\response-handlers.ts
  2:1  warning  `@/types/json` type import should occur before type import of `./types`  import/order

D:\rpma-rust\frontend\src\lib\ipc\domains\clients.ts
   6:1  warning  `@/lib/data-freshness` import should occur before import of `../utils`                  import/order
   7:1  warning  `@/lib/validation/backend-type-guards` import should occur before import of `../utils`  import/order
  13:1  warning  `@/types/json` type import should occur before import of `../utils`                     import/order

D:\rpma-rust\frontend\src\lib\ipc\domains\security.ts
  3:1  warning  `@/types/json` type import should occur before import of `../core`  import/order

D:\rpma-rust\frontend\src\lib\ipc\domains\system.ts
  3:1  warning  `@/types/json` type import should occur before import of `../core`  import/order

D:\rpma-rust\frontend\src\lib\ipc\message.ts
  1:1  warning  `./utils` import should occur after type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\lib\ipc\mock\mock-controls.ts
  3:1  warning  `@/types/json` type import should occur before import of `./mock-db`  import/order

D:\rpma-rust\frontend\src\lib\ipc\notification.ts
  1:1  warning  `./utils` import should occur after type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\lib\ipc\real-adapter.ts
  9:1  warning  `@/types/json` type import should occur before import of `./utils`  import/order

D:\rpma-rust\frontend\src\lib\ipc\status.ts
  3:1  warning  `@/lib/backend` type import should occur before import of `./utils`  import/order

D:\rpma-rust\frontend\src\lib\ipc\utils.ts
  2:1  warning  `./metrics` import should occur after type import of `@/types/json`         import/order
  3:1  warning  `../logging` import should occur after type import of `@/types/json`        import/order
  4:1  warning  `../logging/types` import should occur after type import of `@/types/json`  import/order

D:\rpma-rust\frontend\src\lib\ipc\utils\crud-helpers.ts
  2:1  warning  `@/types/json` type import should occur before import of `../core`  import/order

D:\rpma-rust\frontend\src\lib\middleware\auth.middleware.ts
  25:11  warning  'token' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

D:\rpma-rust\frontend\src\lib\types\type-validators.ts
  2:1  warning  `@/lib/backend` type import should occur before import of `./api-types`  import/order

D:\rpma-rust\frontend\src\lib\utils\error-handler.ts
  3:1  warning  `../logging/types` import should occur before import of `./logger`  import/order

D:\rpma-rust\frontend\src\lib\validation\type-guard-utils.ts
  8:1  warning  `./backend-type-guards` import should occur after type import of `@/lib/types`  import/order

D:\rpma-rust\frontend\src\lib\websocket.ts
  8:1  warning  `react` import should occur before import of `./logging`  import/order

D:\rpma-rust\frontend\src\shared\components\MetricStatCard.tsx
  2:1  warning  `react` import should occur before import of `lucide-react`  import/order

D:\rpma-rust\frontend\src\shared\hooks\useAdvancedFiltering.ts
  16:1  warning  `@/lib/backend` import should occur before import of `@/shared/utils/filter-engine`  import/order

D:\rpma-rust\frontend\src\shared\hooks\useMenuEvents.ts
  3:1  warning  `next/navigation` import should occur before import of `@tauri-apps/api/event`  import/order

D:\rpma-rust\frontend\src\shared\ui\layout\ErrorState.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\shared\ui\layout\LoadingState.tsx
  5:1  warning  `lucide-react` import should occur before import of `@/lib/utils`  import/order

D:\rpma-rust\frontend\src\types\task.types.ts
  8:1  warning  `@/lib/backend` type import should occur before type import of `./photo.types`  import/order

✖ 770 problems (0 errors, 770 warnings)
  0 errors and 657 warnings potentially fixable with the `--fix` option.


emaMA@LAPTOP-76DN517M MINGW64 /d/rpma-rust/frontend (fix-fonction)
$

# Audit /configuration

## 1. Verdict exécutif

- **La page est :** partiellement connectée mais avec persistance INCOMPLÈTE
- **Niveau de complétude estimé :** 40%
- **Risque principal :** Les configurations système (app settings) ne sont PAS persistées en base de données - elles sont stockées uniquement en mémoire (Mutex) et perdues au redémarrage
- **Blocage principal :** Aucune table SQLite pour les paramètres système globaux - seuls les user_settings sont persistés

### Distinction critique /configuration vs /settings

| Route | Type | Persistance | Usage |
|-------|------|-------------|-------|
| `/configuration` | Admin système | **EN MÉMOIRE SEULEMENT** ⚠️ | Configuration globale de l'application |
| `/settings/*` | Utilisateur | SQLite `user_settings` | Préférences individuelles |

---

## 2. Cartographie technique

| Zone | Fichier | Rôle | Existe ? | Branché ? | Remarques |
|------|---------|------|----------|-----------|-----------|
| **Route** | `frontend/src/app/configuration/page.tsx` | Page Next.js | ✅ | ✅ | Importe `ConfigurationPageContent` du domaine admin |
| **Layout** | `frontend/src/app/settings/layout.tsx` | Layout settings | ✅ | ✅ | Navigation entre onglets settings |
| **Components** | `frontend/src/domains/admin/components/ConfigurationPageContent.tsx` | Container principal | ✅ | ✅ | 6 onglets : System, Business, Security, Integrations, Performance, Monitoring |
| **Components** | `frontend/src/domains/admin/components/SystemSettingsTab.tsx` | Paramètres système | ✅ | ✅ | Utilise `settingsOperations.getAppSettings()` |
| **Components** | `frontend/src/domains/admin/components/BusinessRulesTab.tsx` | Règles métier | ✅ | ✅ | CRUD complet mais persistance en mémoire |
| **Components** | `frontend/src/domains/admin/components/SecurityPoliciesTab.tsx` | Politiques sécurité | ✅ | ✅ | CRUD complet mais persistance en mémoire |
| **Components** | `frontend/src/domains/admin/components/IntegrationsTab.tsx` | Intégrations | ✅ | ✅ | CRUD complet mais persistance en mémoire |
| **Components** | `frontend/src/domains/admin/components/PerformanceTab.tsx` | Performance | ✅ | ✅ | Utilise `usePerformanceConfig` |
| **Components** | `frontend/src/domains/admin/components/MonitoringTab.tsx` | Monitoring | ✅ | ✅ | Read-only, utilise `useSystemHealth` |
| **Hooks** | `frontend/src/domains/admin/hooks/useSystemHealth.ts` | Health check | ✅ | ✅ | Appelle `IPC_COMMANDS.HEALTH_CHECK` |
| **Hooks** | `frontend/src/domains/admin/hooks/useBusinessRules.ts` | Gestion règles métier | ✅ | ✅ | Stocke dans `appSettings.business_rules` |
| **Hooks** | `frontend/src/domains/admin/hooks/usePerformanceConfig.ts` | Config performance | ✅ | ✅ | Stocke dans `appSettings.performance_configs` |
| **Store** | `frontend/src/lib/ipc/domains/settings.ts` | Wrapper IPC | ✅ | ✅ | Exporte `settingsOperations` |
| **IPC Wrapper** | `frontend/src/domains/settings/ipc/settings.ipc.ts` | Appels IPC settings | ✅ | ✅ | 20+ méthodes dont `getAppSettings`, `updateGeneralSettings` |
| **API Types** | `frontend/src/domains/settings/api/types.ts` | Types TypeScript | ✅ | ✅ | Types manuels (pas générés depuis Rust) |
| **Commandes Tauri** | `src-tauri/src/domains/settings/ipc/settings/core.rs` | Handler get_app_settings | ✅ | ✅ | Utilise `load_app_settings()` - Mutex en mémoire |
| **Commandes Tauri** | `src-tauri/src/domains/settings/ipc/settings/preferences.rs` | Handler update_general_settings | ✅ | ✅ | Utilise `update_app_settings()` - Mutex en mémoire |
| **Application** | `src-tauri/src/domains/settings/application/` | Services applicatifs | ❌ | N/A | **ABSENT** - pas de couche application |
| **Domain Models** | `src-tauri/src/domains/settings/domain/models/settings.rs` | Modèles Rust | ✅ | ✅ | `AppSettings`, `SystemConfiguration`, `UserSettings` avec ts-rs |
| **Repositories** | `src-tauri/src/domains/settings/infrastructure/settings.rs` | SettingsService | ✅ | ✅ | SQL pour `user_settings`, mais pas pour `app_settings` |
| **Infrastructure** | `src-tauri/src/domains/settings/infrastructure/settings/app_settings.rs` | App settings persistence | ⚠️ | ⚠️ | Seulement `max_tasks_per_user` dans `application_settings` |
| **Facade** | `src-tauri/src/domains/settings/facade.rs` | Facade publique | ✅ | ✅ | Exporte le domaine |
| **Enregistrement** | `src-tauri/src/main.rs:188-204` | Command handlers | ✅ | ✅ | 16 commandes settings enregistrées |
| **Migrations** | `migrations/*.sql` | SQL migrations | ❌ | N/A | **AUCUNE** table `app_settings` ou `system_configuration` |
| **Tables DB** | `user_settings` | SQLite | ✅ | ✅ | Persistance user settings uniquement |
| **Tables DB** | `application_settings` | SQLite | ⚠️ | ⚠️ | Existe mais contient seulement `max_tasks_per_user` |
| **Tables DB** | `settings_audit_log` | SQLite | ✅ | ✅ | Traçabilité des changements |
| **Types générés** | `frontend/src/types/` | Types TS depuis Rust | ❌ | N/A | **NON VÉRIFIÉ** - types manuels utilisés |
| **RBAC** | `src-tauri/src/domains/settings/ipc/settings/core.rs:57-61` | Auth Admin | ✅ | ✅ | Vérifie `UserRole::Admin` pour get_app_settings |
| **Tests** | `src-tauri/src/domains/settings/tests/` | Tests Rust | ✅ | ✅ | Tests unitaires, intégration, validation |

---

## 3. Parcours réels des données

### 3.1 Chargement des paramètres système (SystemSettingsTab)

```
1. UI Event: Mount du composant
   ↓
2. Hook: loadConfigurations() dans SystemSettingsTab.tsx:100
   ↓
3. settingsOperations.getAppSettings(sessionToken)
   ↓
4. IPC Wrapper: settings.ipc.ts:12-15
   ↓
5. safeInvoke(IPC_COMMANDS.GET_APP_SETTINGS, { sessionToken })
   ↓
6. Backend: core.rs:49-67
   ↓
7. load_app_settings() -> Mutex<APP_SETTINGS> (EN MÉMOIRE!)
   ↓
8. Retourne AppSettings::default() si vide
   ↓
9. Frontend: Transforme en SystemConfiguration[]
   ↓
10. Affichage dans les champs de formulaire

Statut: ⚠️ FONCTIONNEL MAIS DONNÉES PERDUES AU REDÉMARRAGE
```

### 3.2 Sauvegarde des paramètres système

```
1. UI Event: Clic "Enregistrer"
   ↓
2. Handler: saveConfigurations() dans SystemSettingsTab.tsx:201
   ↓
3. settingsOperations.updateGeneralSettings(updateRequest, sessionToken)
   ↓
4. IPC Wrapper: settings.ipc.ts:17-22
   ↓
5. safeInvoke(IPC_COMMANDS.UPDATE_GENERAL_SETTINGS, { request })
   ↓
6. Backend: preferences.rs:57-99
   ↓
7. Vérifie rôle Admin (ligne 69)
   ↓
8. load_app_settings() -> Mutex<APP_SETTINGS>
   ↓
9. Update des champs modifiés
   ↓
10. update_app_settings(app_settings) -> Mutex (EN MÉMOIRE!)
   ↓
11. Retourne succès

Statut: ⚠️ SAUVEGARDE TEMPORAIRE - PERDUE AU REDÉMARRAGE
```

### 3.3 Gestion des règles métier (BusinessRulesTab)

```
1. UI Event: CRUD règle métier
   ↓
2. Hook: useBusinessRules.ts:49-67
   ↓
3. settingsOperations.getAppSettings() / updateGeneralSettings()
   ↓
4. Stockage dans appSettings.business_rules (EN MÉMOIRE!)
   ↓
5. Transformation BusinessRule[] <-> JsonValue

Statut: ⚠️ FONCTIONNEL MAIS DONNÉES PERDUES AU REDÉMARRAGE
```

### 3.4 Business Hours (Heures d'ouverture)

```
1. UI Event: Chargement onglet Business Hours
   ↓
2. loadBusinessHours() dans SystemSettingsTab.tsx:144
   ↓
3. Valeurs HARDCODÉES (lignes 149-161) - PAS D'APPEL BACKEND!
   ↓
4. setState avec valeurs par défaut

Statut: ❌ COMPLÈTEMENT MOCK - Aucune persistance
```

### 3.5 User Settings (/settings/*) - Pour comparaison

```
1. UI Event: Sauvegarde profil
   ↓
2. settingsOperations.updateUserProfile()
   ↓
3. Backend: profile.rs (via SettingsService)
   ↓
4. SQL: UPDATE user_settings SET ... WHERE user_id = ?
   ↓
5. Table: user_settings (SQLite persistant)

Statut: ✅ PERSISTANCE RÉELLE EN BASE
```

---

## 4. Gaps détaillés

### 🔴 CRITIQUE - P0

| Gap | Fichier concerné | Sévérité | Impact |
|-----|------------------|----------|--------|
| **AppSettings en mémoire uniquement** | `core.rs:13-14` | 🔴 | Toute configuration système est perdue au redémarrage |
| **Aucune table app_settings** | `migrations/*.sql` | 🔴 | Pas de persistance SQLite pour les paramètres globaux |
| **Business hours hardcodés** | `SystemSettingsTab.tsx:149-161` | 🔴 | Fonctionnalité complètement mockée |
| **Pas de couche Application** | `src-tauri/src/domains/settings/application/` | 🔴 | Violation DDD - logique dans IPC handlers |

### 🟡 IMPORTANT - P1

| Gap | Fichier concerné | Sévérité | Impact |
|-----|------------------|----------|--------|
| **update_general_settings trop limité** | `preferences.rs:18-28` | 🟡 | Ne gère pas business_rules, security_policies, etc. |
| **Pas de validation des configs** | Frontend + Backend | 🟡 | Aucune validation Zod/struct sur les payloads |
| **Types TS manuels** | `frontend/src/domains/settings/api/types.ts` | 🟡 | Risque de drift avec les types Rust |
| **Pas de gestion d'erreur granulaire** | Frontend | 🟡 | Messages d'erreur génériques |
| **Anti-pattern: settingsOperations dans admin** | `admin/components/*.tsx` | 🟡 | Devrait utiliser un service dédié |

### 🟢 AMÉLIORATION - P2

| Gap | Fichier concerné | Sévérité | Impact |
|-----|------------------|----------|--------|
| **Commandes IPC commentées** | `main.rs:220-230` | 🟢 | 10+ commandes prêtes mais non enregistrées |
| **Duplication des modèles** | Frontend/Backend | 🟢 | AppSettings vs UserSettings confusion |
| **Pas de cache côté frontend** | Configuration admin | 🟢 | Rechargement systématique |
| **Pas d'undo/redo** | Formulaires | 🟢 | UX perfectible |

---

## 5. Ce qu'il reste à coder

### P0 - INDISPENSABLE (rendre fonctionnel)

#### Backend - Infrastructure
```rust
// À créer: src-tauri/src/domains/settings/infrastructure/system_config_repository.rs

- [ ] Créer `SystemConfigRepository` struct
- [ ] Implémenter `get_system_config() -> Result<SystemConfiguration, AppError>`
- [ ] Implémenter `update_system_config(config: &SystemConfiguration) -> Result<(), AppError>`
- [ ] Implémenter `get_app_settings() -> Result<AppSettings, AppError>`
- [ ] Implémenter `update_app_settings(settings: &AppSettings) -> Result<(), AppError>`
```

#### Backend - Migration SQL
```sql
-- À créer: migrations/035_system_configuration.sql

- [ ] CREATE TABLE app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    general_settings TEXT NOT NULL,  -- JSON
    security_settings TEXT NOT NULL, -- JSON
    notifications_settings TEXT NOT NULL, -- JSON
    appearance_settings TEXT NOT NULL, -- JSON
    data_management_settings TEXT NOT NULL, -- JSON
    storage_settings TEXT NOT NULL, -- JSON
    business_rules TEXT, -- JSON array
    security_policies TEXT, -- JSON array
    integrations TEXT, -- JSON array
    performance_configs TEXT, -- JSON array
    updated_at INTEGER NOT NULL,
    updated_by TEXT
);

- [ ] CREATE INDEX idx_app_settings_updated ON app_settings(updated_at);
```

#### Backend - IPC Layer
```rust
// À modifier: src-tauri/src/domains/settings/ipc/settings/core.rs

- [ ] Remplacer Mutex<APP_SETTINGS> par appel à repository
- [ ] get_app_settings() -> appel SQLite via repository
- [ ] update_general_settings() -> persistance SQLite
- [ ] Ajouter `update_business_rules()` commande
- [ ] Ajouter `update_security_policies()` commande
- [ ] Ajouter `update_integrations()` commande
```

#### Backend - Application Layer (nouveau)
```rust
// À créer: src-tauri/src/domains/settings/application/system_config_service.rs

- [ ] Créer `SystemConfigService` struct
- [ ] Implémenter validation métier
- [ ] Implémenter autorisation RBAC
- [ ] Implémenter logging/audit
- [ ] Gérer transactions
```

#### Backend - Main.rs
```rust
// À modifier: src-tauri/src/main.rs

- [ ] Enregistrer nouvelles commandes IPC
- [ ] Décommenter lignes 220-230 si pertinent
```

#### Frontend - Service
```typescript
// À créer: frontend/src/domains/admin/services/system-config.service.ts

- [ ] Créer `SystemConfigService` class
- [ ] Implémenter `getSystemConfig(): Promise<SystemConfiguration>`
- [ ] Implémenter `updateSystemConfig(config: Partial<SystemConfiguration>)`
- [ ] Implémenter `updateBusinessRules(rules: BusinessRule[])`
- [ ] Implémenter `updateSecurityPolicies(policies: SecurityPolicy[])`
- [ ] Implémenter `updateIntegrations(integrations: IntegrationConfig[])`
- [ ] Implémenter `updatePerformanceConfigs(configs: PerformanceConfig[])`
- [ ] Implémenter cache React Query
- [ ] Gérer invalidation du cache
```

#### Frontend - Hooks
```typescript
// À créer: frontend/src/domains/admin/hooks/useSystemConfig.ts (nouveau)

- [ ] Créer hook `useSystemConfig()`
- [ ] Intégration React Query (useQuery, useMutation)
- [ ] Gestion loading/error states
- [ ] Optimistic updates
```

#### Frontend - Business Hours
```typescript
// À modifier: frontend/src/domains/admin/components/SystemSettingsTab.tsx

- [ ] Connecter business hours au backend
- [ ] Ajouter champ `business_hours` dans AppSettings
- [ ] Créer service dédié
```

### P1 - IMPORTANT (fiabilité/UX/sécurité)

- [ ] Ajouter validation Zod côté frontend pour tous les formulaires
- [ ] Implémenter validation Rust côté backend (struct validate)
- [ ] Ajouter tests E2E pour la persistance
- [ ] Gérer dirty state et confirmation avant navigation
- [ ] Ajouter indicateurs "non sauvegardé" visuels
- [ ] Implémenter rollback en cas d'erreur
- [ ] Ajouter logs détaillés pour audit
- [ ] Vérifier cohérence des permissions RBAC

### P2 - AMÉLIORATION (dette technique)

- [ ] Régénérer types TypeScript depuis Rust (ts-rs)
- [ ] Unifier les modèles AppSettings et SystemConfiguration
- [ ] Ajouter cache frontend avec stale-while-revalidate
- [ ] Implémenter optimistic updates
- [ ] Ajouter tests de performance
- [ ] Refactoriser pour respecter strictement DDD

---

## 6. Recommandation d'implémentation

### Architecture cible minimale correcte

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Page: /configuration                                       │
│  └─ ConfigurationPageContent.tsx                            │
│     ├─ SystemSettingsTab (getAppSettings/updateGeneral)     │
│     ├─ BusinessRulesTab (get/updateBusinessRules)           │
│     ├─ SecurityPoliciesTab (get/updateSecurityPolicies)     │
│     ├─ IntegrationsTab (get/updateIntegrations)             │
│     ├─ PerformanceTab (get/updatePerformanceConfigs)        │
│     └─ MonitoringTab (healthCheck - read-only)              │
│                                                              │
│  Services: admin/services/system-config.service.ts          │
│  Hooks:    admin/hooks/useSystemConfig.ts                   │
│  Types:    Générés depuis Rust (ts-rs)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     IPC LAYER (Tauri)                       │
├─────────────────────────────────────────────────────────────┤
│  Commands:                                                  │
│  ├─ get_app_settings → SystemConfigService.get_config()    │
│  ├─ update_general_settings → SystemConfigService.update() │
│  ├─ update_business_rules → BusinessRuleService.update()   │
│  ├─ update_security_policies → SecurityPolicyService.update│
│  ├─ update_integrations → IntegrationService.update()      │
│  └─ update_performance_configs → PerformanceService.update │
│                                                              │
│  Auth: Vérification Admin obligatoire pour toutes           │
│  Logging: Correlation ID + User ID pour traçabilité         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER (DDD)                    │
├─────────────────────────────────────────────────────────────┤
│  SystemConfigService:                                       │
│  ├─ get_config() → Result<SystemConfiguration, AppError>   │
│  ├─ update_config(dto, user) → Result<(), AppError>        │
│  ├─ validate_config(dto) → Result<(), ValidationError>     │
│  └─ log_change(tx, user, change)                           │
│                                                              │
│  Validation: Zod-like validation métier                     │
│  RBAC: Vérification permissions avant opération             │
│  Transactions: ACID pour cohérence données                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Repository: SystemConfigRepository                         │
│  ├─ get() → Result<SystemConfiguration, DbError>           │
│  ├─ update(config) → Result<(), DbError>                   │
│  └─ Table: app_settings (JSON columns)                     │
│                                                              │
│  Repository: BusinessRuleRepository                         │
│  Repository: SecurityPolicyRepository                       │
│  Repository: IntegrationRepository                          │
│  Repository: PerformanceConfigRepository                    │
│                                                              │
│  Audit: settings_audit_log pour traçabilité                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                    │
│  ├─ app_settings (1 row, JSON config système)              │
│  ├─ user_settings (N rows, config utilisateur)             │
│  ├─ settings_audit_log (changelog)                         │
│  └─ application_settings (key-value sparse)                │
│                                                              │
│  Indexes: updated_at, user_id, setting_type                │
│  Constraints: JSON validation, NOT NULL                    │
└─────────────────────────────────────────────────────────────┘
```

### Points d'attention critiques

1. **Migration des données**: Actuellement les configs sont en mémoire (donc vides au démarrage). Pas de migration nécessaire, mais perte des données "historiques" (qui n'existaient pas vraiment).

2. **RBAC**: Assurer que seuls les Admins peuvent modifier la config système - déjà implémenté mais à vérifier pour toutes les nouvelles commandes.

3. **JSON vs Normalisé**: Utiliser JSON pour les tableaux (business_rules, etc.) car structure variable. Utiliser colonnes typées pour les champs simples.

4. **Offline-first**: Cette page est principalement online (admin). Pas critique pour l'offline, mais envisager un cache local pour la lecture.

---

## 7. Estimation de charge

### Estimation globale: **L (Large)** - 8-12 jours dev

#### Détail par couche

| Couche | Tâches | Estimation |
|--------|--------|------------|
| **Backend Infrastructure** | Repository, SQL, migrations | 2-3 jours |
| **Backend Application** | Services, validation, RBAC | 2 jours |
| **Backend IPC** | Nouvelles commandes, tests | 1-2 jours |
| **Frontend Services** | Hooks, services, cache | 1-2 jours |
| **Frontend UI** | Intégration, validation, UX | 1-2 jours |
| **Tests** | Unit, intégration, E2E | 1-2 jours |

### Hypothèses

- Développeur familiarisé avec le codebase (DDD, Tauri, React Query)
- Pas de changement d'architecture majeur (reste en SQLite)
- Review et tests inclus dans l'estimation
- Documentation mise à jour incluse

### Risques identifiés

1. **Risque moyen**: La couche Application n'existe pas encore - nécessite création d'une nouvelle structure
2. **Risque faible**: Migration des données (pas de données existantes à migrer)
3. **Risque faible**: Alignement avec les 10+ commandes IPC déjà commentées dans main.rs

---

## Conclusion

La page `/configuration` est **fonctionnelle en apparence mais non persistante**. C'est un risque critique car les administrateurs peuvent configurer l'application, croire que les changements sont sauvegardés, mais tout est perdu au redémarrage.

La distinction avec `/settings` est importante : les user settings sont bien persistés, mais les app settings ne le sont pas. Cette incohérence doit être corrigée en priorité P0.

### Fichiers clés identifiés

**Frontend:**
- `frontend/src/app/configuration/page.tsx` - Entry point
- `frontend/src/domains/admin/components/ConfigurationPageContent.tsx` - Container
- `frontend/src/domains/admin/components/SystemSettingsTab.tsx` - Logic & persistance
- `frontend/src/domains/settings/ipc/settings.ipc.ts` - IPC wrapper

**Backend:**
- `src-tauri/src/domains/settings/ipc/settings/core.rs` - Handlers en mémoire ⚠️
- `src-tauri/src/domains/settings/infrastructure/settings.rs` - Repository user_settings
- `src-tauri/src/main.rs:188-204` - Registration commandes

**Database:**
- `migrations/` - Aucune migration app_settings ⚠️
- Table `user_settings` - Persistante ✅
- Table `application_settings` - Existe mais partielle ⚠️

**Généré le:** 2025-01-XX  
**Auteur:** Audit automatique  
**Version:** 1.0

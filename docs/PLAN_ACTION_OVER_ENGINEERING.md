# Plan d'Action — Réduction de Complexité Backend RPMA v2

**Objectif :** Réduire la complexité du code  
**Approche :** Progressive, incrémentale, sans deadline fix**  
**Contraintes :** 
- ✅ Ne PAS touch on `onboarding` & `organizations`
- ✅ Aucun domaine protégé
- ✅ Pas de contraintes API frontend
- ✅ Pas de contraintes de préserver les tests existants

---

## Phase 1 — Suppressions (## High Impact, Low Effort)

### 1.1 Supprimer SecurityMonitorService

**Fichier :** `src-tauri/src/domains/auth/infrastructure/security_monitor.rs`  
**Lignes économisées : ~598  
**Raison :** Overkill pour app desktop mono-tenant  
**Action:**
1. Supprimer le fichier `security_monitor.rs`
2. Supprimer les références dans `auth/infrastructure/mod.rs`
3. Supprimer les appels dans `SecurityMonitorService::new()` et constructors dans `auth/infrastructure/`
4. Supprimer les tables `security_events` et `security_alerts` de la DB (5. Nettoyer le service,6. Supprimer les commandes IPC liées :
   - `get_security_events`
   - `get_security_alerts`
   - `acknowledge_security_alert`
   - `resolve_security_alert`
   - `cleanup_security_events`
   - `test_notification_config`
7. Supprimer les imports et utilisations du `main.rs` et `service_builder.rs`

**Gain estimé :** ~580 lignes + 2 fichiers supprimés dans mod.rs

---

### 1.2 Supprimer CompressedApiResponse

**Fichier :** `src-tauri/src/shared/ipc/response.rs`  
**Lignes économisées : ~100 (lines compression/decompression)**Action:**
1. Supprimer `CompressedApiResponse` struct
2. Supprimer `to_compressed_if_large()` method
3. Supprimer `decompress_data()` method
4. Supprimer leCOMPRESSED:` prefix logic
5. Supprimer les tests associés
6. Simplifier `ApiResponse::to_msgpack()` (non utilisé)
7. Supprimer les commandes IPC `get_large_test_data` dans `commands/mod.rs`
8. Supprimer les imports `flate2`, `base64`

**Gain estimé :** ~100 lignes

---

### 1.3 Simplifier Cache System

**Fichier :** `src-tauri/src/shared/services/cache.rs`  
**Lignes avant : 694 → **Cible : ~50 lignes**  
**Action:**
1. Remplacer `CacheManager` par simple `SimpleCache`:

```rust
pub struct SimpleCache {
    cache: Arc<Mutex<HashMap<String, (Vec<u8>, Instant)>>>,
    default_ttl: Duration,
}

impl SimpleCache {
    pub fn new(default_ttl: Duration) -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            default_ttl,
        }
    }

    pub fn get<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        let mut cache = self.cache.lock().unwrap();
        if let Some((data, expires_at)) = cache.get(key) {
            if expires_at > &Instant::now() {
                return None; // Expired
            }
            let _ = serde_json::from_slice(data) {
                return Ok(Some(value));
            }
        }
        }
        None
    }

    pub fn set<T: Serialize>(&self, key: &str, value: &T) {
        let mut cache = self.cache.lock().unwrap();
        let json = serde_json::to_vec(value).unwrap();
        cache.insert(key.to_string(), (json, Instant::now()));
    }

    pub fn invalidate(&self, key: &str) {
        self.cache.lock().unwrap().remove(key);
    }
}
```

2. Supprimer Redis-related code (3. Supprimer disk cache logic
4. Supprimer compression/decompression logic
5. Supprimer `CacheType` enum
6. Supprimer `CacheBackend` enum
7. Supprimer `CacheStats`, `CacheTypeStats`, `CacheConfig`, `CacheEntry`
8. Remove `redis` dependency from `Cargo.toml`

**Gain estimé :** ~640 lignes → ~50 lignes

---

### 1.4 Supprimer menu "Sync Now"

**Fichiers :**
- `src-tauri/src/menu/mod.rs` (lines 199, 207)
- `src-tauri/src/menu/events.rs` (lines 25, 78)

**Action:**
1. Remove `sync_now` menu item from `menu/mod.rs`
2. Remove `emit_action(app, "sync_now")` from `menu/events.rs`
3. Remove thesync-related" case handling

**Gain estimé :** ~20 lines

---

### 1.5 Supprimer MessagePack support

**Fichier :** `src-tauri/src/shared/ipc/response.rs`  
**Action:**
1. Remove `to_msgpack()` method from `ApiResponse`
2. Remove `rmp_serde` dependency from `Cargo.toml`

**Gain estimé :** ~20 lines

---

## Phase 2 — Aplatissement domaines simples

### 2.1 Aplatir `clients` (21 fichiers → 1 fichier)

**Domaine :** `clients`  
**Commandes IPC :** 1 (`client_crud`)  
**State Machine :** Non  

**Structure actuelle :**
```
clients/
├── mod.rs
├── facade.rs
├── application/
│   ├── mod.rs
│   ├── contracts.rs
│   └── input_validation.rs
├── domain/
│   ├── mod.rs
│   └── models/
│       ├── mod.rs
│       └── client.rs
├── infrastructure/
│   ├── mod.rs
│   ├── client.rs
│   ├── client_repository.rs
│   ├── client_queries.rs
│   ├── client_statistics.rs
│   └── client_validation.rs
├── ipc/
│   ├── mod.rs
│   └── client.rs
└── tests/
    ├── mod.rs
    ├── integration_clients.rs
    ├── permission_clients.rs
    ├── unit_clients.rs
    └── validation_clients.rs
```

**Structure cible :**
```
clients/
├── mod.rs
├── client_handler.rs  (tout le code CRUD + stats)
└── tests/
    └── (tests existants conservés)
```

**Action:**
1. Créer `client_handler.rs` avec:
   - Models (Client, ClientStats)
   - Repository functions
   - CRUD operations
   - Statistics
   - Validation
2. Update `mod.rs` to exposer uniquement `client_handler`
3. Supprimer tous les autres fichiers (sauf tests)
4. Adapter les tests si nécessaire

**Gain estimé :** ~18 fichiers supprimés, ~15 fichiers conservés

---

### 2.2 Aplatir `calendar` (19 fichiers → 2-3 fichiers)

**Domaine :** `calendar`  
**Commandes IPC :** 10  
**State Machine :** Non  
**Logique métier :** Conflict detection (à garder)

**Structure actuelle :**
```
calendar/
├── mod.rs
├── facade.rs
├── application/
│   ├── mod.rs
│   └── contracts.rs
├── domain/
│   ├── mod.rs
│   └── models/
│       ├── mod.rs
│       ├── calendar.rs
│       └── calendar_event.rs
├── infrastructure/
│   ├── mod.rs
│   ├── calendar.rs
│   ├── calendar_repository.rs
│   └── calendar_event_repository.rs
├── ipc/
│   ├── mod.rs
│   └── calendar.rs
└── tests/
    └── ...
```

**Structure cible :**
```
calendar/
├── mod.rs
├── models.rs          (CalendarEvent models)
├── calendar_handler.rs (IPC + logic)
└── tests/
    └── ...
```

**Action:**
1. Créer `models.rs` avec CalendarEvent + ConflictDetector
2. Créer `calendar_handler.rs` avec:
   - All IPC commands
   - Repository logic
   - Conflict detection
3. Update `mod.rs`
4. Supprimer autres files (sauf tests)

**Gain estimé :** ~14 fichiers supprimés, ~12 fichiers conservés

---

### 2.3 Aplatir `notifications` (16 fichiers → 2-3 fichiers)

**Domaine :** `notifications`  
**Commandes IPC :** 14  
**State Machine :** Non  
**Logique métier :** Aucune (CRUD simple)

**Structure actuelle :**
```
notifications/
├── mod.rs
├── domain/
│   ├── mod.rs
│   └── models/
│       ├── mod.rs
│       ├── notification.rs
│       └── message.rs
├── infrastructure/
│   ├── mod.rs
│   ├── notification.rs
│   ├── notification_repository.rs
│   ├── notification_in_app_repository.rs
│   ├── notification_preferences_repository.rs
│   ├── message.rs
│   ├── message_repository.rs
│   ├── notification_helper.rs
├── ipc/
│   ├── mod.rs
│   └── notification_handler.rs
└── tests/
    └── ...
```

**Structure cible :**
```
notifications/
├── mod.rs
├── models.rs                    (Notification + Message)
├── notification_handler.rs      (IPC commands)
├── notification_repository.rs  (Fusion des 4 repos)
└── tests/
    └── ...
```

**Action:**
1. Créer `models.rs` (Notification, Message, NotificationPreferences)
2. Créer `notification_repository.rs` (fusion des 4 repos)
3. Créer `notification_handler.rs` (all IPC commands)
4. Update `mod.rs`
5. Supprimer autres files (sauf tests)

**Gain estimé :** ~10 fichiers supprimés, ~8 fichiers conservés

---

### 2.4 Fusionner `reports` dans `documents` (10 fichiers → suppression)

**Domaine :** `reports`  
**Commandes IPC :** 5  
**State Machine :** Non  

**Action:**
1. Déplacer les models de reports vers `documents/domain/models/`
2. Déplacer la logique de repository vers `documents/infrastructure/`
3. Déplacer les IPC commands vers `documents/ipc/`
4. Supprimer le domaine `reports`
5. Mettre à jour les imports dans `main.rs`

**Gain estimé :** 10 fichiers supprimés (domaine entier)

---

### 2.5 Simplifier `settings` (46 fichiers → 6-8 fichiers)

**Domaine :** `settings`  
**Commandes IPC :** 29 (22 settings + 7 organization)  
**State Machine :** Non  

**⚠️ CONTRAINTE : Préserver onboarding & organizations**

**Structure actuelle :** 46 fichiers avec 4 couches DDD

**Structure cible :**
```
settings/
├── mod.rs
├── models.rs                    (Settings models)
├── settings_handler.rs          (App settings IPC)
├── user_settings_handler.rs    (User settings IPC)
├── organization_handler.rs      (Organization IPC - CONSERVER
├── settings_repository.rs      (App settings repo)
├── user_settings_repository.rs  (User settings repo)
├── organization_repository.rs  (Organization repo - CONSERVER)
└── tests/
    └── ...
```

**Action:**
1. Créer `models.rs` (fusion des models)
2. Créer `settings_repository.rs` (fusion des repos settings)
3. Créer `user_settings_repository.rs` (fusion des repos user settings)
4. Créer `settings_handler.rs` (app settings IPC)
5. Créer `user_settings_handler.rs` (user settings IPC)
6. Garder `organization_handler.rs` et `organization_repository.rs` (CONTRAINTE)
7. Supprimer les autres fichiers

**Gain estimé :** ~35 fichiers supprimés, ~30 fichiers conservés

---

### 2.6 Fusionner facades dans `documents` (27 fichiers → 22 fichiers)

**Domaine :** `documents`  
**Problème :** Double facade (`documents/facade.rs` + `photo/facade.rs`)

**Action:**
1. Supprimer `documents/facade.rs`
2. Garder uniquement `photo/facade.rs` (ou inversement)
3. Aplatir les fichiers photo :
   - Fusionner `storage.rs`, `upload.rs`, `metadata.rs` en 1 fichier
   - Garder `processing.rs` et `statistics.rs` sépar si nécessaire

**Gain estimé :** ~5 fichiers supprimés

---

## Phase 3 — Simplifications infrastructure

### 3.1 Simplifier RateLimiterService

**Fichier :** `src-tauri/src/domains/auth/infrastructure/rate_limiter.rs`  
**Lignes :** 444

**Problème :** In-memory cache + DB persistence redondant

**Action:**
1. Supprimer `memory_cache` field
2. Simplifier pour DB-only rate limiting
3. Réduire la logique de lockout

**Gain estimé :** ~200 lignes

---

### 3.2 Simplifier ServiceBuilder

**Fichier :** `src-tauri/src/service_builder.rs`  
**Lignes :** 430

**Problème :** 24 services avec dependency graph complex

**Action:**
1. Réduire le nombre de services exposés (fusionner certains)
2. Supprimer les tests de cycle (overkill)
3. Simplifier l'initialization

**Gain estimé :** ~100 lignes

---

### 3.3 Nettoyer les imports inutilisés

**Action:**
1. Supprimer `redis` dependency du `Cargo.toml` (après suppression du cache Redis)
2. Supprimer `rmp_serde` dependency du `Cargo.toml` (après suppression MessagePack)
3. Nettoyer les imports morts dans les fichiers modifiés

**Gain estimé :** 2 dependencies supprimées

---

## Résumé des gains

| Phase | Fichiers supprimés | Lignes économisées | Effort |
|-------|-------------------|-------------------|--------|
| Phase 1 | ~8 | ~820 | Faible (1-2 jours) |
| Phase 2 | ~90 | ~2000 | Moyen (1-2 semaines) |
| Phase 3 | ~5 | ~300 | Faible (2-3 jours) |
| **Total** | **~103 fichiers** | **~3120 lignes** | **2-3 semaines** |

---

## Ordre d'exécution recommandé

### Sprint 1 (Phase 1 - Suppressions)
1. Supprimer SecurityMonitorService
2. Supprimer CompressedApiResponse
3. Simplifier Cache System
4. Supprimer menu "Sync Now"
5. Supprimer MessagePack support
6. Nettoyer les dependencies

### Sprint 2 (Phase 2 - Aplatissement)
1. Aplatir `clients`
2. Aplatir `calendar`
3. Aplatir `notifications`
4. Fusionner `reports` dans `documents`
5. Simplifier `settings` (préserver org)

### Sprint 3 (Phase 3 - Simplifications)
1. Simplifier RateLimiterService
2. Simplifier ServiceBuilder
3. Nettoyer imports/dependencies
4. Tests et validation finale

---

## Checklist par phase

### Phase 1 Checklist
- [ ] Supprimer `security_monitor.rs`
- [ ] Mettre à jour `auth/infrastructure/mod.rs`
- [ ] Supprimer commandes IPC liées dans `main.rs`
- [ ] Supprimer `CompressedApiResponse` struct
- [ ] Simplifier `ApiResponse` (supprimer `to_compressed_if_large`, `to_msgpack`)
- [ ] Remplacer `CacheManager` par `SimpleCache`
- [ ] Supprimer `redis` dependency
- [ ] Supprimer `rmp_serde` dependency
- [ ] Supprimer menu sync
- [ ] Lancer `cargo check`
- [ ] Lancer les tests

### Phase 2 Checklist
- [ ] Créer `clients/client_handler.rs`
- [ ] Supprimer anciens fichiers clients
- [ ] Mettre à jour imports dans `main.rs`
- [ ] Créer `calendar/models.rs`
- [ ] Créer `calendar/calendar_handler.rs`
- [ ] Supprimer anciens fichiers calendar
- [ ] Fusionner repositories notifications
- [ ] Créer `notifications/notification_handler.rs`
- [ ] Déplacer reports vers documents
- [ ] Supprimer domaine reports
- [ ] Fusionner fichiers settings
- [ ] Lancer `cargo check`
- [ ] Lancer les tests

### Phase 3 Checklist
- [ ] Simplifier RateLimiterService
- [ ] Simplifier ServiceBuilder
- [ ] Nettoyer imports morts
- [ ] Mettre à jour documentation
- [ ] Lancer `cargo check`
- [ ] Lancer tous les tests
- [ ] Valider que l'app fonctionne

---

## Risques et mitigation

### Risque 1 : Cassure les tests existants
**Mitigation :** Adapter les tests à la nouvelle structure, pas les supprimer aveuglement.

### Risque 2 : Régressions fonctionnelles
**Mitigation :** Lancer tous les tests après chaque phase, tester manuellement les fonctionnalités touchées.

### Risque 3 : Imports cassés
**Mitigation :** Utiliser `cargo check` et `cargo clippy` après chaque changement.

---

## Notes importantes

- **TOUJOURS préserver `onboarding` et `organizations`** comme demandé
- Approche **progressive** : chaque phase peut être faite indépendamment
- **Pas de deadline** : prendre le temps nécessaire pour bien faire
- **Tests à adapter** : ne pas supprimer les tests, mais les adapter

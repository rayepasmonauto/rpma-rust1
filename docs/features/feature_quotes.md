# Feature: Quotes

> **Statut** : Partiellement implémenté (~80 %)  
> **Auteur** : Analyse automatisée — niveau CTO  
> **Date** : 2026-03-04  
> **Scope** : Frontend (Next.js 14) + Backend (Tauri v2 / Rust) + SQLite

---

## 1️⃣ Feature Overview

### Objectif métier

Permettre aux utilisateurs de créer, gérer et suivre des devis (quotes) pour des interventions de pose de film de protection PPF (Paint Protection Film). Le devis formalise la proposition commerciale adressée au client avant déclenchement de l'intervention.

### Problème résolu

Sans ce module, la traçabilité commerciale est absente : impossibilité de chiffrer une intervention avant de la réaliser, d'obtenir un accord client formalisé, ou de convertir automatiquement un devis accepté en tâche/intervention.

### KPI impactés

| KPI | Impact |
|-----|--------|
| Taux de conversion devis → intervention | Dépend de la feature `convertToTask` (non implémentée côté IPC) |
| Délai moyen de validation client | Traçabilité des statuts `draft → sent → accepted` |
| Valeur moyenne d'un devis | Calculée automatiquement (subtotal, tax, total en centimes) |
| Nombre de devis expirés | Statut `expired` disponible, mais aucun job automatique détecté |

### Acteurs concernés

| Rôle | Capacités |
|------|-----------|
| **Admin** | CRUD complet, export PDF, gestion des statuts |
| **Supervisor** | CRUD complet, export PDF, gestion des statuts |
| **Technician** | CRUD complet, export PDF, gestion des statuts |
| **Viewer** | Lecture seule — toute mutation est bloquée (côté backend) |

---

## 2️⃣ User Flow Complet

### Routes Frontend

| Route | Fichier | Statut |
|-------|---------|--------|
| `/quotes` | `app/quotes/page.tsx` | ✅ Implémenté |
| `/quotes/new` | `app/quotes/new/page.tsx` | ✅ Implémenté |
| `/quotes/[id]` | `app/quotes/[id]/page.tsx` | ✅ Implémenté |

### Diagramme du flux utilisateur

```
[/quotes]
   │
   ├── Onglets : Tous / Draft / Sent / Accepted / Rejected / Expired / Converted
   ├── Recherche (client, numéro, véhicule)
   ├── Statistiques récapitulatives (nombre par statut, montant total)
   │
   ├─► [Nouveau devis]
   │       ├── Sélection client (obligatoire)
   │       ├── Informations véhicule (plaque, marque, modèle, année, VIN)
   │       ├── Date de validité
   │       ├── Section "Pièces" (QuotePartsSection)
   │       ├── Section "Main d'œuvre" (QuoteLaborSection)
   │       ├── Notes / Conditions
   │       └── Soumission → IPC: quote_create → retour /quotes/[id]
   │
   └─► [Détail /quotes/:id]
           ├── QuoteDetailPageContent
           ├── QuoteItemsTable (lecture / édition)
           ├── QuoteTotalsCard (sous-total, taxes, total, remise)
           ├── QuoteStatusBadge
           ├── QuoteNotesEditor
           ├── QuoteAttachmentsManager (images + documents)
           │       ├── QuoteImagesManager
           │       └── QuoteDocumentsManager
           ├── QuoteConvertDialog ⚠️ (UI présente, backend non implémenté)
           └── Actions :
                   ├── Marquer "Envoyé" → IPC: quote_mark_sent
                   ├── Marquer "Accepté" → IPC: quote_mark_accepted
                   ├── Marquer "Rejeté" → IPC: quote_mark_rejected
                   ├── Exporter PDF → IPC: quote_export_pdf ⚠️
                   ├── Supprimer → IPC: quote_delete
                   └── Convertir en tâche → ❌ NOT IMPLEMENTED (IPC manquant)
```

### États UI

| État | Description |
|------|-------------|
| **Loading** | Squelette de chargement affiché |
| **Empty** | Message "Aucun devis" avec CTA de création |
| **Error** | Toast d'erreur avec message sanitisé |
| **Draft** | Édition complète autorisée |
| **Sent / Accepted / Rejected** | Lecture seule sur les champs clés |

### Cas bloquants

- Un devis non-draft ne peut plus être modifié (validé côté backend)
- La conversion en tâche (`QuoteConvertDialog`) est **non fonctionnelle** : le frontend affiche la boîte de dialogue mais l'IPC lève une exception `"not implemented by backend IPC"`
- L'export PDF côté backend : **À vérifier** (handler IPC déclaré, implémentation interne non confirmée)

---

## 3️⃣ RBAC & Sécurité

### Matrice des permissions

| Opération | Admin | Supervisor | Technician | Viewer |
|-----------|-------|------------|------------|--------|
| Lire (list, get) | ✅ | ✅ | ✅ | ✅ |
| Créer | ✅ | ✅ | ✅ | ❌ |
| Modifier | ✅ | ✅ | ✅ | ❌ |
| Supprimer | ✅ | ✅ | ✅ | ❌ |
| Changer statut | ✅ | ✅ | ✅ | ❌ |
| Exporter PDF | ✅ | ✅ | ✅ | ✅ |
| Gérer pièces jointes | ✅ | ✅ | ✅ | ❌ |

### Enforcement

- **Backend (façade)** : Vérification du rôle dans `facade.rs` avant toute opération mutante. Erreur : `AppError::Authorization("Viewers cannot modify quotes")`.
- **Frontend** : Certains boutons sont conditionnellement affichés selon le rôle, mais la validation **canonique** reste côté backend.

### Session

- Token UUID (non-JWT), 8h de TTL, stocké en base dans la table `sessions` (ADR-010).
- Injecté automatiquement via `safeInvoke` dans chaque appel IPC.
- Vérifié côté backend via le macro `authenticate!` (ADR-006).

### Validation frontend vs backend

| Règle | Frontend | Backend |
|-------|----------|---------|
| `client_id` non vide | ✅ (form validation) | ✅ (contracts.rs) |
| `label` item non vide | ✅ | ✅ |
| `qty` > 0 | ✅ | ✅ |
| `discount_type` = "percentage" ou "fixed" | ⚠️ À vérifier | ✅ |
| `discount_value` ≥ 0 | ⚠️ À vérifier | ✅ |
| Pourcentage remise ≤ 100 % | ⚠️ À vérifier | ✅ |
| Taille pièce jointe ≤ 50 Mo | ✅ | ✅ |
| Types MIME autorisés | ✅ | ✅ |

### Surface d'attaque potentielle

- **Path traversal** sur les pièces jointes : le champ `file_path` est stocké en base. Vérifier que le backend interdit les chemins relatifs (`../`). **À vérifier**.
- **Injection SQL** : utilisation de requêtes paramétrées (rusqlite). Risque faible.
- **Débordement financier** : montants stockés en centimes (`i64`). Dépassement possible sur des devis très élevés mais contrôlé par le type Rust.
- **IDOR** : chaque `quote_get` devrait vérifier que le `client_id` appartient à l'organisation. **À vérifier** — aucune assertion d'appartenance multi-tenant détectée.

---

## 4️⃣ API / IPC Contract

### Commandes IPC

| Commande IPC | Opération | Protection |
|--------------|-----------|------------|
| `quote_create` | Créer un devis | Tous sauf Viewer |
| `quote_get` | Obtenir un devis | Tous les rôles |
| `quote_list` | Lister les devis | Tous les rôles |
| `quote_update` | Modifier un devis | Tous sauf Viewer |
| `quote_delete` | Supprimer un devis | Tous sauf Viewer |
| `quote_item_add` | Ajouter un article | Tous sauf Viewer |
| `quote_item_update` | Modifier un article | Tous sauf Viewer |
| `quote_item_delete` | Supprimer un article | Tous sauf Viewer |
| `quote_mark_sent` | Draft → Sent | Tous sauf Viewer |
| `quote_mark_accepted` | Sent → Accepted | Tous sauf Viewer |
| `quote_mark_rejected` | Sent → Rejected | Tous sauf Viewer |
| `quote_export_pdf` | Exporter en PDF | Tous les rôles |
| `quote_attachments_get` | Lister les pièces jointes | Tous les rôles |
| `quote_attachment_create` | Créer une pièce jointe | Tous sauf Viewer |
| `quote_attachment_update` | Modifier une pièce jointe | Tous sauf Viewer |
| `quote_attachment_delete` | Supprimer une pièce jointe | Tous sauf Viewer |

### Payloads

#### `quote_create` — Request

```typescript
{
  session_token: string;
  correlation_id?: string;
  data: {
    client_id: string;                  // Obligatoire
    task_id?: string;
    valid_until?: number;               // epoch ms
    notes?: string;
    terms?: string;
    vehicle_plate?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: string;
    vehicle_vin?: string;
    items: Array<{
      kind: 'labor' | 'material' | 'service' | 'discount';
      label: string;                    // Obligatoire
      description?: string;
      qty: number;                      // > 0
      unit_price: number;               // centimes
      tax_rate?: number;
      material_id?: string;
      position?: number;
    }>;
  };
}
```

#### `quote_create` — Response

```typescript
ApiResponse<Quote> = {
  success: boolean;
  data?: Quote;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  correlation_id?: string;
}
```

#### `quote_list` — Request

```typescript
{
  session_token: string;
  correlation_id?: string;
  filters?: {
    status?: QuoteStatus;
    client_id?: string;
    search?: string;
    page?: number;
    per_page?: number;
  };
}
```

### Error mapping (AppError)

| Cause | AppError variant | Message frontend |
|-------|-----------------|-----------------|
| Rôle Viewer tente mutation | `Authorization` | "Viewers cannot modify quotes" |
| Devis introuvable | `NotFound` | "Quote not found" |
| Violation de contrainte DB | `Database` | "Failed to retrieve quote" |
| Champ invalide | `Validation` | Message spécifique |
| Erreur inattendue | `Internal` | Message sanitisé (détail loggé côté backend) |

### Propagation du Correlation ID

- Frontend : généré ou réutilisé par `safeInvoke` ; injecté dans `payload.correlation_id`
- Backend : extrait par `init_correlation_context()` ; enregistré dans le span `tracing` courant via `correlation_id` field
- Retourné dans `ApiResponse` sous `correlation_id`
- Frontend adopte l'ID retourné par le backend si présent (ADR-007)

---

## 5️⃣ Domain Logic

### Agrégats impliqués

| Agrégat | Rôle |
|---------|------|
| `Quote` | Racine — contient les méta-données, totaux, statut, infos véhicule |
| `QuoteItem` | Entité fille — article (main d'œuvre, matériau, service, remise) |
| `QuoteAttachment` | Entité fille — fichier lié au devis |
| `Client` | Référencé (FK), non propriétaire |
| `Task` | Référencé optionnel (FK) |
| `Material` | Référencé optionnel dans `QuoteItem` (FK) |

### Règles métier

1. Un devis **doit** avoir un `client_id` valide.
2. Un devis **doit** avoir un `quote_number` unique (format `DEV-{count}` auto-généré).
3. Les montants sont **toujours** stockés en centimes (`i64`), jamais en décimaux.
4. Les totaux (`subtotal`, `tax_total`, `total`) sont recalculés automatiquement lors de chaque ajout/modification/suppression d'article.
5. Un devis en statut `draft` peut être modifié (articles, notes, véhicule, remise).
6. Un devis en statut **non-draft** (sent, accepted, rejected, etc.) est en **lecture seule**.
7. Une remise de type `percentage` ne peut pas dépasser 100 %.
8. Une remise ne peut pas être négative.

### Invariants

- `status` ∈ `{draft, sent, accepted, rejected, expired, converted, changes_requested}`
- `kind` (item) ∈ `{labor, material, service, discount}`
- `attachment_type` ∈ `{image, document, other}`
- `total = subtotal + tax_total - discount_amount`
- `quote_number` est UNIQUE dans la base

### State Machine

```
          ┌──────────────────────────────────┐
          │                                  │
          ▼                                  │
       [draft] ──markSent──► [sent] ──markAccepted──► [accepted]
          │                    │
          │                    └──markRejected──► [rejected]
          │
          └── (éditabilité complète)
          
[draft/sent] ──(job externe attendu)──► [expired]   ← ⚠️ Non implémenté
[accepted]  ──(conversion)─────────────► [converted] ← ⚠️ IPC non implémenté
```

> **Note** : La transition vers `expired` n'est pas déclenchée automatiquement. Aucun job cron ou trigger n'a été détecté dans la codebase.

### Domain Events

| Événement | Déclencheur | Consommateur |
|-----------|-------------|--------------|
| `QuoteAccepted` (supposé) | `quote_mark_accepted` | Potentiellement le domaine `interventions` |

> **À vérifier** : La publication d'événements domaine depuis le domaine `quotes` n'est pas explicitement confirmée dans les tests ou le code de `service_builder.rs`. L'event bus est présent (ADR-004) mais son utilisation dans le domaine quotes doit être validée.

---

## 6️⃣ Transaction Boundaries

### Architecture des transactions (ADR-002)

- Les transactions sont **ouvertes dans la couche application** via `Database::with_transaction()`.
- Les repositories reçoivent `&rusqlite::Transaction` et n'ouvrent jamais de transaction eux-mêmes.
- La logique SQL est strictement confinée dans `infrastructure/`.

### Opérations multi-étapes

| Opération | Étapes transactionnelles |
|-----------|--------------------------|
| `create_quote` | 1. Insérer le devis ; 2. Insérer les articles ; 3. Recalculer les totaux |
| `add_item` | 1. Insérer l'article ; 2. Recalculer les totaux |
| `update_item` | 1. Mettre à jour l'article ; 2. Recalculer les totaux |
| `delete_item` | 1. Supprimer l'article ; 2. Recalculer les totaux |
| `mark_accepted` | 1. Changer le statut ; 2. (Potentiellement) déclencher événement vers `tasks` |

### Respect de ADR-002

✅ Transactions gérées dans la couche application.  
✅ Repositories recevant `&Transaction` sans ouvrir de nouvelles transactions.  
⚠️ La création automatique d'une tâche lors de l'acceptation du devis est à vérifier — si elle implique un accès au domaine `tasks`, la cohérence transactionnelle inter-domaine doit être garantie via l'event bus ou une saga.

---

## 7️⃣ Database Mapping

### Table `quotes`

| Colonne | Type | Contraintes | Observations |
|---------|------|-------------|--------------|
| `id` | TEXT | PK NOT NULL | UUID |
| `quote_number` | TEXT | NOT NULL UNIQUE | Format `DEV-{count}` |
| `client_id` | TEXT | NOT NULL FK `clients(id)` | |
| `task_id` | TEXT | FK `tasks(id)` | Nullable |
| `status` | TEXT | NOT NULL DEFAULT 'draft' CHECK(...) | 7 valeurs possibles |
| `valid_until` | INTEGER | — | epoch ms |
| `description` | TEXT | — | Description publique |
| `notes` | TEXT | — | Notes internes |
| `terms` | TEXT | — | Conditions particulières |
| `subtotal` | INTEGER | NOT NULL DEFAULT 0 | Centimes |
| `tax_total` | INTEGER | NOT NULL DEFAULT 0 | Centimes |
| `total` | INTEGER | NOT NULL DEFAULT 0 | Centimes |
| `discount_type` | TEXT | — | `percentage` ou `fixed` |
| `discount_value` | INTEGER | — | Valeur brute |
| `discount_amount` | INTEGER | — | Montant remise calculé (centimes) |
| `vehicle_plate` | TEXT | — | |
| `vehicle_make` | TEXT | — | |
| `vehicle_model` | TEXT | — | |
| `vehicle_year` | TEXT | — | |
| `vehicle_vin` | TEXT | — | |
| `public_token` | TEXT | — | **Obsolète** (migration 049) |
| `shared_at` | INTEGER | — | **Obsolète** (migration 049) |
| `view_count` | INTEGER | NOT NULL DEFAULT 0 | **Obsolète** (migration 049) |
| `last_viewed_at` | INTEGER | — | **Obsolète** (migration 049) |
| `customer_message` | TEXT | — | **Obsolète** (migration 049) |
| `created_at` | INTEGER | NOT NULL DEFAULT (unixepoch() * 1000) | epoch ms |
| `updated_at` | INTEGER | NOT NULL DEFAULT (unixepoch() * 1000) | epoch ms |
| `created_by` | TEXT | — | ⚠️ Pas de FK sur `users(id)` |

### Table `quote_items`

| Colonne | Type | Contraintes | Observations |
|---------|------|-------------|--------------|
| `id` | TEXT | PK NOT NULL | UUID |
| `quote_id` | TEXT | NOT NULL FK `quotes(id)` ON DELETE CASCADE | |
| `kind` | TEXT | NOT NULL DEFAULT 'service' CHECK(...) | |
| `label` | TEXT | NOT NULL | |
| `description` | TEXT | — | |
| `qty` | REAL | NOT NULL DEFAULT 1 | |
| `unit_price` | INTEGER | NOT NULL DEFAULT 0 | Centimes |
| `tax_rate` | REAL | — | Décimal (ex: 0.20 pour 20 %) |
| `material_id` | TEXT | FK `materials(id)` | Nullable |
| `position` | INTEGER | NOT NULL DEFAULT 0 | Ordre d'affichage |
| `created_at` | INTEGER | NOT NULL DEFAULT ... | |
| `updated_at` | INTEGER | NOT NULL DEFAULT ... | |

### Table `quote_attachments`

| Colonne | Type | Contraintes | Observations |
|---------|------|-------------|--------------|
| `id` | TEXT | PK NOT NULL | UUID |
| `quote_id` | TEXT | NOT NULL FK `quotes(id)` ON DELETE CASCADE | |
| `file_name` | TEXT | — | Nom affiché |
| `file_path` | TEXT | — | ⚠️ Risque path traversal si non validé |
| `file_size` | INTEGER | — | Octets |
| `mime_type` | TEXT | — | |
| `attachment_type` | TEXT | CHECK(...) | `image`, `document`, `other` |
| `description` | TEXT | — | |
| `created_at` | INTEGER | NOT NULL DEFAULT ... | |
| `created_by` | TEXT | — | ⚠️ Pas de FK sur `users(id)` |

### Index

| Index | Table | Colonnes | Type |
|-------|-------|----------|------|
| `idx_quotes_quote_number` | `quotes` | `quote_number` | UNIQUE |
| `idx_quotes_client_id` | `quotes` | `client_id` | Standard |
| `idx_quotes_status` | `quotes` | `status` | Standard |
| `idx_quotes_created_at` | `quotes` | `created_at` | Standard |
| `idx_quotes_task_id` | `quotes` | `task_id` | Standard |
| `idx_quote_items_quote_id` | `quote_items` | `quote_id` | Standard |
| `idx_quote_items_position` | `quote_items` | `(quote_id, position)` | Composite |
| `idx_quote_attachments_quote_id` | `quote_attachments` | `quote_id` | Standard |

### Migrations associées

| Migration | Description |
|-----------|-------------|
| `037_quotes.sql` | Création initiale des tables `quotes`, `quote_items` |
| `047_quote_enhancements.sql` | Ajout colonnes: `description`, `discount_*`, `public_token`, `shared_at`, `view_count`, `last_viewed_at`, `customer_message` + table `quote_attachments` |
| `048_quote_fk_indexes.sql` | Ajout des index de FK |
| `049_remove_quote_sharing.sql` | Suppression des colonnes de partage public (`public_token`, etc.) — **colonnes toujours présentes en base, inutilisées** |

### Colonnes inutilisées / dette de schéma

| Colonne | Table | Problème |
|---------|-------|---------|
| `public_token` | `quotes` | Supprimée par migration 049 mais encore présente en base |
| `shared_at` | `quotes` | Idem |
| `view_count` | `quotes` | Idem |
| `last_viewed_at` | `quotes` | Idem |
| `customer_message` | `quotes` | Idem |
| `created_by` | `quotes` | Pas de FK vers `users(id)` |
| `created_by` | `quote_attachments` | Pas de FK vers `users(id)` |

### Contraintes manquantes

- `updated_at` non mis à jour via trigger SQLite (géré applicativement — risque si mise à jour directe en DB)
- Aucun index sur `valid_until` (utile pour un futur job de détection des devis expirés)
- `discount_type` sans CHECK constraint déclarative explicite (validation applicative uniquement)

---

## 8️⃣ Performance & Scalabilité

### Requêtes lourdes

| Requête | Risque | Indexation |
|---------|--------|------------|
| `quote_list` avec filtres multiples | Requête JOIN clients + filtres dynamiques | Index sur `status`, `client_id`, `created_at` ✅ |
| Recalcul des totaux (`recalculate_totals`) | SELECT de tous les items d'un devis | Index sur `quote_id` ✅ |
| `quote_attachments_get` | Simple JOIN par `quote_id` | Index ✅ |

### Pagination

- ✅ Pagination présente dans `quote_list` (`page`, `per_page`).
- ⚠️ Valeur par défaut de `per_page` à vérifier — pas de plafond hard documenté.

### Problèmes N+1

- Risque potentiel lors de l'affichage de la liste de devis si les articles sont chargés séparément par devis. **À vérifier** dans `quote_list`.
- Dans la page de détail, les articles et pièces jointes sont chargés via des IPC séparés — 3 appels séquentiels possibles (quote, items, attachments).

### Pool DB

- ✅ Utilisé conformément à ADR-011 (r2d2 ou équivalent Tauri/SQLite).
- Mode WAL activé (ADR-014).

### Payload IPC volumineux

- Les pièces jointes ne transitent pas en base64 via IPC (seul le chemin est stocké) — volume maîtrisé.
- Une liste de devis avec beaucoup d'articles pourrait générer un payload important si les items sont inclus dans `quote_list`. **À vérifier**.

### Caching

- ✅ Un cache TTL est utilisé dans `QuoteService` pour certaines requêtes.
- ⚠️ Invalidation du cache lors des mutations : **À vérifier** pour éviter des données obsolètes après update.

---

## 9️⃣ Observabilité

### Logs structurés

- ✅ `tracing` utilisé côté backend (crate `tracing`).
- ✅ Chaque commande IPC enregistre `correlation_id` dans le span courant.
- ✅ `update_correlation_context_user` met à jour le contexte avec l'`user_id` après authentification.

### Correlation ID

- ✅ Conforme ADR-007.
- Généré côté backend avec préfixe `ipc-` si non fourni.
- Retourné dans chaque `ApiResponse`.
- Frontend adopte l'ID backend si renvoyé.

### Erreurs internes masquées

- ✅ `AppError::internal_sanitized` masque les détails techniques avant envoi frontend.
- ✅ Le message interne est loggé côté backend avec `correlation_id`.

### Monitoring possible

- L'architecture permet de brancher un système de monitoring externe (ex: Grafana via logs structurés).
- Pas de métriques spécifiques aux devis (taux de conversion, durée moyenne) — **Non implémenté**.
- Aucun alerting sur les devis expirés non traités.

---

## 🔟 Edge Cases & Scénarios Extrêmes

| Scénario | Comportement actuel | Risque |
|----------|---------------------|--------|
| Suppression d'un client ayant des devis | ⚠️ FK `client_id` sans CASCADE DELETE — erreur DB attendue | Moyen |
| Suppression d'un matériau référencé dans un item | ⚠️ FK `material_id` sans CASCADE — erreur DB ou NULL | Moyen |
| Devis avec 0 article créé | ✅ Autorisé (totaux = 0) | Faible |
| `valid_until` dépassé sans changement de statut | ❌ Aucun job automatique de passage à `expired` | Élevé |
| Multi-device : modification simultanée du même devis | ❌ Pas de contrôle optimiste (OCC absent) — last write wins | Élevé |
| Offline : création de devis sans connexion | ✅ SQLite local — opérations possibles offline (ADR-008) |
| Conversion en tâche activée | ❌ Backend non implémenté — throw en frontend | Critique |
| Remise > 100 % via manipulation directe | ✅ Bloqué côté backend (validation) | Faible |
| Upload de fichier > 50 Mo | ✅ Bloqué (validation taille) | Faible |
| `file_path` avec `../` (path traversal) | ⚠️ Non vérifié dans le code analysé | Élevé |
| Grand nombre de devis (> 10 000) | ✅ Pagination présente, mais index à surveiller | Moyen |
| Quote number collision (concurrent creation) | ✅ UNIQUE sur `quote_number` + gestion d'erreur attendue | Faible |

---

## 1️⃣1️⃣ Dette Technique Détectée

### Code dupliqué

- La recalculation des totaux (`recalculate_totals`) est appelée après chaque mutation d'item. Si plusieurs items sont créés en batch, la recalculation est répétée inutilement — **opportunité d'optimisation**.

### Violations DDD

- `created_by` stocké comme TEXT libre sans FK vers `users` — pas de cohérence domaine garantie.
- La conversion devis → tâche est logiquement un domaine croisé (`quotes` → `tasks`). L'utilisation du dialog `QuoteConvertDialog` sans IPC fonctionnel indique une **logique métier orpheline en UI**.

### Couplage excessif

- Le domaine `quotes` référence directement les tables `clients`, `tasks`, `materials` par FK. Toute suppression dans ces domaines peut provoquer des erreurs non anticipées (pas de soft-delete visible).

### Logique métier en UI

- `QuoteConvertDialog` contient la logique de conversion devis → tâche côté frontend, sans implémentation backend. Cette logique devrait être **entièrement pilotée par le backend**.
- `quote-calculations.ts` et `quote-stats.ts` (utilitaires frontend) dupliquent potentiellement la logique de calcul des totaux présente côté backend — risque de divergence.

### SQL hors infrastructure

- Non détecté — conforme ADR-002. ✅

### Manque de validation

- `discount_type` n'a pas de CHECK constraint SQL — repose uniquement sur la validation applicative.
- `created_by` non validé comme UUID ou user existant.
- `valid_until` peut être une date passée à la création sans avertissement.
- Colonnes obsolètes (`public_token`, `view_count`, etc.) toujours présentes en base sans nettoyage.

### Tests

- Aucun test d'intégration end-to-end pour les commandes IPC de devis (contrairement à `auth_commands_test.rs`, `task_commands_test.rs`, etc.).
- Tests unitaires limités à l'initialisation de la façade et au mapping d'erreurs.
- Aucun test du calcul des totaux en conditions extrêmes (remise > total, tax_rate = 0, etc.).

---

## 1️⃣2️⃣ Plan d'Amélioration

### P0 — Critique

| Action | Justification |
|--------|---------------|
| Implémenter le handler IPC `quote_convert_to_task` | Feature visuellement présente mais totalement non fonctionnelle côté backend |
| Valider `file_path` des pièces jointes (interdire `../`) | Vulnérabilité path traversal potentielle |
| Ajouter tests d'intégration IPC pour les quotes | Aucune couverture d'intégration — régression possible |

### P1 — Important

| Action | Justification |
|--------|---------------|
| Nettoyer les colonnes obsolètes (`public_token`, `shared_at`, etc.) via migration | Dette de schéma, confusion future des développeurs |
| Implémenter un job/trigger de passage automatique `draft/sent → expired` | Statut `expired` jamais déclenché automatiquement |
| Ajouter FK `created_by → users(id)` ou utiliser `ON DELETE SET NULL` | Intégrité référentielle manquante |
| Ajouter CHECK constraint SQL sur `discount_type` | Cohérence avec les autres contraintes d'enum |
| Vérifier l'invalidation du cache TTL après mutations | Risque de données obsolètes |
| Ajouter index sur `valid_until` | Requêtes futures de détection des devis expirés |
| Confirmer la publication d'événements domaine (`QuoteAccepted`) | Architecture événementielle partiellement validée |

### P2 — Amélioration

| Action | Justification |
|--------|---------------|
| Implémenter l'export PDF côté backend | Handler déclaré mais implémentation non confirmée |
| Ajouter optimistic concurrency control (version/etag) | Éviter les conflits multi-device (last write wins) |
| Unifier le calcul des totaux (backend canonique, frontend en lecture seule) | Éviter la divergence entre `quote-calculations.ts` et le service Rust |
| Ajouter des tests pour les edge cases de calcul (remise > 100%, tax_rate = 0) | Couverture des invariants métier |
| Documenter la machine d'états dans le code (commentaires ou enum transitions) | Lisibilité et maintenabilité |
| Ajouter métriques de conversion (devis → tâche acceptée) | KPI business manquants |
| Factoriser la recalculation des totaux (batch vs unitaire) | Performance lors des créations avec plusieurs articles |

---

## 🧠 Score de Maturité de la Feature

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| **Architecture** | 7/10 | Clean Architecture respectée, DDD correct. Manque: publication d'événements domaine non confirmée, conversion devis→tâche orpheline. |
| **Sécurité** | 6/10 | RBAC solide, session validée. Risques: path traversal sur file_path non adressé, pas de validation IDOR multi-tenant, colonnes obsolètes en base. |
| **Performance** | 7/10 | Index présents, pagination, cache TTL. Risques: N+1 potentiel sur la liste, invalidation du cache non confirmée. |
| **Cohérence DDD** | 6/10 | Agrégat `Quote` bien défini. Défauts: logique de conversion en UI, calculs dupliqués frontend/backend, `created_by` sans FK. |
| **Maintenabilité** | 6/10 | Structure de domaine claire. Dette: colonnes obsolètes, absence de tests d'intégration IPC, feature incomplète (`convertToTask`) sans TODO explicite. |

**Score global : 6,4 / 10**

> La feature est fonctionnellement opérationnelle pour le CRUD de base et la gestion des statuts. Les blocages principaux sont : (1) la conversion devis → tâche non implémentée côté backend malgré une UI complète, (2) des risques de sécurité sur la gestion des fichiers, et (3) l'absence de tests d'intégration IPC spécifiques aux quotes.

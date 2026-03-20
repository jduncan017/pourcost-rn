# PourCost: AWS → Supabase Migration Brief

> **Schema Note (2026-03-18)**: The Supabase schema in Section 5 below is outdated. The corrected schema is at `supabase/schema.sql` — it uses JSONB for Volume types, adds missing columns (type, category, favorited, sort_order), and fixes the cocktail_ingredients unique constraint. Always use the SQL file as the source of truth.

> **Purpose**: Complete technical handoff for rebuilding PourCost on Supabase. All AWS resource details, data schemas, and migration strategy are documented below. The goal is to migrate all existing user data so no one loses anything, preserve Facebook + Google login for existing users, and set up Supabase as the new backend.

---

## 1. AWS Account & Access

- **AWS Account ID**: `456027426715`
- **Account Alias**: `29labs`
- **IAM User**: `pourcost`
- **Region**: `us-east-1`
- **Permissions**: DynamoDB (full), Cognito (read), S3 (read on `pourcost.29labs.com`)

---

## 2. DynamoDB Tables

### PourCost_Ingredients

- **ARN**: `arn:aws:dynamodb:us-east-1:456027426715:table/PourCost_Ingredients`
- **Size**: ~10.7 MB
- **Created**: June 2017
- **Key Schema**: Partition key `userId` (String) + Sort key `id` (String UUID)
- **Provisioned**: 5 RCU / 5 WCU

**Sample Item**:
```json
{
  "userId": "us-east-1:c81321e7-d6d1-4eb8-9f10-8ff62883a6bc",
  "id": "12e53832-1db0-4397-b88b-90121a98db0a",
  "name": "Jameson",
  "productCost": "69.0",
  "productSize": "milliliters:700.0"
}
```

**Fields**:
| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Cognito Identity Pool ID (`us-east-1:<uuid>`) — partition key |
| `id` | String | UUID — sort key |
| `name` | String | Ingredient name |
| `productCost` | String | Cost as string (e.g., `"69.0"`) |
| `productSize` | String | Format: `"unit:value"` (e.g., `"milliliters:700.0"`) |

### PourCost_Cocktails

- **ARN**: `arn:aws:dynamodb:us-east-1:456027426715:table/PourCost_Cocktails`
- **Items**: ~10,923
- **Size**: ~5.3 MB
- **Created**: June 18, 2017
- **Key Schema**: Partition key `userId` (String) + Sort key `id` (String UUID)
- **Provisioned**: 5 RCU / 5 WCU

**Sample Item**:
```json
{
  "userId": "us-east-1:c81321e7-d6d1-4eb8-9f10-8ff62883a6bc",
  "id": "21a7e6ee-ac14-4c83-8608-588d69f3076f",
  "name": "Drink",
  "ingredients": [
    {
      "ingredientId": "<uuid>",
      "pourSize": "milliliters:22.5",
      "pourSizeScale": "metric"
    }
  ],
  "pourCost": "0.0",
  "notes": ""
}
```

**Fields**:
| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Cognito Identity Pool ID — partition key |
| `id` | String | UUID — sort key |
| `name` | String | Cocktail name |
| `ingredients` | List of Maps | Nested array (see below) |
| `pourCost` | String | Calculated cost as string |
| `notes` | String | Optional, not present on all items |

**Nested `ingredients` Map structure**:
| Field | Type | Notes |
|-------|------|-------|
| `ingredientId` | String | UUID referencing PourCost_Ingredients `id` |
| `pourSize` | String | Format: `"unit:value"` (e.g., `"milliliters:22.5"`) |
| `pourSizeScale` | String | `"metric"` or `"imperial"` |

---

## 3. Cognito Identity Pool (Authentication)

- **Pool Name**: PourCost
- **Pool ID**: `us-east-1:eba02a7c-fbaa-4f84-bcf5-59184b70ed53`
- **ARN**: `arn:aws:cognito-identity:us-east-1:456027426715:identitypool/us-east-1:eba02a7c-fbaa-4f84-bcf5-59184b70ed53`
- **Total Identities**: 14,006
- **Active This Month**: ~9
- **Created**: June 5, 2017
- **Last Updated**: March 10, 2019
- **User Access**: Authenticated only (guest access inactive)
- **Authenticated Role**: `Cognito_PourCostAuth_Role` (ARN: `arn:aws:iam::456027426715:role/Cognito_PourCostAuth_Role`)

### Identity Providers (2)

| Provider | Type | Client/App ID |
|----------|------|---------------|
| `graph.facebook.com` | Facebook | `1522826757747836` |
| `accounts.google.com` | OpenID Connect (OIDC) | Not stored in Cognito (configured in app code). OIDC ARN: `arn:aws:iam::456027426715:oidc-provider/accounts.google.com` |

### Cognito User Pool (NOT used by app)

- **Pool ID**: `us-east-1_nzK1p4NtK`
- **Users**: 0
- The app uses Identity Pool (federated identity) directly, NOT User Pool.

### Critical Auth Mapping Problem

DynamoDB uses **Cognito Identity IDs** as user keys (format: `us-east-1:<uuid>`). These are NOT the same as Facebook/Google user IDs. Cognito acts as a bridge:

```
Facebook User ID ──→ Cognito Identity ID ──→ DynamoDB userId
Google User ID   ──→ Cognito Identity ID ──→ DynamoDB userId
```

When users log into the new app via Supabase Auth (which uses Facebook/Google user IDs directly), we need to map them back to their existing data. The AWS API `cognito-identity:list-identities` can export the full mapping of Cognito Identity ID → linked Facebook/Google user ID.

---

## 4. S3 Bucket (In-App Ads)

- **Bucket**: `pourcost.29labs.com`
- **Objects**: 35 total
- **Content**: Ad creative images + JSON config files for an in-app ad carousel

### Folder Structure
```
2020-palmbay/
2021-pdxcw-masterful-management/
2022-palmbay/
2023-palmbay/
config.json              (active config, last modified Feb 10, 2023)
config-2021.json
config-pdxcw-2021.json
config-pdxcw-2021-alt.json
config_bevcon.json
config_industryjuice.json
config_test.json
previous-config.json
colorcost.config.json
```

### Active Config Structure (`config.json`)
```json
{
  "ads": [
    {
      "id": "2023-001",
      "name": "2023-001",
      "imageUrl": "https://s3.amazonaws.com/pourcost.29labs.com/2023-palmbay/001.jpg",
      "backgroundColor": { "r": 255, "g": 255, "b": 255 },
      "delayMs": 6000,
      "destinationUrl": "https://www.palmbay.com/spirits-brands"
    }
  ]
}
```

Currently 9 Palm Bay ads in the active config. This can be migrated to Supabase Storage or kept as-is initially.

---

## 5. Proposed Supabase Schema

### `profiles` table (user accounts)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  legacy_cognito_id TEXT UNIQUE,  -- e.g., "us-east-1:c81321e7-..."
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_cognito_id ON profiles(legacy_cognito_id);
```

### `ingredients` table
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legacy_id UUID,  -- original DynamoDB sort key UUID
  name TEXT NOT NULL,
  product_cost NUMERIC(10,2),
  product_size_value NUMERIC(10,2),
  product_size_unit TEXT DEFAULT 'milliliters',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ingredients_user ON ingredients(user_id);
CREATE INDEX idx_ingredients_legacy ON ingredients(legacy_id);
```

### `cocktails` table
```sql
CREATE TABLE cocktails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legacy_id UUID,  -- original DynamoDB sort key UUID
  name TEXT NOT NULL,
  pour_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cocktails_user ON cocktails(user_id);
```

### `cocktail_ingredients` junction table (normalizes the nested array)
```sql
CREATE TABLE cocktail_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cocktail_id UUID NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  pour_size_value NUMERIC(10,2),
  pour_size_unit TEXT DEFAULT 'milliliters',
  pour_size_scale TEXT DEFAULT 'metric',
  UNIQUE(cocktail_id, ingredient_id)
);

CREATE INDEX idx_ci_cocktail ON cocktail_ingredients(cocktail_id);
CREATE INDEX idx_ci_ingredient ON cocktail_ingredients(ingredient_id);
```

### `ad_config` table (optional, replaces S3 config)
```sql
CREATE TABLE ad_config (
  id TEXT PRIMARY KEY,
  name TEXT,
  image_url TEXT,
  background_color JSONB,
  delay_ms INTEGER DEFAULT 6000,
  destination_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER
);
```

### Row Level Security (RLS)
```sql
-- Users can only see/modify their own data
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ingredients"
  ON ingredients FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own cocktails"
  ON cocktails FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own cocktail_ingredients"
  ON cocktail_ingredients FOR ALL
  USING (
    cocktail_id IN (SELECT id FROM cocktails WHERE user_id = auth.uid())
  );

-- Ad config is public read
ALTER TABLE ad_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ads"
  ON ad_config FOR SELECT
  USING (true);
```

---

## 6. Migration Strategy

### Phase 1: Export from AWS

1. **Export DynamoDB tables** using AWS CLI:
   ```bash
   aws dynamodb scan --table-name PourCost_Ingredients --output json > ingredients_export.json
   aws dynamodb scan --table-name PourCost_Cocktails --output json > cocktails_export.json
   ```
   Note: For tables > 1MB response, use pagination with `--starting-token`.

2. **Export Cognito identity mappings**:
   ```bash
   aws cognito-identity list-identities \
     --identity-pool-id "us-east-1:eba02a7c-fbaa-4f84-bcf5-59184b70ed53" \
     --max-results 60 \
     --output json > identities_batch1.json
   ```
   Paginate through all 14,006 identities. Each identity includes:
   ```json
   {
     "IdentityId": "us-east-1:c81321e7-...",
     "Logins": ["graph.facebook.com", "accounts.google.com"]
   }
   ```
   Then for each identity, call `describe-identity` to get the actual provider user ID:
   ```bash
   aws cognito-identity describe-identity \
     --identity-id "us-east-1:c81321e7-..."
   ```

3. **Download S3 ad assets** (optional):
   ```bash
   aws s3 sync s3://pourcost.29labs.com ./pourcost-s3-backup/
   ```

### Phase 2: Set Up Supabase

1. Create Supabase project
2. Run the SQL schema above
3. Configure Supabase Auth with:
   - **Facebook Login**: Use Facebook App ID `1522826757747836` (same app, just add Supabase's redirect URI to Facebook app settings)
   - **Google Login**: Configure with the Google Client ID from the app code

### Phase 3: Build Identity Bridge

Create a `user_identity_map` migration table (temporary):
```sql
CREATE TABLE user_identity_map (
  cognito_identity_id TEXT PRIMARY KEY,
  provider TEXT,           -- 'facebook' or 'google'
  provider_user_id TEXT,   -- the actual FB/Google user ID
  supabase_user_id UUID,   -- filled in when user first logs into new app
  migrated BOOLEAN DEFAULT false
);
```

Populate from the Cognito export. When a user logs into the new app:
1. Supabase Auth returns their Facebook/Google user ID
2. Look up that provider user ID in `user_identity_map`
3. Find the corresponding `cognito_identity_id`
4. Link their new Supabase `auth.users` record to the existing data via `profiles.legacy_cognito_id`
5. Re-key their ingredients and cocktails to point to the new Supabase user ID

### Phase 4: Data Migration

Write a migration script that:
1. Reads each DynamoDB ingredient → inserts into `ingredients` table with `legacy_id` preserved
2. Reads each DynamoDB cocktail → inserts into `cocktails` table
3. For each cocktail's nested `ingredients` array → inserts into `cocktail_ingredients` junction table, linking via `legacy_id`
4. Parses the `productSize` and `pourSize` string format (`"unit:value"`) into separate `_value` and `_unit` columns
5. Converts string costs to numeric values

### Phase 5: Testing

1. Create a test account via the current app (Facebook login)
2. Add some test ingredients and cocktails
3. Run the migration
4. Log into the new Supabase-backed app with the same Facebook account
5. Verify all test data appears correctly

---

## 7. Key Decisions & Notes

- **Facebook login must be preserved** for existing users. Don't drop it.
- **Google login** was added ~3 years ago (newer users). Also preserve.
- **No existing users should lose data** — this is the #1 priority.
- **Re-authentication**: When users first open the new app, they'll log in with Facebook/Google via Supabase Auth. The migration bridge will silently link them to their existing data. From the user's perspective, they just log in and everything is there.
- **14,006 total identities** but only ~9 active monthly — most are dormant. Still, migrate all data.
- **Product size/pour size parsing**: The `"unit:value"` string format needs to be split. Consider whether to keep the raw string as a fallback column during migration.
- **Cognito IAM roles are missing**: Both `Cognito_PourCostAuth_Role` and `Cognito_PourCostUnauth_Role` couldn't be found, suggesting they may have been deleted. This doesn't affect migration since we're moving away from AWS IAM entirely.
- **S3 ads**: Can stay on S3 initially and be migrated to Supabase Storage later, or just update the config to point to new URLs.
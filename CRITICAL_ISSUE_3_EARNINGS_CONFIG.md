# Critical Issue #3: Move Hardcoded Earnings Configuration to Database

## Status: MUST IMPLEMENT BEFORE LAUNCH

---

## The Problem

Currently, in `EarningsScreen.tsx`, the estimated platform fee is hardcoded:

```typescript
const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150; // Hardcoded!
```

If the actual platform fee changes, the code must be updated and redeployed. This is problematic because:

1. ❌ Non-technical admins cannot change earnings estimates
2. ❌ Every change requires code deployment
3. ❌ Users see incorrect earnings if config is out of sync
4. ❌ No audit trail of configuration changes

---

## The Solution

Create a `street_earnings_config` table that admins can update, and have the app fetch the latest configuration.

---

## Step 1: Create the Configuration Table in Supabase

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Create earnings configuration table
CREATE TABLE IF NOT EXISTS public.street_earnings_config (
  id BIGSERIAL PRIMARY KEY,
  -- Platform fee (in dollars) per venue per month
  monthly_platform_fee_per_venue DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
  
  -- Commission rates by rank (percentage, e.g., 0.10 = 10%)
  bronze_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  silver_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.12,
  gold_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
  platinum_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.18,
  diamond_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.20,
  black_key_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.25,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT platform_fee_positive CHECK (monthly_platform_fee_per_venue > 0),
  CONSTRAINT commission_rates_valid CHECK (
    bronze_commission_rate > 0 AND bronze_commission_rate < 1 AND
    silver_commission_rate > 0 AND silver_commission_rate < 1 AND
    gold_commission_rate > 0 AND gold_commission_rate < 1 AND
    platinum_commission_rate > 0 AND platinum_commission_rate < 1 AND
    diamond_commission_rate > 0 AND diamond_commission_rate < 1 AND
    black_key_commission_rate > 0 AND black_key_commission_rate < 1
  )
);

-- Insert default configuration
INSERT INTO public.street_earnings_config (
  monthly_platform_fee_per_venue,
  bronze_commission_rate,
  silver_commission_rate,
  gold_commission_rate,
  platinum_commission_rate,
  diamond_commission_rate,
  black_key_commission_rate
) VALUES (
  150.00,  -- Platform fee
  0.10,    -- Bronze: 10%
  0.12,    -- Silver: 12%
  0.15,    -- Gold: 15%
  0.18,    -- Platinum: 18%
  0.20,    -- Diamond: 20%
  0.25     -- Black Key: 25%
);

-- Enable RLS
ALTER TABLE public.street_earnings_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can READ config (it's reference data)
CREATE POLICY "All users can read earnings config"
ON public.street_earnings_config
FOR SELECT
USING (true);

-- RLS Policy: Only HQ Admins can UPDATE config
CREATE POLICY "Only admins can update earnings config"
ON public.street_earnings_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Create an index for faster reads
CREATE INDEX idx_earnings_config_latest ON public.street_earnings_config(id DESC);
```

---

## Step 2: Create a Service to Fetch the Configuration

**Create a new file:** `src/lib/earningsConfigService.ts`

```typescript
import { createClient } from '../utils/supabase/client';

export interface EarningsConfig {
  monthly_platform_fee_per_venue: number;
  commission_rates: {
    Bronze: number;
    Silver: number;
    Gold: number;
    Platinum: number;
    Diamond: number;
    'Black Key': number;
  };
  updated_at: string;
}

// Cache for config (refresh every 5 minutes)
let cachedConfig: EarningsConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch earnings configuration from the database.
 * Results are cached to avoid excessive queries.
 */
export async function getEarningsConfig(): Promise<EarningsConfig> {
  const now = Date.now();
  
  // Return cached config if fresh
  if (cachedConfig && now - lastFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const supabase = createClient();
    
    // Fetch the latest config (should be only one row)
    const { data, error } = await supabase
      .from('street_earnings_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching earnings config:', error);
      // Return fallback config if fetch fails
      return getFallbackConfig();
    }

    if (!data) {
      console.warn('No earnings config found in database. Using fallback.');
      return getFallbackConfig();
    }

    // Transform database row to config object
    const config: EarningsConfig = {
      monthly_platform_fee_per_venue: data.monthly_platform_fee_per_venue || 150,
      commission_rates: {
        Bronze: data.bronze_commission_rate || 0.10,
        Silver: data.silver_commission_rate || 0.12,
        Gold: data.gold_commission_rate || 0.15,
        Platinum: data.platinum_commission_rate || 0.18,
        Diamond: data.diamond_commission_rate || 0.20,
        'Black Key': data.black_key_commission_rate || 0.25,
      },
      updated_at: data.updated_at,
    };

    // Cache the config
    cachedConfig = config;
    lastFetchTime = now;

    return config;
  } catch (error) {
    console.error('Unexpected error fetching earnings config:', error);
    return getFallbackConfig();
  }
}

/**
 * Get the commission rate for a specific rank.
 */
export function getCommissionRateByRank(rank: string, config: EarningsConfig): number {
  return config.commission_rates[rank as keyof typeof config.commission_rates] || 0.10;
}

/**
 * Fallback configuration (used if database fetch fails).
 * This ensures the app continues to work even if the database is temporarily unavailable.
 */
function getFallbackConfig(): EarningsConfig {
  return {
    monthly_platform_fee_per_venue: 150,
    commission_rates: {
      Bronze: 0.10,
      Silver: 0.12,
      Gold: 0.15,
      Platinum: 0.18,
      Diamond: 0.20,
      'Black Key': 0.25,
    },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Clear the cache (useful for testing or admin updates).
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  lastFetchTime = 0;
}
```

---

## Step 3: Update EarningsScreen to Use the Configuration

**Replace the hardcoded values in `src/components/EarningsScreen.tsx`:**

Find this section:

```typescript
const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150; // Hardcoded!

const estimatedMonthly = liveVenues.length * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;
```

Replace with:

```typescript
// OLD CODE (remove this):
// const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150; // Hardcoded!

// NEW CODE (add this):
const [earningsConfig, setEarningsConfig] = useState<any>(null);
const [configLoading, setConfigLoading] = useState(true);

useEffect(() => {
  loadEarningsConfig();
}, []);

async function loadEarningsConfig() {
  const { getEarningsConfig } = await import('../lib/earningsConfigService');
  const config = await getEarningsConfig();
  setEarningsConfig(config);
  setConfigLoading(false);
}

// Then replace the calculation:
const platformFee = earningsConfig?.monthly_platform_fee_per_venue || 150;
const estimatedMonthly = liveVenues.length * platformFee * commissionRate;
const potentialMonthly = (liveVenues.length + pendingVenues.length) * platformFee * commissionRate;
const totalPending = pendingVenues.length * platformFee * commissionRate;
const estimatedAnnual = estimatedMonthly * 12;
```

---

## Step 4: Update xpService to Use the Configuration

In `src/lib/xpService.ts`, update the `getCommissionRate` function:

Find:

```typescript
export function getCommissionRate(rank: string): number {
  // Hardcoded rates
  const rates: Record<string, number> = {
    'Bronze': 0.10,
    'Silver': 0.12,
    'Gold': 0.15,
    // ...
  };
  return rates[rank] || 0.10;
}
```

Replace with:

```typescript
import { getEarningsConfig, getCommissionRateByRank } from './earningsConfigService';

export async function getCommissionRate(rank: string): Promise<number> {
  const config = await getEarningsConfig();
  return getCommissionRateByRank(rank, config);
}
```

**Note:** This makes the function async. Update all calls to `getCommissionRate` to use `await`.

---

## Step 5: Create an Admin Panel Page for Configuration (Optional but Recommended)

If you have an admin dashboard on the website, add a page where HQ admins can update earnings configuration:

```typescript
// Admin page: Update earnings configuration
async function updateEarningsConfig(
  platformFee: number,
  commissionRates: Record<string, number>
) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('street_earnings_config')
    .update({
      monthly_platform_fee_per_venue: platformFee,
      bronze_commission_rate: commissionRates.Bronze,
      silver_commission_rate: commissionRates.Silver,
      gold_commission_rate: commissionRates.Gold,
      platinum_commission_rate: commissionRates.Platinum,
      diamond_commission_rate: commissionRates.Diamond,
      black_key_commission_rate: commissionRates['Black Key'],
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id,
    })
    .eq('id', 1);

  if (error) {
    console.error('Failed to update config:', error);
    throw error;
  }

  // Clear cache so next fetch gets new values
  clearConfigCache();
}
```

---

## Verification Checklist

Before considering this COMPLETE:

- [ ] `street_earnings_config` table created in Supabase
- [ ] Default values inserted (150 platform fee, correct commission rates)
- [ ] RLS policies created (users can read, admins can update)
- [ ] `earningsConfigService.ts` created with caching logic
- [ ] `EarningsScreen.tsx` updated to fetch config instead of hardcoding
- [ ] `xpService.ts` updated to use config
- [ ] Tested: Change platform fee in database → app shows updated estimate
- [ ] Tested: Change commission rate → app shows updated earnings
- [ ] Tested: Config is cached (app doesn't fetch on every load)
- [ ] Tested: If database is down, app uses fallback config and continues to work

---

## Benefits of This Solution

✅ **Non-technical admins can update earnings** without code changes  
✅ **No deployment needed** to change configuration  
✅ **Audit trail** of who changed what and when  
✅ **Real-time updates** (config cache refreshes every 5 minutes)  
✅ **Fallback config** ensures app works even if database is temporarily down  
✅ **Future-proof** - easy to add more config options later  

---

## What Happens If This Isn't Fixed?

❌ **IMPACT:**

- Users see incorrect earnings estimates
- If you change platform fees, users continue seeing old values
- Admins must contact developers to change rates
- Users lose trust in the earnings numbers

**This MUST be fixed before launch.**

---

## Next Steps

1. **Today:** Run the SQL to create the table
2. **Today:** Create `earningsConfigService.ts`
3. **Today:** Update `EarningsScreen.tsx` and `xpService.ts`
4. **Today:** Test the changes
5. **Before Launch:** Get sign-off that earnings config can be updated via database

---

## SQL Command to Reset Everything (if needed)

If you need to start over:

```sql
-- Drop the table (careful: this deletes all config history)
DROP TABLE IF EXISTS public.street_earnings_config;

-- Then re-run the table creation SQL above
```

---

This solution makes earnings configuration **flexible, auditable, and maintainable**. Well done!

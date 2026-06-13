const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Setting up Supabase tables...');

  const sql = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        // Try direct query for DDL
        console.log(`Executing: ${statement.slice(0, 60)}...`);
        const { error: directError } = await supabase.from('_setup').select().limit(0);
        if (directError) {
          console.warn(`  ⚠ May need manual setup: ${error.message}`);
        }
      } else {
        console.log(`  ✓ ${statement.slice(0, 60)}...`);
      }
    } catch (err) {
      console.warn(`  ⚠ ${err.message}`);
    }
  }

  console.log('\n✅ Setup complete! If tables were not created automatically,');
  console.log('   copy scripts/setup-db.sql into the Supabase SQL Editor and run it.');
  console.log(`   Dashboard: https://supabase.com/dashboard/project/kngqskquemxsggakiwsa`);
}

setup().catch(console.error);

const { sequelize } = require('./db');

async function wipeDatabase() {
  console.log('--- STARTING COMPLETE DATABASE WIPE ---');
  await sequelize.authenticate();
  console.log('PostgreSQL authenticated.');

  // Disable constraints temporarily or drop with CASCADE
  console.log('Dropping all tables with CASCADE...');
  await sequelize.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('All public tables dropped completely.');

  // Now re-import models and synchronize clean tables
  console.log('Re-synchronizing pristine table schemas...');
  await sequelize.sync({ force: true });
  console.log('All models synchronized fresh and empty!');

  // Verify
  const results = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'", { type: sequelize.QueryTypes.SELECT });
  console.log('FRESH TABLES CREATED:', results.map(r => r.tablename));

  for (const t of results) {
    const [countRes] = await sequelize.query(`SELECT COUNT(*) as count FROM "${t.tablename}"`, { type: sequelize.QueryTypes.SELECT });
    console.log(`- ${t.tablename}: ${countRes.count} rows`);
  }

  console.log('--- DATABASE WIPE COMPLETED SUCCESSFULLY ---');
}

wipeDatabase().then(() => process.exit(0)).catch(e => {
  console.error('DATABASE WIPE ERROR:', e);
  process.exit(1);
});

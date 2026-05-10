-- Step 1: Create a default organization if none exists
INSERT INTO organizations (name)
SELECT 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- Step 2: Create a default project for the default organization
INSERT INTO projects (name, organization_id)
SELECT 'Default Project', (SELECT id FROM organizations LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects);

-- Step 3: Assign existing records to the default project if project_id is null
UPDATE users SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE deal SET project_id = (SELECT id FROM projects LIMIT 1) WHERE project_id IS NULL;
UPDATE client SET project_id = (SELECT id FROM projects LIMIT 1) WHERE project_id IS NULL;
UPDATE task SET project_id = (SELECT id FROM projects LIMIT 1) WHERE project_id IS NULL;
UPDATE chat_sessions SET project_id = (SELECT id FROM projects LIMIT 1) WHERE project_id IS NULL;

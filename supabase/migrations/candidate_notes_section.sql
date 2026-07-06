-- Add section identifier to candidate notes so notes can be scoped
-- to a specific profile section (skills, industry, roles, keywords, recruiter).
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS section text;

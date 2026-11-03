ALTER TABLE cultures ADD COLUMN parent_id TEXT REFERENCES cultures(id);
CREATE INDEX cultures_parent ON cultures(parent_id);

-- ===================================================================
-- MIGRATION: 002_seed_categories.sql
-- Description: Comprehensive seed data for categories (15+ categories)
-- Author: Database Architect Agent
-- Date: 2025-08-30
-- Dependencies: 001_initial_schema.sql
-- ===================================================================

BEGIN;

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_seed_categories') THEN
        RAISE NOTICE 'Migration 002_seed_categories already applied, skipping...';
        ROLLBACK;
    END IF;
END $$;

-- Clear existing seed data if any (for clean re-seeding)
DELETE FROM categories;

-- Reset the sequence to start from 1
ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- ===================================================================
-- COMPREHENSIVE CATEGORY SEED DATA
-- ===================================================================

INSERT INTO categories (name, domain, css_category, theme_tokens, notes, is_active, sort_order) VALUES
-- Literature Categories (Human)
('Classic Literature', 'literature', 'grain', 
 '{"palette":{"bg":"#1b1a17","surface":"#23221f","text":"#f3f4f6","accent":"#d97706"},"anim":{"enter":"fade-in 300ms"}}',
 'Public-domain classics: novels, poetry, plays from established literary canon', true, 10),

('Modern Fiction', 'literature', 'zen-edge',
 '{"palette":{"bg":"#0f172a","surface":"#111827","text":"#e5e7eb","accent":"#3b82f6"}}',
 'Contemporary fiction and literary works from 20th-21st century', true, 20),

('Sci-Fi Literature', 'literature', 'spark',
 '{"palette":{"bg":"#0b0f0e","surface":"#18231f","text":"#eaf2ef","accent":"#22d3ee"}}',
 'Science fiction novels, short stories with speculative themes', true, 30),

('Fantasy Literature', 'literature', 'shuffle',
 '{"palette":{"bg":"#0c0a09","surface":"#1c1917","text":"#fafaf9","accent":"#22c55e"}}',
 'Fantasy novels, epic tales with magical and mythical elements', true, 40),

('Historical Fiction', 'literature', 'quartz',
 '{"palette":{"bg":"#101828","surface":"#1f2937","text":"#e5e7eb","accent":"#f59e0b"}}',
 'Historical novels set in specific time periods with period accuracy', true, 50),

('Poetry & Verse', 'literature', 'grain',
 '{"palette":{"bg":"#1a1710","surface":"#252015","text":"#f4f3f0","accent":"#a78bfa"}}',
 'Classic and modern poetry, verse forms, lyrical compositions', true, 60),

-- Non-fiction Categories (Human)
('Academic Writing', 'nonfiction', 'river',
 '{"palette":{"bg":"#0d1321","surface":"#1d2d44","text":"#e0e1dd","accent":"#3a86ff"}}',
 'Scholarly articles, research papers, academic discourse', true, 70),

('Philosophy', 'nonfiction', 'void',
 '{"palette":{"bg":"#0a0a0a","surface":"#121212","text":"#f5f5f5","accent":"#7c3aed"}}',
 'Philosophical treatises, ethical discussions, metaphysical inquiry', true, 80),

('News & Journalism', 'nonfiction', 'zen-edge',
 '{"palette":{"bg":"#0a0a0a","surface":"#101010","text":"#f0f0f0","accent":"#ef4444"}}',
 'News articles, investigative journalism, reportage style', true, 90),

('Legal & Policy', 'nonfiction', 'quartz',
 '{"palette":{"bg":"#101828","surface":"#1f2937","text":"#e5e7eb","accent":"#f59e0b"}}',
 'Legal documents, policy papers, formal governmental language', true, 100),

('Biography & Memoir', 'nonfiction', 'grain',
 '{"palette":{"bg":"#1b1a17","surface":"#23221f","text":"#f3f4f6","accent":"#06b6d4"}}',
 'Personal narratives, life stories, autobiographical accounts', true, 110),

('Scientific Writing', 'nonfiction', 'river',
 '{"palette":{"bg":"#0d1321","surface":"#1d2d44","text":"#e0e1dd","accent":"#10b981"}}',
 'Scientific papers, research findings, technical explanations', true, 120),

-- AI-Generated Categories
('AI: Corporate Speak', 'ai_expository', 'zen-edge',
 '{"palette":{"bg":"#111827","surface":"#0f172a","text":"#e5e7eb","accent":"#06b6d4"}}',
 'AI-generated corporate communications, business jargon, sanitized tone', true, 200),

('AI: Flowery Prose', 'ai_narrative', 'spark',
 '{"palette":{"bg":"#0b0f0e","surface":"#14201b","text":"#eaf2ef","accent":"#f59e0b"}}',
 'AI-generated overly ornate, purple prose with excessive adjectives', true, 210),

('AI: Generic Blog', 'ai_expository', 'void',
 '{"palette":{"bg":"#0a0a0a","surface":"#111111","text":"#f0f0f0","accent":"#8b5cf6"}}',
 'AI-generated blog posts, listicles, SEO-optimized content', true, 220),

('AI: Historical Pastiche', 'ai_narrative', 'grain',
 '{"palette":{"bg":"#1b1a17","surface":"#23221f","text":"#f3f4f6","accent":"#a78bfa"}}',
 'AI attempting to mimic historical writing styles, often with tells', true, 230),

('AI: Academic Mimicry', 'ai_expository', 'river',
 '{"palette":{"bg":"#0d1321","surface":"#1d2d44","text":"#e0e1dd","accent":"#ef4444"}}',
 'AI-generated pseudo-academic writing with characteristic patterns', true, 240),

('AI: Creative Writing', 'ai_narrative', 'shuffle',
 '{"palette":{"bg":"#0c0a09","surface":"#1c1917","text":"#fafaf9","accent":"#fb7185"}}',
 'AI-generated creative fiction with typical AI narrative patterns', true, 250),

-- Additional Human Categories
('Travel Writing', 'nonfiction', 'zen-edge',
 '{"palette":{"bg":"#0f172a","surface":"#111827","text":"#e5e7eb","accent":"#14b8a6"}}',
 'Travel narratives, cultural observations, geographical descriptions', true, 130),

('Technical Manuals', 'nonfiction', 'quartz',
 '{"palette":{"bg":"#101828","surface":"#1f2937","text":"#e5e7eb","accent":"#6366f1"}}',
 'User manuals, technical documentation, instructional writing', true, 140);

-- ===================================================================
-- VALIDATION AND STATISTICS
-- ===================================================================

-- Verify all categories were inserted
DO $$
DECLARE
    category_count INT;
    active_count INT;
    domain_counts RECORD;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories;
    SELECT COUNT(*) INTO active_count FROM categories WHERE is_active = true;
    
    RAISE NOTICE 'Total categories inserted: %', category_count;
    RAISE NOTICE 'Active categories: %', active_count;
    
    -- Show distribution by domain
    FOR domain_counts IN 
        SELECT domain, COUNT(*) as count 
        FROM categories 
        GROUP BY domain 
        ORDER BY domain
    LOOP
        RAISE NOTICE 'Domain % has % categories', domain_counts.domain, domain_counts.count;
    END LOOP;
    
    -- Validate we have at least 15 categories
    IF category_count < 15 THEN
        RAISE EXCEPTION 'Expected at least 15 categories, got %', category_count;
    END IF;
END $$;

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('002_seed_categories', 'Comprehensive seed data with 20 categories across literature, nonfiction, and AI domains');

-- Success message
RAISE NOTICE 'Migration 002_seed_categories completed successfully';

COMMIT;
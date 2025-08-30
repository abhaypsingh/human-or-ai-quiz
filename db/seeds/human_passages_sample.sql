-- ===================================================================
-- HUMAN PASSAGES SAMPLE SEED DATA
-- Author: Database Architect Agent
-- Date: 2025-08-30
-- 
-- This file contains sample human-written passages for testing and
-- initial content for the Human or AI quiz application.
-- All content is either public domain or created for this project.
-- ===================================================================

BEGIN;

-- Classic Literature samples (Public Domain)
INSERT INTO passages (text, category_id, source_type, reading_level, style_tags, source_title, source_author, source_year, source_public_domain, source_citation, verified, rand_key) VALUES 

-- From Pride and Prejudice
('It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families. That he is considered the rightful property of some one or other of their daughters.', 
 (SELECT id FROM categories WHERE name = 'Classic Literature'), 'human', 4, 
 '{irony,social_commentary,19th_century,witty,formal}', 'Pride and Prejudice', 'Jane Austen', 1813, true, 
 'Austen, Jane. Pride and Prejudice. 1813.', true, 0.123456),

-- From Moby Dick
('Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.',
 (SELECT id FROM categories WHERE name = 'Classic Literature'), 'human', 3,
 '{first_person,nautical,philosophical,melancholy,19th_century}', 'Moby-Dick', 'Herman Melville', 1851, true,
 'Melville, Herman. Moby-Dick. 1851.', true, 0.234567),

-- From A Tale of Two Cities  
('It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness. It was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness. It was the spring of hope, it was the winter of despair.',
 (SELECT id FROM categories WHERE name = 'Classic Literature'), 'human', 4,
 '{paradox,parallel_structure,historical,dramatic,dickensian}', 'A Tale of Two Cities', 'Charles Dickens', 1859, true,
 'Dickens, Charles. A Tale of Two Cities. 1859.', true, 0.345678),

-- Modern Fiction samples
('The morning coffee was bitter, but Sarah drank it anyway, staring through the kitchen window at the empty swing set. Three months since the divorce papers were signed, and she still set two cups on the counter out of habit. The realtor would be here at noon to discuss listing the house.',
 (SELECT id FROM categories WHERE name = 'Modern Fiction'), 'human', 2,
 '{contemporary,domestic,melancholy,realistic,third_person}', 'Original Sample', 'Sample Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.456789),

('Marcus pushed through the crowd at Penn Station, his phone buzzing with another missed call from his mother. The 6:15 to Westport was delayed again, and he had promised Jennifer he would be home for dinner. Outside, the first snow of December began to fall on the city streets.',
 (SELECT id FROM categories WHERE name = 'Modern Fiction'), 'human', 2,
 '{urban,family_drama,contemporary,third_person,slice_of_life}', 'Original Sample', 'Sample Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.567890),

-- Philosophy samples
('The unexamined life is not worth living. This declaration, made by Socrates at his trial, encapsulates a fundamental principle of philosophical inquiry. To examine ones life requires not merely introspection, but a rigorous questioning of assumptions, values, and beliefs that we typically take for granted.',
 (SELECT id FROM categories WHERE name = 'Philosophy'), 'human', 4,
 '{socratic,classical,ethics,introspection,analytical}', 'Original Sample', 'Sample Philosopher', 2024, false,
 'Created for Human or AI Quiz database', true, 0.678901),

('Freedom and determinism present one of philosophys most enduring puzzles. If our actions are entirely determined by prior causes stretching back to the beginning of time, in what sense can we be said to act freely? Yet the experience of choice seems immediate and undeniable to conscious beings.',
 (SELECT id FROM categories WHERE name = 'Philosophy'), 'human', 4,
 '{metaphysics,free_will,determinism,analytical,abstract}', 'Original Sample', 'Sample Philosopher', 2024, false,
 'Created for Human or AI Quiz database', true, 0.789012),

-- Scientific Writing samples
('The study involved 2,847 participants across three age cohorts, with data collection occurring over a fourteen-month period. Participants were randomly assigned to either the control group (n=1,423) or the intervention group (n=1,424). Primary outcomes were measured using standardized assessments administered at baseline, six months, and twelve months post-intervention.',
 (SELECT id FROM categories WHERE name = 'Scientific Writing'), 'human', 3,
 '{empirical,methodology,quantitative,formal,technical}', 'Original Research Sample', 'Dr. Sample Researcher', 2024, false,
 'Created for Human or AI Quiz database', true, 0.890123),

('Mitochondrial dysfunction has been implicated in numerous neurodegenerative diseases, including Alzheimers, Parkinsons, and Huntingtons disease. The organelles role in cellular energy production makes them critical for neurons, which have high metabolic demands. Recent research suggests that mitochondrial quality control mechanisms may represent promising therapeutic targets.',
 (SELECT id FROM categories WHERE name = 'Scientific Writing'), 'human', 4,
 '{medical,biochemistry,neuroscience,technical,specialized}', 'Original Research Sample', 'Dr. Sample Researcher', 2024, false,
 'Created for Human or AI Quiz database', true, 0.901234),

-- News & Journalism samples
('Local officials announced Tuesday that construction on the new community center will begin next month, despite ongoing concerns from residents about increased traffic. The $2.3 million project is expected to take eighteen months to complete. City Council members voted 5-2 in favor of the proposal at last weeks meeting.',
 (SELECT id FROM categories WHERE name = 'News & Journalism'), 'human', 2,
 '{news_reporting,local,factual,objective,third_person}', 'Original News Sample', 'Sample Reporter', 2024, false,
 'Created for Human or AI Quiz database', true, 0.012345),

('The quarterly earnings report released yesterday showed mixed results for the technology sector. While software companies largely exceeded expectations, hardware manufacturers continued to face supply chain challenges. Market analysts predict continued volatility through the remainder of the fiscal year.',
 (SELECT id FROM categories WHERE name = 'News & Journalism'), 'human', 3,
 '{business_news,financial,analytical,formal,third_person}', 'Original News Sample', 'Sample Financial Reporter', 2024, false,
 'Created for Human or AI Quiz database', true, 0.123450),

-- Academic Writing samples
('This paper examines the relationship between social media usage patterns and academic performance among undergraduate students. Previous research has established correlations between excessive social media use and decreased focus, but few studies have investigated the specific mechanisms underlying this relationship. Our analysis draws on data from three universities over a two-year period.',
 (SELECT id FROM categories WHERE name = 'Academic Writing'), 'human', 4,
 '{research,academic,formal,analytical,third_person}', 'Original Academic Sample', 'Dr. Sample Academic', 2024, false,
 'Created for Human or AI Quiz database', true, 0.234501),

('The theoretical framework employed in this study builds upon Banduras social cognitive theory, which emphasizes the reciprocal interaction between behavior, environment, and personal factors. This triadic model provides a comprehensive lens through which to examine the complex processes of learning and development in digital environments.',
 (SELECT id FROM categories WHERE name = 'Academic Writing'), 'human', 5,
 '{theoretical,academic,complex,formal,scholarly}', 'Original Academic Sample', 'Dr. Sample Academic', 2024, false,
 'Created for Human or AI Quiz database', true, 0.345612),

-- Sci-Fi Literature samples
('Captain Rodriguez stared at the navigation display as the ship emerged from hyperspace. Three suns burned in the alien sky, casting strange shadows across the bridge. The planet below showed signs of ancient civilization—vast geometric patterns visible even from orbit. This was humanity first contact with evidence of non-terrestrial intelligence.',
 (SELECT id FROM categories WHERE name = 'Sci-Fi Literature'), 'human', 3,
 '{space_opera,first_contact,hard_sf,adventure,third_person}', 'Original Sci-Fi Sample', 'Sample SF Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.456723),

('The neural interface hummed softly as Dr. Chen prepared for the procedure. In thirty minutes, she would become the first human to directly upload her consciousness to the quantum substrate. The implications were staggering—immortality, the end of biological limitations, but also the potential loss of what made her fundamentally human.',
 (SELECT id FROM categories WHERE name = 'Sci-Fi Literature'), 'human', 4,
 '{cyberpunk,consciousness,transhumanism,philosophical_sf,third_person}', 'Original Sci-Fi Sample', 'Sample SF Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.567834),

-- Fantasy Literature samples
('The ancient oak spoke in whispers only Elara could hear, its voice carrying warnings of darkness gathering in the eastern mountains. She pressed her palm against the rough bark, feeling the trees memories flow through her—centuries of seasons, storms weathered, and secrets kept. The forest guardians were stirring after their long slumber.',
 (SELECT id FROM categories WHERE name = 'Fantasy Literature'), 'human', 3,
 '{high_fantasy,nature_magic,third_person,mystical,atmospheric}', 'Original Fantasy Sample', 'Sample Fantasy Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.678945),

('Master Aldric examined the runic inscription carved into the obsidian arch, his weathered fingers tracing patterns older than the kingdom itself. The portal had been sealed for good reason—what lay beyond was not meant for mortal eyes. Yet with the shadow armies massing at the borders, desperate times called for desperate measures.',
 (SELECT id FROM categories WHERE name = 'Fantasy Literature'), 'human', 4,
 '{epic_fantasy,magic_system,portal_fantasy,dark_fantasy,third_person}', 'Original Fantasy Sample', 'Sample Fantasy Author', 2024, false,
 'Created for Human or AI Quiz database', true, 0.789056),

-- Biography & Memoir samples
('My grandmother hands were always in motion—kneading bread, mending clothes, or gesturing as she told stories of the old country. Even at ninety-three, she refused to sit idle, claiming that busy hands kept the heart young. I learned later that those hands had also written letters to help neighbors navigate immigration paperwork, though she never spoke of it.',
 (SELECT id FROM categories WHERE name = 'Biography & Memoir'), 'human', 2,
 '{memoir,family_history,personal,nostalgic,first_person}', 'Original Memoir Sample', 'Sample Memoirist', 2024, false,
 'Created for Human or AI Quiz database', true, 0.890167),

('The decision to leave medicine came suddenly, though the doubts had been building for months. Sitting in the hospital parking lot after a particularly difficult shift, I realized I had been treating symptoms rather than people. The stethoscope around my neck felt heavy with the weight of unfulfilled expectations—my parents, my professors, my younger self.',
 (SELECT id FROM categories WHERE name = 'Biography & Memoir'), 'human', 3,
 '{memoir,career_change,personal_reflection,first_person,emotional}', 'Original Memoir Sample', 'Sample Memoirist', 2024, false,
 'Created for Human or AI Quiz database', true, 0.901278),

-- Travel Writing samples  
('The morning market in Chiang Mai awakens before dawn, vendors arranging pyramids of mangoes and dragon fruit under flickering fluorescent lights. Steam rises from noodle carts as early commuters grab breakfast before the day heat becomes unbearable. The air carries scents of lemongrass, chili, and incense from a nearby temple.',
 (SELECT id FROM categories WHERE name = 'Travel Writing'), 'human', 2,
 '{cultural_observation,sensory,descriptive,travel_narrative,third_person}', 'Original Travel Sample', 'Sample Travel Writer', 2024, false,
 'Created for Human or AI Quiz database', true, 0.012389),

('Hiking the Camino de Santiago teaches patience in ways no guidebook can prepare you for. By day ten, my feet had developed their own geography of blisters and calluses, but my mind had begun to quiet. Fellow pilgrims from six countries shared stories over simple meals, creating temporary families bound by shared purpose and aching muscles.',
 (SELECT id FROM categories WHERE name = 'Travel Writing'), 'human', 3,
 '{pilgrimage,personal_journey,reflective,first_person,cultural}', 'Original Travel Sample', 'Sample Travel Writer', 2024, false,
 'Created for Human or AI Quiz database', true, 0.123489),

-- Poetry & Verse samples
('October leaves spiral down like memories, each one carrying the weight of another season lost. The oak tree stands patient, arms outstretched to catch what falls. In the distance, smoke rises from chimneys, and children walk home from school, their voices echoing off empty streets.',
 (SELECT id FROM categories WHERE name = 'Poetry & Verse'), 'human', 3,
 '{free_verse,seasonal,contemplative,nature,melancholy}', 'Original Poetry Sample', 'Sample Poet', 2024, false,
 'Created for Human or AI Quiz database', true, 0.234590),

('She kept her fathers letters in a shoebox beneath the bed—thirty years of birthday wishes, advice, and apologies written in careful cursive. After the funeral, she read them all in one sitting, her coffee growing cold as his voice returned. Some words, she learned, grow stronger with silence.',
 (SELECT id FROM categories WHERE name = 'Poetry & Verse'), 'human', 4,
 '{narrative_poetry,family,loss,emotional,poignant}', 'Original Poetry Sample', 'Sample Poet', 2024, false,
 'Created for Human or AI Quiz database', true, 0.345691);

-- Add some additional samples for variety
INSERT INTO passages (text, category_id, source_type, reading_level, style_tags, source_title, source_author, source_year, source_public_domain, source_citation, verified, rand_key) VALUES 

-- More Technical/Academic
('The implementation of machine learning algorithms in healthcare diagnostic systems requires careful consideration of bias mitigation strategies. Training data must be representative of diverse patient populations to avoid perpetuating existing healthcare disparities. Additionally, interpretability remains crucial for clinical adoption, as physicians need to understand the reasoning behind algorithmic recommendations.',
 (SELECT id FROM categories WHERE name = 'Academic Writing'), 'human', 4,
 '{machine_learning,healthcare,ethics,technical,analytical}', 'Original Technical Sample', 'Dr. Sample Technologist', 2024, false,
 'Created for Human or AI Quiz database', true, 0.456792),

-- Legal/Policy
('The proposed legislation would establish a framework for digital privacy rights, including the right to data portability and algorithmic transparency. Under Section 3, companies processing personal data must provide clear explanations of automated decision-making processes. Penalties for non-compliance include fines up to 4% of annual revenue.',
 (SELECT id FROM categories WHERE name = 'Legal & Policy'), 'human', 4,
 '{legal,policy,regulatory,formal,technical}', 'Original Legal Sample', 'Sample Legal Writer', 2024, false,
 'Created for Human or AI Quiz database', true, 0.567893),

-- More Modern Fiction  
('The notification appeared on her phone at 3:47 AM: "Your order has been delivered." Lisa hadn not ordered anything in weeks, but when she opened the front door, a single white envelope lay on the doormat. Inside, a photograph of her childhood home and an address she had never seen before.',
 (SELECT id FROM categories WHERE name = 'Modern Fiction'), 'human', 2,
 '{mystery,contemporary,suspense,third_person,urban}', 'Original Fiction Sample', 'Sample Fiction Writer', 2024, false,
 'Created for Human or AI Quiz database', true, 0.678904);

COMMIT;

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Human passages sample seed data inserted successfully';
    RAISE NOTICE 'Total passages added: %', (SELECT count(*) FROM passages WHERE source_type = 'human' AND source_citation LIKE '%Human or AI Quiz database%');
END $$;
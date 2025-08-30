-- ===================================================================
-- AI PASSAGES SAMPLE SEED DATA
-- Author: Database Architect Agent  
-- Date: 2025-08-30
-- 
-- This file contains sample AI-generated passages that exhibit
-- characteristic patterns of AI-generated text for the quiz database.
-- These are created to demonstrate typical AI writing patterns.
-- ===================================================================

BEGIN;

-- AI passages that demonstrate common AI writing patterns
INSERT INTO passages (text, category_id, source_type, reading_level, style_tags, generator_model, prompt_signature, verified, rand_key) VALUES 

-- AI: Corporate Speak
('In todays rapidly evolving business landscape, organizations must leverage cutting-edge technologies to optimize their operational efficiency. Furthermore, it is essential to emphasize that companies should prioritize sustainable practices to ensure long-term success. By implementing comprehensive strategies, businesses can potentially achieve unprecedented growth.',
 (SELECT id FROM categories WHERE name = 'AI: Corporate Speak'), 'ai', 3,
 '{corporate,buzzwords,generic,optimistic,verbose}', 'GPT-3.5-Turbo', 'Generate corporate communication about business strategy', true, 0.112233),

('It is important to note that customer satisfaction remains paramount in the digital transformation era. Organizations should arguably focus on streamlining their processes to deliver exceptional value propositions. In conclusion, companies must embrace innovative solutions to maintain their competitive advantage in the marketplace.',
 (SELECT id FROM categories WHERE name = 'AI: Corporate Speak'), 'ai', 3,
 '{corporate,hedging,transformation,generic,formal}', 'GPT-4', 'Create business-focused content with AI characteristics', true, 0.223344),

-- AI: Flowery Prose  
('The resplendent golden rays of the magnificent dawn cascaded gracefully through the crystalline windows, illuminating the enchanting chamber with ethereal brilliance. Each delicate beam danced whimsically across the ornate surfaces, creating a symphony of light and shadow that spoke to the very essence of beauty itself. The atmosphere was suffused with an ineffable sense of tranquility and wonder.',
 (SELECT id FROM categories WHERE name = 'AI: Flowery Prose'), 'ai', 4,
 '{ornate,excessive_adjectives,purple_prose,overwrought,flowery}', 'GPT-3.5-Turbo', 'Generate overly descriptive romantic prose', true, 0.334455),

('In the sublime tapestry of existence, each individual thread represents a precious and unique contribution to the magnificent whole. The intricate patterns woven throughout the fabric of life demonstrate the profound interconnectedness of all living beings. This remarkable phenomenon serves as a testament to the extraordinary beauty inherent in the natural world.',
 (SELECT id FROM categories WHERE name = 'AI: Flowery Prose'), 'ai', 4,
 '{metaphorical,overwrought,philosophical,excessive,pretentious}', 'Claude-2', 'Write flowery philosophical reflection', true, 0.445566),

-- AI: Generic Blog
('Are you looking to improve your productivity in 2024? Here are 5 essential tips that will transform your daily routine. First, establish a consistent morning routine that sets the tone for success. Second, prioritize your tasks using proven time management techniques.',
 (SELECT id FROM categories WHERE name = 'AI: Generic Blog'), 'ai', 2,
 '{listicle,self_help,generic_advice,clickbait,formulaic}', 'GPT-3.5-Turbo', 'Generate listicle about productivity tips', true, 0.556677),

('In todays fast-paced world, maintaining a healthy work-life balance can be challenging. However, by implementing simple strategies and making mindful choices, anyone can achieve greater fulfillment. The key is to start small and gradually build sustainable habits that align with your personal values.',
 (SELECT id FROM categories WHERE name = 'AI: Generic Blog'), 'ai', 2,
 '{self_help,generic,motivational,cliched,advice}', 'GPT-4', 'Write generic wellness blog post', true, 0.667788),

-- AI: Academic Mimicry
('This comprehensive analysis examines the multifaceted implications of contemporary social media platforms on adolescent psychological development. Previous research has established significant correlations between digital engagement patterns and various behavioral outcomes. However, it is essential to note that further investigation is required to fully understand the complex mechanisms underlying these phenomena.',
 (SELECT id FROM categories WHERE name = 'AI: Academic Mimicry'), 'ai', 4,
 '{pseudo_academic,verbose,hedging,formal,generic}', 'GPT-4', 'Mimic academic writing style with AI patterns', true, 0.778899),

('The theoretical framework employed in this study builds upon established methodologies while incorporating innovative approaches to data analysis. Furthermore, the research design addresses potential limitations through rigorous validation procedures. It should be emphasized that these findings contribute meaningfully to the existing body of knowledge in the field.',
 (SELECT id FROM categories WHERE name = 'AI: Academic Mimicry'), 'ai', 4,
 '{academic_jargon,methodology,verbose,impersonal,formal}', 'Claude-2', 'Generate academic-style methodology section', true, 0.889900),

-- AI: Historical Pastiche
('Verily, in those halcyon days of yore, the noble lords and fair maidens did gather in the grand hall for festivities most splendid. The resplendent tapestries adorned the walls with their intricate designs, whilst the melodious strains of the minstrels lute filled the air. Such merriment and joy did reign supreme throughout the enchanted evening.',
 (SELECT id FROM categories WHERE name = 'AI: Historical Pastiche'), 'ai', 3,
 '{archaic,pseudo_medieval,overwrought,anachronistic,stilted}', 'GPT-3.5-Turbo', 'Attempt medieval style writing', true, 0.990011),

('In the distinguished era of the Victorian gentleman, it was customary for persons of refined breeding to conduct themselves with utmost propriety. The elaborate social customs of the time demanded strict adherence to established protocols of etiquette and decorum. Such conventions served to maintain the delicate balance of civilized society.',
 (SELECT id FROM categories WHERE name = 'AI: Historical Pastiche'), 'ai', 4,
 '{victorian_pastiche,formal,antiquated,generic_period,stilted}', 'GPT-4', 'Mimic Victorian writing style', true, 0.001122),

-- AI attempting Modern Fiction
('Sarah sat at the kitchen table, contemplating the important decisions that lay ahead in her life journey. The morning sunlight streamed through the window, creating a sense of hope and possibility for the future. She realized that this moment represented a significant turning point in her personal growth and development.',
 (SELECT id FROM categories WHERE name = 'Modern Fiction'), 'ai', 2,
 '{generic_names,life_lessons,cliched,motivational,stilted}', 'GPT-3.5-Turbo', 'Generate contemporary fiction with AI patterns', true, 0.112244),

('John walked down the busy city street, observing the diverse array of people going about their daily activities. Each individual seemed to represent a unique story and perspective on the human experience. He couldn not help but reflect on the profound interconnectedness of urban life and community.',
 (SELECT id FROM categories WHERE name = 'Modern Fiction'), 'ai', 2,
 '{generic_observation,philosophical_aside,urban_setting,generic_names,bland}', 'Claude-2', 'Write slice-of-life fiction', true, 0.223355),

-- AI attempting Sci-Fi
('In the year 2147, humanity had achieved remarkable technological advances that fundamentally transformed society. Captain Johnson piloted his sophisticated spacecraft through the vast expanse of space, contemplating the infinite possibilities that awaited future generations. The advanced artificial intelligence systems provided comprehensive support for all mission-critical operations.',
 (SELECT id FROM categories WHERE name = 'Sci-Fi Literature'), 'ai', 3,
 '{generic_future,tech_buzzwords,generic_names,expository,stilted}', 'GPT-3.5-Turbo', 'Generate science fiction narrative', true, 0.334466),

('The extraordinary discovery of the mysterious alien artifact presented unprecedented opportunities for scientific advancement. Dr. Smith examined the enigmatic object using sophisticated analytical instruments to determine its potential significance. This remarkable find could potentially revolutionize humanitys understanding of extraterrestrial intelligence and advanced civilizations.',
 (SELECT id FROM categories WHERE name = 'Sci-Fi Literature'), 'ai', 3,
 '{discovery_plot,generic_scientists,buzzwords,expository,verbose}', 'GPT-4', 'Create alien discovery story', true, 0.445577),

-- AI attempting Philosophy
('It is essential to consider the fundamental nature of human existence and our place in the universe. Furthermore, one must examine the complex relationship between consciousness, reality, and perception in our daily lives. These profound questions have arguably shaped philosophical discourse throughout the history of human civilization.',
 (SELECT id FROM categories WHERE name = 'Philosophy'), 'ai', 4,
 '{generic_philosophy,hedging,abstract,verbose,impersonal}', 'GPT-3.5-Turbo', 'Generate philosophical reflection', true, 0.556688),

('The concept of free will presents numerous challenges to our understanding of moral responsibility and ethical behavior. However, it is important to note that different philosophical traditions have approached this question from various perspectives. Ultimately, the resolution of these complex issues requires careful consideration of multiple factors and viewpoints.',
 (SELECT id FROM categories WHERE name = 'Philosophy'), 'ai', 4,
 '{moral_philosophy,hedging,generic_ethics,academic_tone,verbose}', 'Claude-2', 'Discuss free will philosophically', true, 0.667799),

-- AI attempting Poetry
('The beautiful flowers bloom gracefully in the peaceful garden setting, bringing joy and happiness to all who observe them. Their vibrant colors and delicate petals create a sense of natural beauty and tranquility. This wonderful scene reminds us of lifes precious moments and simple pleasures.',
 (SELECT id FROM categories WHERE name = 'Poetry & Verse'), 'ai', 2,
 '{generic_nature,cliched,overly_positive,simple,bland}', 'GPT-3.5-Turbo', 'Write nature poetry with simple themes', true, 0.778800),

('Time flows like a river through the landscape of memory, carrying dreams and aspirations toward an uncertain future. Each moment represents a unique opportunity for growth, learning, and self-discovery in the journey of life. We must embrace these experiences with open hearts and minds.',
 (SELECT id FROM categories WHERE name = 'Poetry & Verse'), 'ai', 3,
 '{metaphorical,life_lessons,generic_wisdom,motivational,abstract}', 'GPT-4', 'Create metaphorical poetry about time', true, 0.889911),

-- AI attempting News/Journalism
('Local authorities announced today that significant improvements to community infrastructure will be implemented in the upcoming fiscal year. The comprehensive development plan aims to enhance quality of life for residents while promoting sustainable growth. City officials emphasized their commitment to transparency and public engagement throughout the process.',
 (SELECT id FROM categories WHERE name = 'News & Journalism'), 'ai', 3,
 '{generic_news,official_language,buzzwords,neutral_tone,formulaic}', 'GPT-3.5-Turbo', 'Generate local news article', true, 0.990022),

('Recent studies have shown that emerging technologies continue to transform various sectors of the economy. Industry experts suggest that businesses should adapt to these changes to remain competitive in the marketplace. Furthermore, it is important to note that consumer preferences are evolving rapidly in response to technological innovations.',
 (SELECT id FROM categories WHERE name = 'News & Journalism'), 'ai', 3,
 '{business_news,generic_trends,expert_quotes,hedging,formal}', 'Claude-2', 'Write technology business news', true, 0.001133),

-- AI attempting Travel Writing
('The magnificent city of Paris offers countless opportunities for cultural enrichment and memorable experiences. Visitors can explore world-renowned museums, savor delicious cuisine, and admire stunning architectural marvels throughout their stay. This enchanting destination truly provides something special for every type of traveler seeking adventure.',
 (SELECT id FROM categories WHERE name = 'Travel Writing'), 'ai', 2,
 '{travel_cliches,generic_praise,tourist_focus,promotional,bland}', 'GPT-3.5-Turbo', 'Write Paris travel description', true, 0.112255),

('The breathtaking natural beauty of the mountain landscape provides an ideal setting for outdoor enthusiasts and nature lovers. Hiking trails offer spectacular views and opportunities for physical exercise and mental rejuvenation. Travelers should definitely consider visiting this remarkable destination for an unforgettable experience.',
 (SELECT id FROM categories WHERE name = 'Travel Writing'), 'ai', 2,
 '{nature_tourism,generic_activities,promotional_tone,cliched,enthusiastic}', 'GPT-4', 'Describe mountain travel destination', true, 0.223366);

COMMIT;

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'AI passages sample seed data inserted successfully';
    RAISE NOTICE 'Total AI passages added: %', (SELECT count(*) FROM passages WHERE source_type = 'ai' AND generator_model IS NOT NULL);
END $$;
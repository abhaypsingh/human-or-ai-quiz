const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Sample passages for testing
const samplePassages = [
  {
    text: "The old lighthouse stood sentinel against the restless sea, its weathered stones bearing witness to countless storms. Each dawn brought new mysteries washing upon the shore, fragments of stories lost to the depths. The keeper, a man of few words but many thoughts, maintained his vigil with unwavering dedication.",
    source_type: "human",
    category_id: 1, // Classic Literature
    title: "The Lighthouse Keeper",
    author: "Sample Author"
  },
  {
    text: "In the vast expanse of the digital realm, algorithms danced with unprecedented elegance, weaving patterns of extraordinary complexity. The luminous threads of data cascaded through neural pathways, creating a symphony of computational brilliance that transcended ordinary understanding. Each iteration brought forth revelations of stunning magnitude.",
    source_type: "ai",
    category_id: 9, // AI: Narrative – Flowery
    title: "Digital Symphony",
    author: "AI Generated"
  },
  {
    text: "The research findings indicate a significant correlation between environmental factors and behavioral outcomes. Our comprehensive analysis of the dataset reveals patterns that challenge conventional wisdom. The implications of these discoveries extend far beyond the immediate scope of the study.",
    source_type: "human",
    category_id: 8, // Technical/Academic
    title: "Research Abstract",
    author: "Dr. Sample"
  },
  {
    text: "Beneath the crimson sky of Mars, the colony's first garden bloomed with impossible beauty. Hydroponic towers stretched toward the dome's apex, their green tendrils defying the red planet's harsh reality. Dr. Chen watched her tomatoes ripen, each one a small miracle of human persistence.",
    source_type: "human",
    category_id: 3, // Sci-Fi
    title: "Martian Garden",
    author: "Science Fiction Author"
  },
  {
    text: "The corporate synergy achieved through our innovative paradigm shift has resulted in unprecedented stakeholder value. Our holistic approach to market dynamics leverages cutting-edge methodologies to deliver robust solutions. The transformative impact of our strategic initiatives continues to exceed projections.",
    source_type: "ai",
    category_id: 10, // AI: Expository – Corporate
    title: "Corporate Report",
    author: "AI Generated"
  },
  {
    text: "In the misty valleys of the forgotten realm, ancient magic stirred once more. The prophecy spoke of a chosen one who would unite the fractured kingdoms, but Elara never imagined it would be her. With trembling hands, she grasped the crystal staff, feeling its power surge through her veins.",
    source_type: "human",
    category_id: 4, // Fantasy
    title: "The Crystal Staff",
    author: "Fantasy Writer"
  },
  {
    text: "Upon careful consideration of the matter at hand, one must acknowledge the profound implications that arise from such deliberations. The distinguished assembly, having convened with great solemnity, did resolve to pursue a course of action most befitting the circumstances of our present epoch.",
    source_type: "ai",
    category_id: 11, // AI: Imitative – 19th-Century
    title: "Victorian Discourse",
    author: "AI Generated"
  },
  {
    text: "Breaking news: Local community rallies together to save historic theater from demolition. Residents organized a grassroots campaign that raised over $2 million in just six weeks. The mayor announced today that the building will be preserved and converted into a cultural arts center.",
    source_type: "human",
    category_id: 6, // News-style
    title: "Community Victory",
    author: "News Reporter"
  },
  {
    text: "The question of consciousness remains one of philosophy's greatest mysteries. Can subjective experience be reduced to mere neural activity? Descartes' dualism posits a fundamental separation between mind and body, yet modern neuroscience suggests a more integrated view of human cognition.",
    source_type: "human",
    category_id: 5, // Philosophy
    title: "Mind and Matter",
    author: "Philosophy Professor"
  },
  {
    text: "Pursuant to Section 7.2 of the aforementioned agreement, all parties shall be bound by the terms and conditions set forth herein. Any disputes arising from the interpretation or implementation of this contract shall be resolved through binding arbitration in accordance with established legal precedents.",
    source_type: "human",
    category_id: 7, // Legal/Policy
    title: "Contract Clause",
    author: "Legal Document"
  }
];

async function seedPassages() {
  console.log('🌱 Starting database seeding...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL.trim().replace(/\s+/g, '');
  const sql = neon(databaseUrl);

  try {
    // Check if passages already exist
    const existingCount = await sql`SELECT COUNT(*) as count FROM passages`;
    
    if (existingCount[0].count > 0) {
      console.log(`⚠️ Database already contains ${existingCount[0].count} passages.`);
      console.log('Do you want to add more sample passages? (This will not delete existing ones)');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('📝 Adding sample passages...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const passage of samplePassages) {
      try {
        // Generate a random key for the passage (used for random selection)
        const randKey = Math.random();
        
        await sql`
          INSERT INTO passages (text, source_type, category_id, title, author, rand_key)
          VALUES (
            ${passage.text},
            ${passage.source_type}::source_type,
            ${passage.category_id},
            ${passage.title},
            ${passage.author},
            ${randKey}
          )
        `;
        
        console.log(`✅ Added ${passage.source_type} passage: "${passage.title}"`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add passage "${passage.title}": ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Successfully added: ${successCount} passages`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} passages`);
    }

    // Verify the total count
    const finalCount = await sql`SELECT COUNT(*) as count FROM passages`;
    console.log(`   Total passages in database: ${finalCount[0].count}`);

    // Show distribution
    const distribution = await sql`
      SELECT 
        source_type,
        COUNT(*) as count
      FROM passages
      GROUP BY source_type
    `;
    
    console.log('\n📈 Passage Distribution:');
    distribution.forEach(row => {
      console.log(`   ${row.source_type}: ${row.count} passages`);
    });

    console.log('\n🎉 Database seeding complete!');
    console.log('The quiz app now has content to work with.');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

seedPassages();
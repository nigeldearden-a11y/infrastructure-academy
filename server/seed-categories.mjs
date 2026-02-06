import { drizzle } from "drizzle-orm/mysql2";
import { assetCategories } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const categories = [
  {
    name: "Core Documents",
    slug: "core-documents",
    description: "Doc 0-5: Table of Contents, Introduction, Perspective, Guide, Appendices",
  },
  {
    name: "Supplements",
    slug: "supplements",
    description: "Supplement 1-4: Technology Diffusion, Educational Guidance, China Mirror, Master Overview",
  },
  {
    name: "Images & Visualizations",
    slug: "images-visualizations",
    description: "120+ high-resolution images, diagrams, and relay visualizations",
  },
  {
    name: "JSON Indices",
    slug: "json-indices",
    description: "master_table_index.json, documents_index_complete.json, and related data files",
  },
  {
    name: "Volume 3 - The Game",
    slug: "volume-3-game",
    description: "Reality Engine documentation, character systems, gameplay modes, progression systems",
  },
  {
    name: "Reference Materials",
    slug: "reference-materials",
    description: "Architecture, Asset Inventory, Distribution Guide, Author Positioning",
  },
  {
    name: "Presentations",
    slug: "presentations",
    description: "PowerPoint, PDF presentations, and slide decks",
  },
  {
    name: "Archive & Backup",
    slug: "archive-backup",
    description: "Backup files, archive materials, and historical versions",
  },
];

async function seed() {
  try {
    console.log("Seeding asset categories...");
    
    for (const category of categories) {
      await db.insert(assetCategories).values(category);
      console.log(`✓ Created category: ${category.name}`);
    }
    
    console.log("\n✅ Asset categories seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
}

seed();

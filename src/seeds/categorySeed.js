/**
 * Category Seed Script
 * Seeds database with service categories for the Artzyra platform
 * Can be run independently to add/update categories
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";

dotenv.config();

const categories = [
  {
    name: "Photographer",
    description:
      "Professional photographers for events, portraits, weddings, and commercial work. Specialized in capturing beautiful moments and creating lasting memories.",
    image:
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400",
    isActive: true,
  },
  {
    name: "DJ",
    description:
      "Professional DJs for parties, weddings, corporate events, and nightclubs. Expert music mixing, sound engineering, and creating the perfect atmosphere.",
    image:
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400",
    isActive: true,
  },
  {
    name: "Musician",
    description:
      "Talented musicians for live performances, events, and recordings. Acoustic and electric performances across various genres.",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    isActive: true,
  },
  {
    name: "Painter",
    description:
      "Artists specializing in portraits, murals, custom artwork, and digital art. Bringing your vision to life with creative expertise.",
    image:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
    isActive: true,
  },
  {
    name: "Dancer",
    description:
      "Professional dancers and choreographers. Specialized in contemporary, hip-hop, ballroom, and various dance styles for performances and events.",
    image:
      "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400",
    isActive: true,
  },
  {
    name: "Videographer",
    description:
      "Professional videographers for weddings, events, corporate videos, and commercial projects. Expert in video production, editing, and drone footage.",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    isActive: true,
  },
  {
    name: "Makeup Artist",
    description:
      "Professional makeup artists for events, photoshoots, weddings, and special occasions. Expert in bridal, editorial, and special effects makeup.",
    image:
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400",
    isActive: true,
  },
  {
    name: "Singer",
    description:
      "Professional singers and vocalists for events and performances. Specialized in jazz, pop, classical, and various music genres.",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    isActive: true,
  },
  {
    name: "Design",
    description:
      "Graphic designers, logo designers, and digital artists specializing in visual design. Brand identity, UI/UX design, and creative digital solutions.",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    isActive: true,
  },
  {
    name: "Event Planner",
    description:
      "Professional event planners and coordinators. Specialized in weddings, corporate events, parties, and special celebrations. Full-service event management.",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
    isActive: true,
  },
  {
    name: "Florist",
    description:
      "Creative florists and flower arrangers. Specialized in wedding bouquets, event decorations, centerpieces, and custom floral designs.",
    image:
      "https://images.unsplash.com/photo-1563241529-0d741771b77c?w=400",
    isActive: true,
  },
  {
    name: "Caterer",
    description:
      "Professional catering services for events, weddings, and corporate functions. Custom menus, food presentation, and exceptional service.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400",
    isActive: true,
  },
  {
    name: "Hair Stylist",
    description:
      "Professional hair stylists for events, weddings, photoshoots, and special occasions. Expert in cutting, coloring, and styling.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    isActive: true,
  },
  {
    name: "Decorator",
    description:
      "Event decorators and interior designers. Specialized in venue decoration, theme design, and creating beautiful event spaces.",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    isActive: true,
  },
  {
    name: "Comedian",
    description:
      "Professional comedians and entertainers for events, shows, and performances. Stand-up comedy, MC services, and entertainment.",
    image:
      "https://images.unsplash.com/photo-1508700115892-45ecd05f2b66?w=400",
    isActive: true,
  },
  {
    name: "Magician",
    description:
      "Professional magicians and illusionists for events, parties, and entertainment. Close-up magic, stage shows, and interactive performances.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    isActive: true,
  },
  {
    name: "Writer",
    description:
      "Professional writers and content creators. Specialized in copywriting, content writing, scriptwriting, and creative writing services.",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400",
    isActive: true,
  },
  {
    name: "Animator",
    description:
      "Professional animators and motion graphics artists. 2D and 3D animation, video editing, and creative visual storytelling.",
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
    isActive: true,
  },
  {
    name: "Voice Actor",
    description:
      "Professional voice actors and narrators. Voice-over services for commercials, videos, audiobooks, and multimedia projects.",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    isActive: true,
  },
  {
    name: "Tattoo Artist",
    description:
      "Professional tattoo artists and body art specialists. Custom tattoo designs, cover-ups, and artistic body modifications.",
    image:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400",
    isActive: true,
  },
];

const seedCategories = async () => {
  try {
    console.log("🌱 Starting category seed...\n");

    // Connect to database
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✓ MongoDB connected successfully\n");

    // Clear existing categories (optional - comment out if you want to keep existing)
    // console.log("Clearing existing categories...");
    // await Category.deleteMany({});
    // console.log("✓ Existing categories cleared\n");

    // Insert categories (skip duplicates)
    console.log("Creating categories...");
    let created = 0;
    let skipped = 0;

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({
        name: categoryData.name,
      });

      if (existingCategory) {
        // Update existing category
        await Category.findOneAndUpdate(
          { name: categoryData.name },
          {
            description: categoryData.description,
            image: categoryData.image,
            isActive: categoryData.isActive,
          },
          { new: true }
        );
        console.log(`↻ Updated: ${categoryData.name}`);
        skipped++;
      } else {
        // Create new category
        await Category.create(categoryData);
        console.log(`✓ Created: ${categoryData.name}`);
        created++;
      }
    }

    console.log(`\n✅ Category seeding completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - ${created} new categories created`);
    console.log(`   - ${skipped} categories updated`);
    console.log(`   - Total: ${categories.length} categories processed`);

    // Display all categories
    const allCategories = await Category.find({ isActive: true }).sort("name");
    console.log(`\n📋 Active Categories (${allCategories.length}):`);
    allCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the seed function
seedCategories();


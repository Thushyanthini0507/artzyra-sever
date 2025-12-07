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

// Get Cloudinary cloud name from environment or use default
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name';

const categories = [
  {
    name: "Animator",
    description:
      "Professional animators and motion graphics artists. 2D and 3D animation, video editing, and creative visual storytelling.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/animator.jpg`,
    isActive: true,
  },
  {
    name: "Caterer",
    description:
      "Professional catering services for events, weddings, and corporate functions. Custom menus, food presentation, and exceptional service.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/caterer.jpg`,
    isActive: true,
  },
  {
    name: "Comedian",
    description:
      "Professional comedians and entertainers for events, shows, and performances. Stand-up comedy, MC services, and entertainment.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/comedian.jpg`,
    isActive: true,
  },
  {
    name: "DJ",
    description:
      "Professional DJs for parties, weddings, corporate events, and nightclubs. Expert music mixing, sound engineering, and creating the perfect atmosphere.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/dj.jpg`,
    isActive: true,
  },
  {
    name: "Dancer",
    description:
      "Professional dancers and choreographers. Specialized in contemporary, hip-hop, ballroom, and various dance styles for performances and events.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/dancer.jpg`,
    isActive: true,
  },
  {
    name: "Decorator",
    description:
      "Event decorators and interior designers. Specialized in venue decoration, theme design, and creating beautiful event spaces.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/decorator.jpg`,
    isActive: true,
  },
  {
    name: "Design",
    description:
      "Graphic designers, logo designers, and digital artists specializing in visual design. Brand identity, UI/UX design, and creative digital solutions.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/design.jpg`,
    isActive: true,
  },
  {
    name: "Event Planner",
    description:
      "Professional event planners and coordinators. Specialized in weddings, corporate events, parties, and special celebrations. Full-service event management.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/event_planner.jpg`,
    isActive: true,
  },
  {
    name: "Florist",
    description:
      "Creative florists and flower arrangers. Specialized in wedding bouquets, event decorations, centerpieces, and custom floral designs.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/florist.jpg`,
    isActive: true,
  },
  {
    name: "Hair Stylist",
    description:
      "Professional hair stylists for events, weddings, photoshoots, and special occasions. Expert in cutting, coloring, and styling.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/hair_stylist.jpg`,
    isActive: true,
  },
  {
    name: "Magician",
    description:
      "Professional magicians and illusionists for events, parties, and entertainment. Close-up magic, stage shows, and interactive performances.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/magician.jpg`,
    isActive: true,
  },
  {
    name: "Makeup Artist",
    description:
      "Professional makeup artists for events, photoshoots, weddings, and special occasions. Expert in bridal, editorial, and special effects makeup.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/makeup_artist.jpg`,
    isActive: true,
  },
  {
    name: "Musician",
    description:
      "Talented musicians for live performances, events, and recordings. Acoustic and electric performances across various genres.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/musician.jpg`,
    isActive: true,
  },
  {
    name: "Painter",
    description:
      "Artists specializing in portraits, murals, custom artwork, and digital art. Bringing your vision to life with creative expertise.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/painter.jpg`,
    isActive: true,
  },
  {
    name: "Photographer",
    description:
      "Professional photographers for events, portraits, weddings, and commercial work. Specialized in capturing beautiful moments and creating lasting memories.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/photographer.jpg`,
    isActive: true,
  },
  {
    name: "Singer",
    description:
      "Professional singers and vocalists for events and performances. Specialized in jazz, pop, classical, and various music genres.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/singer.jpg`,
    isActive: true,
  },
  {
    name: "Tattoo Artist",
    description:
      "Professional tattoo artists and body art specialists. Custom tattoo designs, cover-ups, and artistic body modifications.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/tattoo_artist.jpg`,
    isActive: true,
  },
  {
    name: "Videographer",
    description:
      "Professional videographers for weddings, events, corporate videos, and commercial projects. Expert in video production, editing, and drone footage.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/videographer.jpg`,
    isActive: true,
  },
  {
    name: "Voice Actor",
    description:
      "Professional voice actors and narrators. Voice-over services for commercials, videos, audiobooks, and multimedia projects.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/voice_actor.jpg`,
    isActive: true,
  },
  {
    name: "Writer",
    description:
      "Professional writers and content creators. Specialized in copywriting, content writing, scriptwriting, and creative writing services.",
    image: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,f_auto,q_auto/writer.jpg`,
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


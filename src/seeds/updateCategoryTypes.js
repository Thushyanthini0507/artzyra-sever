/**
 * Update Category Types Script
 * Updates all existing categories with type field (physical or remote)
 * Can be run to set type for all categories that don't have it
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";

dotenv.config();

// Define which categories are remote (can be done online) vs physical (requires in-person)
const remoteCategories = [
  "Animator",
  "Design",
  "Painter", // Digital art
  "Voice Actor",
  "Writer",
];

const physicalCategories = [
  "Caterer",
  "Comedian",
  "DJ",
  "Dancer",
  "Decorator",
  "Event Planner",
  "Florist",
  "Hair Stylist",
  "Magician",
  "Makeup Artist",
  "Musician",
  "Photographer", // Usually on-site
  "Singer",
  "Tattoo Artist",
  "Videographer", // Usually on-site
];

const updateCategoryTypes = async () => {
  try {
    console.log("🔄 Starting category type update...\n");

    // Connect to database
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✓ MongoDB connected successfully\n");

    // Get all categories
    const allCategories = await Category.find({});
    console.log(`Found ${allCategories.length} categories\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const category of allCategories) {
      try {
        // Skip if type is already set
        if (category.type && (category.type === "physical" || category.type === "remote")) {
          console.log(`⊘ Skipped: ${category.name} (already has type: ${category.type})`);
          skipped++;
          continue;
        }

        // Determine type based on category name
        let categoryType = "physical"; // Default to physical
        const categoryName = category.name.toLowerCase();

        if (remoteCategories.some((rc) => categoryName.includes(rc.toLowerCase()))) {
          categoryType = "remote";
        } else if (physicalCategories.some((pc) => categoryName.includes(pc.toLowerCase()))) {
          categoryType = "physical";
        } else {
          // For unknown categories, try to determine based on name
          const remoteKeywords = ["design", "animator", "writer", "voice", "digital", "online"];
          const hasRemoteKeyword = remoteKeywords.some((keyword) =>
            categoryName.includes(keyword)
          );
          categoryType = hasRemoteKeyword ? "remote" : "physical";
        }

        // Update category with type
        await Category.findByIdAndUpdate(
          category._id,
          { type: categoryType },
          { new: true, runValidators: true }
        );

        console.log(`✓ Updated: ${category.name} → type: ${categoryType}`);
        updated++;
      } catch (error) {
        console.error(`✗ Error updating ${category.name}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Category type update completed!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - ${updated} categories updated`);
    console.log(`   - ${skipped} categories skipped (already have type)`);
    console.log(`   - ${errors} errors`);
    console.log(`   - Total: ${allCategories.length} categories processed`);

    // Display all categories with their types
    const allCategoriesWithTypes = await Category.find({}).sort("name");
    console.log(`\n📋 All Categories with Types:`);
    allCategoriesWithTypes.forEach((cat, index) => {
      const typeDisplay = cat.type || "❌ MISSING";
      console.log(`   ${index + 1}. ${cat.name} - ${typeDisplay}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating category types:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the update function
updateCategoryTypes();








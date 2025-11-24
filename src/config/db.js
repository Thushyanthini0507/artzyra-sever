import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // MongoDB connection string format:
    // mongodb://username:password@host:port/database
    // or for MongoDB Atlas:
    // mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    // Provide helpful error messages
    if (error.message.includes("authentication failed")) {
      console.error("\n⚠️  Authentication Error:");
      console.error("   - Check your MongoDB username and password");
      console.error("   - Verify your MONGO_URI in .env file");
      console.error(
        "   - Format: mongodb://username:password@host:port/database"
      );
      console.error(
        "   - Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/database\n"
      );
    } else if (error.message.includes("bad auth")) {
      console.error("\n⚠️  Bad Authentication:");
      console.error("   - Username or password is incorrect");
      console.error(
        "   - Make sure special characters in password are URL-encoded"
      );
      console.error("   - Example: @ becomes %40, # becomes %23\n");
    }

    process.exit(1); // Exit process with failure
  }
};

export default connectDB;

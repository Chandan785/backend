 import mongoose from 'mongoose';
 import dotenv from 'dotenv';
dotenv.config();


const connectDB = async () => {
    try {
        const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/Educonnect';
        await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
        });
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
    }

    export default  connectDB;
 
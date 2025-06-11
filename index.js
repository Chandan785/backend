import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });


import connectDB from './src/db/index.js';
//  import express from 'express';
// const app = express();
import {app} from './app.js'; 
 

connectDB()
.then(() => {
  app.listen(process.env.port || 8000, () => {
    console.log(`Server is running on port ${process.env.port }`);
  });
  console.log("✅ MongoDB connected");
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
}
)



/*

(async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/Educonnect';
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");


app.listen(process.env.port, () => {
      console.log(`Server is running on port ${process.env.port || 3000}`);
    });


  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
})();

*/
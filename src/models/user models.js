import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { use } from "react";
import e from "express";

const userSchema = new Schema({
    Username: { 
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowecase: true,
        index: true
    },
    email: { 
        type: email,
        required: true,
        unique: true,
        trim: true,
        lowecase: true
        
    },

    FullName: { 
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    avatar: { 
        type: String, //url to the image
        required: true,
        
       
    },
    CoverImage: { 
        type: String //url to the image
    },
    WatchHistory: { 
        type: Schema.Types.ObjectId, //array of video ids
        ref: 'Video',
    },

    passwaord: { 
        type: String,
        required: [true,'password is required'],
        minlength: 6
       
    },
     refreshToken: {
        type: String,
        default: null
    },

},


{
    timestamps: true,
})


userSchema.pre('save', async function(next) {
    if (this.isModified('passwaord')) {
        this.passwaord = await bcrypt.hash(this.passwaord, 10);
    }
    next();
});

userSchema.methods.ispasswordMatch = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwaord);
};

userSchema.methods.generateAuthToken = function() {
     jwt.sign({
        id: this._id,
        Username: this.Username,
        email: this.email,
        FullName: this.FullName,
     },
     process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
 })
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        id: this._id
       
    },
    process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN
    });
}



export const User = mongoose.model('User', userSchema);

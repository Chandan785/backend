import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
   videofile:{
    type : String, // URL to the video file
    required: true,
   },
   thumbnail: {
    type: String, // URL to the thumbnail image
    required: true,
   },
    title: {
     type: String,
     required: true,
    
    },
    description: {
     type: String,
     required: true,
    },
    duration: {
     type: Number, // Duration in seconds
     required: true,
    },
    views: {
     type: Number,
     default: 0, // Default view count
    },
    ispuslished: {
     type: Boolean,
     default: true, // Video is not published by default
    },
    owner: {
     type: Schema.Types.ObjectId, // Reference to the user who uploaded the video
     ref: 'User',
     required: true,
    },


  
}, {
    timestamps: true,
});
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model('Video', videoSchema);
import mongoose ,{model, Schema} from "mongoose";
const subscriptionSchema = new mongoose.Schema({
  subcriber:{
    type :Schema.Types.ObjectId,//one who is subscribing
    ref: "User",
    
  },
  channel:{
    type: Schema.Types.ObjectId,//one whom subscriber is subscribing to 
    ref: "User",
  }
}
, {
  timestamps: true, 
});

export const Subscription = model("Subscription", subscriptionSchema);

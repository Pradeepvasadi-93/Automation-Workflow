const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true
    },
    phone:{
        type:Number,
        required:[true,"Phone number is required"]
    },
    query:{
        type:String,
        required:[true,"Query is required"]
    },
    status:{
        type:String,
        enum:["PENDING","COMPLETED"],
        default:"PENDING"
    }
},{timestamps:true})


module.exports =  mongoose.model("Lead",LeadsSchema);


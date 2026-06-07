
const mongoose=require('mongoose');
module.exports=mongoose.model('Account',new mongoose.Schema({
userId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
website:String,
username:String,
password:String,
strength:String,
createdAt:{type:Date,default:Date.now}
}));

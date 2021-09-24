const mongoose = require('mongoose');
const uuid = require('uuid');

const { Schema } = mongoose;

const userSchema = new Schema({
	uuid: { type: String },
	username: String,
	password: String,
	firstName: String,
	lastName: String,
	ppURL: { type: String, default: null },
	bio: { type: String, default: null },
	age: { type: String, default: null },
	gender: { type: String, default: null },
	occupation: { type: String, default: null },
}, { timestamps: true });



const UserDB = mongoose.model('users', userSchema)

module.exports = UserDB;
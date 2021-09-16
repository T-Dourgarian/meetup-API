const mongoose = require('mongoose');
const uuid = require('uuid');

const { Schema } = mongoose;

const userSchema = new Schema({
	uuid: { type: String, default: uuid.v1()},
	username: String,
	password: String,
	firstName: String,
	lastName: String,
	ppURL: String,
}, { timestamps: true });



const UserDB = mongoose.model('users', userSchema)

module.exports = UserDB;
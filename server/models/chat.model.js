const mongoose = require('mongoose');

const { Schema } = mongoose;

const chatSchema = new Schema({
	uuid: String,
	eventUuid: String,
	users: [{
		uuid: String,
		firstName: String,
		lastName: String
	}],
	active: { type: Boolean, default: true}
}, { timestamps: true });



const chatDb = mongoose.model('chats', chatSchema)

module.exports = chatDb;
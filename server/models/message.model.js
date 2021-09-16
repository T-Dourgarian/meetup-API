const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema({
	uuid: { type: String },
	from: {
		uuid: String,
		firstName: String,
		lastName: String
	},
	chatUuid: String,
	eventUuid: String,
	message: String
}, { timestamps: true });



const messageDb = mongoose.model('messages', messageSchema)

module.exports = messageDb;
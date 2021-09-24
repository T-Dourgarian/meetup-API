const mongoose = require('mongoose');
const uuid = require('uuid');

const { Schema } = mongoose;

// const acceptedSchema = new Schema({
// 	uuid: { type: String },
// 	firstName: { type: String },
// 	lastName: { type: String },
// })


const createdBySchema = new Schema({
	uuid: String,
	firstName:String,
	lastName:String,
	ppURL: String
})

const eventSchema = new Schema({
	uuid: { type: String },
	name: { type: String, default: '' },
	date: { type: Date, default: '' },
	description: { type: String, default: '' },
	location: { type: String, default: '' },
	accepted: [{
		uuid: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		ppURL: String
	}],
	acceptedUuids:[String],
	currentlyMessaging: [{
		uuid: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		ppURL: String
	}],
	currentlyMessagingUuids: [String],
	createdBy: createdBySchema,
	mapUrl: String,
	coordinates: {
		type: { type: String, default: 'Point'},
		coordinates: [Number]
	},
	hidden: { type: Boolean, default: false },
	deleted: { type: Boolean, default: false },
}, { timestamps: true });



const EventDB = mongoose.model('events', eventSchema)

module.exports = EventDB;
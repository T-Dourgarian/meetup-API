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
	name: { type: String, default: null },
	date: { type: Date, default: null },
	description: { type: String, default: null },
	location: { type: String, default: null },
	createdBy: { type: String, default: null },
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
		lat: Number,
		lng: Number
	},
	hidden: { type: Boolean, default: false },
	deleted: { type: Boolean, default: false },
}, { timestamps: true });



const EventDB = mongoose.model('events', eventSchema)

module.exports = EventDB;
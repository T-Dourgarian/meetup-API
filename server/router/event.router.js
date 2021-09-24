const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');
const authenticateUser = require('../authMiddleware');


const eventDb = require('../models/event.model');
const userDb = require('../models/user.model');

const { staticMapUrl } = require('static-google-map');
const NodeGeocoder = require('node-geocoder');


const options = {
	provider: 'google',
   
	// Optional depending on the providers
	apiKey: process.env.MAPS_API_KEY, // for Mapquest, OpenCage, Google Premier
	formatter: null // 'gpx', 'string', ...
};

  const geocoder = NodeGeocoder(options);

router.get('/:uuid', async(req,res) => {
    try {
		
		console.log('in get event');
		const { uuid } = req.params;

		let event;


		if (uuid) {
			event = await eventDb.findOne({ uuid });
		} else {
			event = await eventDb.find({
				hidden: false,
				deleted: false
			});
		}

		res.status(200).json({ event });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


router.get('/attending/:eventUuid', authenticateUser, async (req,res) => {
	try {

		console.log('in get attendees')
		 
		const { eventUuid } = req.params;


		const event = await eventDb.findOne({ uuid: eventUuid });

		const attending = await userDb.find({ 
			uuid: {
				$in: event.acceptedUuids
			}
		},{
			uuid: 1,
			firstName: 1,
			lastName: 1,
			bio:1,
			age:1,
			gender:1,
			occupation: 1,
			ppURL:1
		})

		const creator = await userDb.findOne({ uuid: event.createdBy.uuid },
			{
				uuid: 1,
				firstName: 1,
				lastName: 1,
				bio:1,
				age:1,
				gender:1,
				occupation: 1,
				ppURL:1
			}
		)

		res.status(200).json({ attending, creator })


	} catch(error) {
		console.log(error);
		res.sendStatus(400);
	}
})

router.get('/',authenticateUser , async(req,res) => {
    try {
		
		console.log('in get events');
		
		let { search, locationRadius, genderFilter, lat, lng } = req.query; 

		const newDate = new Date();
		const tomorrow = newDate.setHours(newDate.getHours() + 24);
		
		let agg = [];

		if (lat && lng) {
			agg.push({
				$geoNear: {
					key: 'coordinates',
					near: { type: "Point", coordinates: [ Number(lng), Number(lat) ] },
					maxDistance: 1609 * locationRadius,
					includeLocs: "dist.location",
					distanceField: "dist.calculated",
					spherical: true
				 }
			})
		} 
		
		agg.push(
			{
				$match: {
					name: { $regex: search.toLowerCase() },
					date: { $gte: new Date() },
					hidden: false,
					deleted: false
				}
			},
			{
				$match: {
					date: { $lte: new Date(tomorrow) }
				}
			},
			{
				$lookup: {
					from:'users',
					let:{ createdBy_uuid: '$createdBy.uuid'},
					pipeline: [
						{
							$match: { 
								"$expr": { "$eq": [ "$uuid", "$$createdBy_uuid" ] },
							},
						},
						{
							$project: {
								password: 0
							}
						}
					],
					as: 'createdByFullUser'
				},
			},
			{
				$unwind: '$createdByFullUser'
			},
			{
				$match: {
					'createdByFullUser.gender': { $in: genderFilter } 
				}
			}
		);

		const events = await eventDb.aggregate(agg)

		res.status(200).json({ events });

    }catch(error) {
        console.log(error);
        res.sendStatus(400);
    }
});



router.post('/create', authenticateUser, async(req,res) => {
    try {
		
		const { name, date, description, location } = req.body;

		const locationResult = await geocoder.geocode(location);

		const { latitude: lat, longitude: lng } = locationResult[0];

		const url = staticMapUrl({
			key: process.env.MAPS_API_KEY,
			scale: 1,
			size: '600x600',
			format: 'png',
			maptype: 'roadmap',
			markers: [
			  {
				location: { lat, lng },
			  },
			],
		  });



		
		const doc = await eventDb.create({
			uuid: uuid.v1(),
			createdBy: {
				uuid: req.user.uuid,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				ppURL: req.user.ppURL
			},
			name: name.toLowerCase(),
			description,
			date,
			location,
			accepted: [],
			acceptedUuids: [],
			currentlyMessaging: [],
			currentlyMessagingUuids: [],
			mapUrl: url,
			coordinates: {
				coordinates: [lng, lat]
			}
		});

		res.status(200).json({doc});

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});

router.put('/accept/:eventUuid', authenticateUser, async(req,res) => {
    try {

		console.log('in accept event');
		
		const { eventUuid } = req.params;
		
		const result = await eventDb.updateOne({
			uuid: eventUuid,
		},
		{
			$push: { 
				acceptedUuids: req.user.uuid,
				accepted: { uuid: req.user.uuid, firstName: req.user.firstName, lastName: req.user.lastName, ppURL: req.user.ppURL }
			}
		});

		res.status(200).json({ result });
    } catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});

router.put('/update', authenticateUser, async(req,res) => {
    try {

		console.log('in update event');
		
		const { uuid, name, description, date, location } = req.body;


		const locationResult = await geocoder.geocode(location);

		const { latitude: lat, longitude: lng } = locationResult[0];

		const url = staticMapUrl({
			key: process.env.MAPS_API_KEY,
			scale: 1,
			size: '600x600',
			format: 'png',
			maptype: 'roadmap',
			markers: [
			  {
				location: { lat, lng },
			  },
			],
		  });
		
		const result = await eventDb.updateOne({
			uuid,
		},
		{
			name: name,
			description: description,
			date: date,
			location: location,
			mapUrl: url,
			coordinates: {
				lat,
				lng
			}
		});

		res.status(200).json({ result });
    } catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


module.exports = router;
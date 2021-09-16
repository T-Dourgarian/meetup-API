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

router.get('/',authenticateUser , async(req,res) => {
    try {
		
		console.log('in get events');
		
		
		let { search } = req.query; 

		if (!search) {
			search = '';
		}


		const events = await eventDb.find({
			currentlyMessagingUuids: { $nin: req.user.uuid },
			acceptedUuids: { $nin: req.user.uuid },
			'createdBy.uuid': { $nin: req.user.uuid },
			name: { $regex: search}
		});

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
			name,
			description,
			date,
			location,
			accepted: [],
			acceptedUuids: [],
			currentlyMessaging: [],
			currentlyMessagingUuids: [],
			mapUrl: url,
			coordinates: {
				lat,
				lng
			}
		})

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

module.exports = router;
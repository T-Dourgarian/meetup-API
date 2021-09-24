const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');
const authenticateUser = require('../authMiddleware');

const eventDb = require('../models/event.model');
const userDb = require('../models/user.model');


// get events created by specific user
router.get('/:filter', authenticateUser, async(req,res) => {
    try {

		console.log('in get my events')

		const { filter } = req.params;
		
		const { uuid: userUuid } = req.user;

		let events = [];

		if (filter === 'attended') {
			events = await eventDb.find({
				acceptedUuids: { $in: userUuid },
				deleted: false
			})
		} else if (filter === 'created') {
			events = await eventDb.find({
				'createdBy.uuid': userUuid,
				deleted: false
			})
		}

		res.status(200).json({ events });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


router.put('/hide/:eventUuid', authenticateUser, async (req, res) => {
	try {
		console.log('in hide event');

		const { eventUuid } = req.params;

		await eventDb.updateOne({ uuid: eventUuid },[
			{ $set: { hidden: { $not: "$hidden" } } }
		]);

		res.sendStatus(200);

	} catch(error) {
		console.log(error);
		res.sendStatus(400);
	}
})

router.put('/withdraw/:eventUuid', authenticateUser, async(req, res) => {
	try {
		console.log('in withdraw attendance')

		const { eventUuid } = req.params;

		await eventDb.updateOne({ uuid: eventUuid }, ({
			$pull: { 
				accepted: { uuid: req.user.uuid }, 
				acceptedUuids: req.user.uuid,
				currentlyMessaging: { uuid: req.user.uuid }, 
				currentlyMessagingUuids: req.user.uuid
			}
		}));

		res.sendStatus(200);

	} catch (error) {
		console.log(error);
		res.sendStatus(400);
	}
})

router.delete('/delete/:eventUuid', authenticateUser, async (req, res) => {
	try {
		console.log('in delete event');

		const { eventUuid } = req.params;

		await eventDb.updateOne({ uuid: eventUuid },{
			deleted: true
		});

		res.sendStatus(200);

	} catch(error) {
		console.log(error);
		res.sendStatus(400);
	}
})


module.exports = router;
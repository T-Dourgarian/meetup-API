const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');


const eventDb = require('../models/event.model');
const messageDb = require('../models/message.model');
const chatDb = require('../models/chat.model');

//middleware
const authenticateUser = require('../authMiddleware');

router.get('/', authenticateUser, async(req,res) => {
    try {

		console.log('in get chats')
		
		const { uuid } = req.user;

		const chats = await chatDb.aggregate(
			[
				{
					$match: { 
						users: { $elemMatch: { uuid }},
						active: true
					}
				},
				{
					$lookup: {
						from:'events',
						localField: 'eventUuid',
						foreignField: 'uuid',
						as: 'event'
					}
				},
				{
					'$lookup': {
						'from': 'messages',
						'let': {
						  'uuid': '$uuid'
						},
						'pipeline': [{
							'$match': { '$expr': { '$eq': ['$chatUuid', '$$uuid'] } }
						  }, {
							'$sort': {  'createdAt': 1 }
						  }
						],
						'as': 'messages'
					  }
				},
				{
					$sort : { createdAt: -1 }
				}
			]
		)

		res.status(200).json({ chats });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


router.post('/:eventUuid', authenticateUser, async(req,res) => {
    try {
		
		console.log('in create chat')

		const { eventUuid } = req.params;

		const event = await eventDb.findOne({ uuid: eventUuid })

		let chat = await chatDb.findOne({
			eventUuid,
			'users.uuid': event.createdBy.uuid,
			'users.uuid': req.user.uuid
		});

		// if chat already existed but has been deactivated
		if (chat) {
		
			await chatDb.updateOne({ uuid: chat.uuid},
				{
					active: true
				}
			)

		} else {
			// create new chat 
			chat = await chatDb.create({
				uuid: uuid.v1(),
				eventUuid,
				users: [
					{
						uuid: event.createdBy.uuid,
						firstName: event.createdBy.firstName,
						lastName: event.createdBy.lastName,
						ppURL: event.createdBy.ppURL
					},
					{
						uuid: req.user.uuid, 
						firstName: req.user.firstName, 
						lastName: req.user.lastName,
						ppURL: req.user.ppURL
					}
				]
			})
		}

		await eventDb.updateOne({
			uuid: eventUuid,
		},
		{
			$push: { 
				currentlyMessagingUuids: req.user.uuid,
				currentlyMessaging: { uuid: req.user.uuid, firstName: req.user.firstName, lastName: req.user.lastName, ppURL: req.user.ppURL }
			}
		});

		res.status(200).json({ chat });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


router.put('/deactivate/', authenticateUser, async(req,res) => {
    try {

		console.log('in delete chats');
		
		const { chatUuids } = req.body;

		
		await chatDb.updateMany({
			uuid: { $in: chatUuids},
		},
		{
			active: false
		});

		let chats = await chatDb.find({ uuid: { $in: chatUuids} });

		const eventUuids = chats.map(chat => chat.eventUuid);

		await eventDb.updateMany({ uuid: { $in: eventUuids }}, 
			{
				$pull : { currentlyMessaging: { uuid: req.user.uuid }, currentlyMessagingUuids: req.user.uuid }
			}
		);



		res.sendStatus(200);

    } catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


module.exports = router;
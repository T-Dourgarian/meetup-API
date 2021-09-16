const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');


const userDb = require('../models/user.model');
const messageDb = require('../models/message.model');

//middleware
const authenticateUser = require('../authMiddleware');

router.get('/:chatUuid', authenticateUser, async(req,res) => {
    try {

		console.log('in get messages')
		
		const { chatUuid } = req.params;

		const messages = await messageDb.find({ chatUuid }).sort({ createdAt: 1 })

		res.status(200).json({ messages });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


// router.post('/:uuid', async(req,res) => {
//     try {
		
// 		const { uuid } = req.params;

// 		let user;


// 		if (uuid) {
// 			user = await userDb.findOne({ uuid });
// 		} else {
// 			user = await userDb.find({});
// 		}

// 		res.status(200).json({ user });

//     }catch(error) {
//         console.log(error)
//         res.sendStatus(400);
//     }
// });



module.exports = router;
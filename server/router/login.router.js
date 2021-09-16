const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');
const jwt = require('jsonwebtoken')


const userDb = require('../models/user.model');


router.get('/:uuid', async(req,res) => {
    try {
		
		

		res.status(200).json({ user });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


// logging in
router.post('/',  async(req,res) => {
    try {

		const { email, password } = req.body;

		const user = await userDb.findOne({ username: email });

		console.log('user', user)



		if ( user && user.password === password) {

			const ppURL = user.ppURL ? user.ppURL : '';

			
			const accessToken = jwt.sign(
				{ 
					uuid:user.uuid, 
					username: email, 
					firstName: user.firstName, 
					lastName: user.lastName,
					ppURL
				}, 
					process.env.ACCESS_TOKEN_SECRET
				);

			res.json({ accessToken, user: { firstName: user.firstName, lastName: user.lastName, uuid: user.uuid, ppURL} });
		} else {
			res.json({ error: 'Invalid username or password' })
		}

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


// create user / signup
router.post('/signup', async (req,res) => {
	try {
		const { username, password, firstName, lastName } = req.body;

		const user = await userDb.create({
			uuid:uuid.v1(),
			username,
			password,
			firstName,
			lastName,
		});


		const accessToken = jwt.sign({
			uuid:user.uuid, 
			username,
			firstName,
			lastName,
		},  process.env.ACCESS_TOKEN_SECRET);

		res.json({ accessToken, user: { firstName, lastName, uuid: user.uuid} });

	} catch(error) {
		console.log(error);
		res.sendStatus(400);
	}
})


module.exports = router;
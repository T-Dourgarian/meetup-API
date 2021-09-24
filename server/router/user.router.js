const express = require('express');
const router = express.Router();
const axios = require("axios");
const uuid = require('uuid');
const authenticateUser = require('../authMiddleware');
const multer = require('multer')
const AWS = require('aws-sdk')

const userDb = require('../models/user.model');
const eventDb = require('../models/event.model')


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
});

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image');


router.get('/:uuid',authenticateUser , async (req,res) => {
    try {
		
		const { uuid } = req.params;

		let user;


		if (uuid) {
			user = await userDb.findOne({ uuid });
		} else {
			user = await userDb.find({});
		}

		res.status(200).json({ user });

    }catch(error) {
        console.log(error)
        res.sendStatus(400);
    }
});


router.put('/pp',  [authenticateUser, upload], async (req,res) => {
	try {
		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: req.user.uuid,
		};

		const user = await userDb.findOne({ uuid: req.user.uuid });

		if (user && user.ppURL) {
			s3.deleteObject(params, async(error, data) => {
				if (error) {
					console.log(error)
					return res.status(500).json(error)
				}

				params.Body = req.file.buffer
	
				s3.upload(params, async (error, data) => {
					if(error){
						res.status(500).json(error)
					}
		
					await userDb.updateOne({ uuid: req.user.uuid }, 
						{
							ppURL: `/api/user/pp/image/${req.user.uuid}`
						}	
					);
		
					const response = await eventDb.updateMany({ 'createdBy.uuid': req.user.uuid }, { 'createdBy.ppURL': `/api/user/pp/image/${req.user.uuid}` });
			
					return res.status(200).json({ ppURL: `/api/user/pp/image/${req.user.uuid}` });
		
				});

			})
		} else {

			params.Body = req.file.buffer

			s3.upload(params, async (error, data) => {
				if(error){
					res.status(500).json(error)
				}
	
				await userDb.updateOne({ uuid: req.user.uuid }, 
					{
						ppURL: `/api/user/pp/image/${req.user.uuid}`
					}	
				);
	
				const response = await eventDb.updateMany({ 'createdBy.uuid': req.user.uuid }, { 'createdBy.ppURL': `/api/user/pp/image/${req.user.uuid}` });
		
				return res.status(200).json({ ppURL: `/api/user/pp/image/${req.user.uuid}` });
	
			});
		}





	} catch(error) {
		console.log(error);
		res.sendStatus(400)
	}
})

router.put('/update', authenticateUser, async (req,res) => {
	try {

		console.log('in update user')

		const { user } = req.body;

		await userDb.updateOne({ uuid: user.uuid},
			{
				bio: user.bio,
				age: user.age,
				gender: user.gender,
				occupation: user.occupation
			}	
		);

		res.sendStatus(200)

	} catch(error) {
		console.log(error)
		res.sendStatus(400)
	}
})

router.get('/pp/image/:uuid', async (req, res) => {
	try {

	  const  { uuid }  = req.params;


	 if (uuid) {

		console.log(' in get profile image')
		 
		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: uuid,
		}
	
		const readStream = await s3.getObject(params).createReadStream();
  
		readStream.pipe(res);

	 } else {
		 res.status(400).send('No image with that id exists');
	 }
  
	} catch(error) {
		console.log(error)
		res.sendStatus(400)
	}
  
});



module.exports = router;
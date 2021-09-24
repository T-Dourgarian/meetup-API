const express = require('express');
const mongoose = require('mongoose');
// const axios = require('axios');
const app = express();
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// scripts


const chatDb = require('./models/chat.model');
const eventDb = require('./models/event.model');


// const run = async () => {
// 	const events = await eventDb.find({});


// 	eventDb.createIndex({ "point": "2dsphere" })

// 	const events = await eventDb.find({coordinates:{ $near : { $maxDistance: 5000, $geometry : {type: 'Point', coordinates: [-9.34783, 52.93361050000001]}}}})
// }
// run() 

// Body parser middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// router imports
const userRouter = require('./router/user.router');
const eventRouter = require('./router/event.router');
const loginRouter = require('./router/login.router');
const messageRouter = require('./router/message.router');
const chatRouter = require('./router/chat.router');
const myEventsRouter = require('./router/myEvents.router');




/* Routes */
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/login', loginRouter);
app.use('/api/message', messageRouter);
app.use('/api/chat', chatRouter);
app.use('/api/myevents', myEventsRouter);

app.get('/public',(req,res) => {
	res.sendStatus(200);
})


// Serve static files
app.use(express.static('build'));

// App Set //
const PORT = process.env.PORT || 3000;

const dbConnect = async () => {

	try {
	
	
		const connOptions = {
		  useNewUrlParser: true,
		  useUnifiedTopology: true
		};
	  
		await mongoose.connect(process.env.MongoConnection, connOptions);
	
		console.log('DB connected')
		
	  } catch(error) {
		console.log(error);
	  }
}


const server = http.createServer(app);

// dbs
const messages = require('./models/message.model');

//socket
const io = socketio(server);

io.on('connection', socket => {

	console.log('user connected')

	socket.on('joinChatRoom', (chatUuid, eventUuid) => {
		console.log('user joined chatroom')

		socket.join(chatUuid);

	})

	socket.on('leaveChatRoom', (chatUuid) => {
		console.log('user left chat room')
		socket.leave(chatUuid)
	})

	socket.on('sendMessage', async ({ chatUuid, eventUuid, message, token }) => {

	
		let from;

		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
			if (err) {
				res.sendStatus(403);
			}
	
			from = {
				uuid: user.uuid,
				firstName: user.firstName,
				lastName: user.lastName
			}
		})

		console.log('message sent from: ', from.firstName)

		const newMessage = {
			uuid: uuid.v1(),
			chatUuid,
			eventUuid,
			from,
			message
		}

		await messages.create(newMessage)

		io.to(chatUuid).emit('message', newMessage);

	})

	socket.on('disconnect', () => {
		console.log('user disconnected')
	})
})

/** Listen * */
server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);

  dbConnect();
});
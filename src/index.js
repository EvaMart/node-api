const express = require('express');
var cors = require('cors')
const morgan = require('morgan'); 
const socketio = require('socket.io');
const app = express();

// Settings
app.set('port', process.env.PORT || 3500);
app.set('json spaces', 2);

// Middleware
app.use(morgan('dev'));
app.use(cors())
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/metadata'));
app.use(require('./routes/installation'));

// Starting the server
const server = app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
    });

// CORS policy
const io = socketio(server, {
    cors: {
      origin: "http://localhost:5800", // change this for production
      methods: ["GET", "POST"]
    }
  })


/*
The following code is used to send the installation ID to the client after
the installation of the app in a repository is complete. 
The client sends a socket event (`installation-requested`) when the user is 
redirected to the app installation page. The server stores the socket id and 
the repository name`. 
When the app is installed in the repository, the server sends the installation ID 
to the client using the socket id.

NOTE: It is here because socket.io CORS policy is configured here using the
`server` object.
*/

// pre-installation
// TODO: put this data in a database
var requestsReposIds = {}; // stores the socket id and the repository name
var requestsIdsRepos = {}; // stores the repository name and the socket id. This is the inverse of `requestsReposIds`
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    /* This event is sent by the client when the user is redirect to the app 
    installation page. The server stores the socket id and the repository name 
    in `requestsReposIds` and `requestsIdsRepos`.
    */
    socket.on('installation-requested', (data) => {
        var repository = data['owner'].toLowerCase() + '/' + data['repo'].toLowerCase();
        requestsReposIds[repository] = socket.id; // store socket id and repo
        requestsIdsRepos[socket.id] = repository;

        console.log(`socket with ID ${socket.id} is waiting for installation of ${repository}`)
       
    });
})


// post-installation
/* This event is a webhoos sent by GitHub when something changes in the app instalation,
like when it is installed in a repository or when it is uninstalled. 
This event is configured in the GitHub app settings (Webhook).
*/
app.post('/payloads', (req, res) => {
    var  data  = req.body;

    if(data.action === 'added' || data.action === 'created'){
        for(var i = 0; i < data.repositories_added.length; i++){
            // get repository name to obtain the socket id an emit the event to the correct client
            var repository = data.repositories_added[i]['full_name'].toLowerCase();
            var socketId = requestsReposIds[repository]; 

            // emit event to client with the installation id
            io.to(socketId).emit('new-installation', data.installation.id); 

            console.log('App installed in repository ' + repository)
            console.log('Sent installation Id to ' + requestsReposIds[repository])
        }
    }
});

// disconnection
/* On disconnection, delete the socket id and the repository name from the dictionaries,
since those are no longer "active installations".
*/
io.on('disconnect', (socket) => {
    console.log(`Disconnected: ${socket.id}, which requested installation for ${requestsIdsRepos[socket.id]}`);
    var repo = requestsIdsRepos[socket.id];
    delete requestsReposIds[repo]; // delete socket id
    delete requestsIdsRepos[socket.id]; // delete repo
})



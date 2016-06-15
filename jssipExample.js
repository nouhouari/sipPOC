var sipServerHost = '192.168.99.100:8088/ws';
var ua;
var sipDomainName = '172.17.0.2';

function login(username, password){
	var sipUser       = username+'@'+sipDomainName;
	var sipPwd        = password;  

	//Configuration de la connexion SIP
	var configuration = {
	  'ws_servers': 'ws://'+sipServerHost,
	  'uri': 'sip:'+sipUser,
	  'password': sipPwd
	};

	console.log(configuration);

	//Create User agent instance
	ua = new JsSIP.UA(configuration);
	
	//WebSocket connection events : Fonctions qui seront appellees par JSSIP lors d event WebSocket
ua.on('connected', function(e){ 
    console.log('connected: ' + e);/* Your code here */ }
            );
ua.on('disconnected', function(e){ 
    console.log('disconnected: ' + e);/* Your code here */ 
});
    
//SIP registration events : Fonctions qui seront appellees par JSSIP lors d event SIP      
ua.on('registered',  function(e){ 
    console.log('registered: ' + e);/* Your code here */ 
});
ua.on('unregistered',  function(e){ 
    console.log('unregistered: ' + e);/* Your code here */ 
});
ua.on('registrationFailed',  function(e){ 
    console.log('registrationFailed: ' + e);/* Your code here */ 
}); 

ua.on('newMessage', function(e){
    if(e.originator =="Remote"){
	 console.log("New message received : " + e.message.content)
    }
});

ua.on('newRTCSession', function(e){
			console.log('newRTCSession');
            if(e.originator=="remote"){
           
			   var audio = new Audio('./audio/ring.mp3');
			   audio.play();
			   
               var session_incoming = e.session;

                    var options = {
                    'mediaConstraints': {
                        'audio': true,
                        'video': false
                    }
                    };

                session_incoming.answer(options);
			}
			
			});			

//User agent start
console.log('Starting User Agent...');  
ua.start();
}

function answer(){
	//document.getElementById('callSession').style.visibility= "visible";
}


function sendMessageToUser(){
	var destination = document.getElementById('destination').value;
	destination = 'sip:'+destination+'@'+sipDomainName;
	var message     = document.getElementById('message').value;
	send(destination,message);
}


function send(destination, message){
    // Sending a message
    //var text = document.getElementById('message').value;
    //var dest = 'sip:us1@officesip.local';
	
	console.log('Sending ' + message + ' to '+ destination);

    // Register callbacks to desired message events : Fonctions qui seront appellees lors de l envoi de messages
    var eventHandlers = {
      'succeeded': function(e){ 
          console.log('message succeeded')/* Your code here */ },
      'failed':    function(e){ 
          console.log('message failed')/* Your code here */ }
    };

    var options = {
      'eventHandlers': eventHandlers
    };
    //Send message
    ua.sendMessage(destination, message, options);  
}; 


function call(){

    var session = null;
    var dest = 'sip:'+document.getElementById('callDest').value+'@officesip.local';

    // HTML5 <video> elements in which local and remote video will be shown
    var selfView =   document.getElementById('local-video');
    var remoteView =  document.getElementById('remote-video');

    // Register callbacks to desired call events
    var eventHandlers = {
      'progress':   function(e){ console.log('call progress')/* Your code here */ },
      'failed':     function(e){ 
		console.log('call failed')/* Your code here */ 
	  },
      'confirmed':  function(e){
        // Attach local stream to selfView
        //selfView.src = window.URL.createObjectURL(session.connection.getLocalStreams()[0]);
		localStream = session.connection.getLocalStreams()[0];
		selfView = JsSIP.rtcninja.attachMediaStream(selfView, localStream);
		console.log('call confirmed')
      },
	  'addstream':  function(e) {
		 
        var stream = e.stream;

        // Attach remote stream to remoteView
        remoteView.src = window.URL.createObjectURL(stream);
      },
      'ended':      function(e){ console.log('call ended')/* Your code here */ }
    };

    var options = {
      'eventHandlers': eventHandlers,
      'extraHeaders': [],
      'mediaConstraints': {'audio': true, 'video': true},
	  'pcConfig': {
					'iceServers': [
					  { 'urls': 'turn:'+ 'localhost:10001', 'username': 'user1', 'credential': ' 1234' }
					]
					}
    };

    session = ua.call(dest, options);
}

function onConnectClicked(){
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	login(username,password);
}


        
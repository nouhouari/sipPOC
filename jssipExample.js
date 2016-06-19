var sipServerHost = '192.168.99.100:8088/ws';
var ua;
var sipDomainName = '172.17.0.2';
var audio = new Audio('./audio/ring.mp3');
audio.loop = true;
var SESSION = null;

// HTML5 <video> elements in which local and remote video will be shown
var selfView =   document.getElementById('local-video');
var remoteView =  document.getElementById('remote-video');

//Enable JSSIP debug
//JsSIP.debug.enable('JsSIP:*');
JsSIP.debug.disable('JsSIP:*');

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
    console.log('connected: ' + e);/* Your code here */ 
    hideConnection();
}
            );
ua.on('disconnected', function(e){ 
    console.log('disconnected: ' + e);/* Your code here */
    showConnection();  
});
    
//SIP registration events : Fonctions qui seront appellees par JSSIP lors d event SIP      
ua.on('registered',  function(e){ 
    console.log('registered: ' + e);/* Your code here */
    hideConnection();

});
ua.on('unregistered',  function(e){ 
    console.log('unregistered: ' + e);/* Your code here */
    showConnection(); 
});
ua.on('registrationFailed',  function(e){ 
    console.log('registrationFailed: ' + e);/* Your code here */
    showConnection(); 
}); 

ua.on('newMessage', function(e){
    if(e.originator.toUpperCase() == "REMOTE"){
	 console.log("New message received : " + e.message.content + " from " + e.originator)
     appendMessage("messageList",'<< ' + e.message.content);
    }
});

ua.on('newRTCSession', function(e){
			console.log('newRTCSession');

            if(e.originator.toUpperCase() == "REMOTE"){
           
               hideCall();
               audio.play();
               
               var answerBtn = document.getElementById("answerBtn");
               answerBtn.onclick = function (){
                   audio.pause();

                    var session_incoming = e.session;
                    SESSION = e.session;

                    var audioActivated = document.getElementById("audioCB").checked;
                    var videoActivated = document.getElementById("videoCB").checked;
                        
                    var options = {
                    'mediaConstraints': {
                        'audio': true,
                        'video': true
                    }
                    };

                    console.log(options);

                    session_incoming.answer(options);
                    session_incoming.on('confirmed', function(e){
                        console.log('>>> CONFIRMED');
                    });
                    session_incoming.on('addstream', function(e){
                        console.log('>>> addstream');
                        var stream = e.stream;
                        // Attach remote stream to remoteView
                        JsSIP.rtcninja.attachMediaStream(remoteView, stream);
                    });

                    session_incoming.on( 'confirmed',  function(e){
                        // Attach local stream to selfView
                        //selfView.src = window.URL.createObjectURL(session.connection.getLocalStreams()[0]);
		                //Give a call
                        localStream = session.connection.getLocalStreams()[0];
		                selfView = JsSIP.rtcninja.attachMediaStream(selfView, localStream);
		                console.log('call confirmed');
                    });
               }
			}
			});			

//User agent start
console.log('Starting User Agent...');  
ua.start();
}

function showConnection() {
    document.getElementById("connectBtn").style.visibility = "visible";;
    document.getElementById("disConnectBtn").style.visibility = "hidden"; 
}

function hideConnection() {
    document.getElementById("connectBtn").style.visibility = "hidden";;
    document.getElementById("disConnectBtn").style.visibility = "visible"; 
}

function hideCall() {
    document.getElementById("callBtn").style.visibility = "hidden";;
    document.getElementById("answerBtn").style.visibility = "visible"; 
}

function showCall() {
    document.getElementById("callBtn").style.visibility = "visible";
    document.getElementById("answerBtn").style.visibility = "hidden"; 
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

function appendMessage(list, message) {
  var ul = document.getElementById(list);
  var li = document.createElement("li");
  li.appendChild(document.createTextNode(message));
  ul.appendChild(li);
}


function send(destination, message){
    // Sending a message
    //var text = document.getElementById('message').value;
    //var dest = 'sip:us1@officesip.local';
	
	console.log('Sending ' + message + ' to '+ destination);

    // Register callbacks to desired message events : Fonctions qui seront appellees lors de l envoi de messages
    var eventHandlers = {
      'succeeded': function(e){ 
          console.log('message succeeded')/* Your code here */ 
        appendMessage("messageList", '>> '+message);  
    },
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



    // Register callbacks to desired call events
    var eventHandlers = {
      'progress':   function(e){ console.log('call progress')/* Your code here */ },
      'failed':     function(e){ 
		console.log('call failed');/* Your code here */
        showCall();
	  },
      'confirmed':  function(e){
        // Attach local stream to selfView
        //selfView.src = window.URL.createObjectURL(session.connection.getLocalStreams()[0]);
		//Give a call
        localStream = session.connection.getLocalStreams()[0];
		selfView = JsSIP.rtcninja.attachMediaStream(selfView, localStream);
		console.log('call confirmed');
      },
	  'addstream':  function(e) {
		 
        var stream = e.stream;
        // Attach remote stream to remoteView
        JsSIP.rtcninja.attachMediaStream(remoteView, stream);
      },
      'ended':      function(e){ 
          console.log('call ended');
          showCall();/* Your code here */ 
         }
    };
    
    var audioActivated = document.getElementById("audioCB").checked;
    var videoActivated = document.getElementById("videoCB").checked;
                    

    var options = {
      'eventHandlers': eventHandlers,
      'extraHeaders': [],
      'mediaConstraints': {'audio': audioActivated, 'video': videoActivated}
      //,'pcConfig': {
     //					'iceServers': [
		//			  { 'urls': 'turn:'+ '192.168.99.100:10001', 'username': '101', 'credential': ' password' }
		//			]
		//			}
    };

    session = ua.call(dest, options);
}

function onConnectClicked(){
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	login(username,password);
}

function onDisconnectClicked(){
	ua.stop();
}




        
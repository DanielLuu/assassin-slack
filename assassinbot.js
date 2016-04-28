'use strict';

var util = require('util');
var Bot = require('slackbots');

var AssassinBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'assassinbot';

    this.user = null;
    this.db = null;

    this.players = [];
    this.targets = {};
    this.deadPlayers = [];
    this.gameStarted = false;
};

util.inherits(AssassinBot, Bot);

AssassinBot.prototype.run = function () {
    AssassinBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

AssassinBot.prototype._onStart = function () {
    this._loadBotUser();
};

AssassinBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromBot(message)
    ) {
      if(message.text.toLowerCase().indexOf("start") > -1 &&
        this._isMentioningAssassin(message)){
	      this._init();
      } else if(message.text.toLowerCase().indexOf("join",message.text.length - 5) > -1){
      	this._join(message);
      } else if(message.text.toLowerCase().indexOf("done",message.text.length - 5) > -1){
      	this._done();
      } else if(message.text.toLowerCase().indexOf("kill",message.text.length - 5) > -1){
      	this._kill(message);
      } else if(message.text.toLowerCase().indexOf("undo",message.text.length - 5) > -1){
        this._undo(message);
      } else if(message.text.toLowerCase().indexOf("reset",message.text.length - 6) > -1){
      	this._reset();
				this.postMessageToChannel(this.channels[0].name, 'The game has been reset!', {as_user: true});
      }
    }
};

AssassinBot.prototype._init = function () {
	console.log("Game started.");
	this.postMessageToChannel(this.channels[0].name, 'Type \"join\" to join the game.',{as_user: true});
};

AssassinBot.prototype._join = function (message) {
	if(this.gameStarted === false) {
		var joinUser;
    this.users.map(function (user) {
      if(user.id === message.user) {
        joinUser = user;
      }
    });
    if(this.players.indexOf(joinUser) === -1) {
  		console.log('Joined');
  		this.players.push(joinUser);
  		this.postMessageToChannel(this.channels[0].name, joinUser.name + ' has joined the game.  \n'+
  			this.players.length + ' players have joined the game.  Type done when everyone has joined.',{as_user: true});
    }
	} else {
		this.postMessageToChannel(this.channels[0].name, 'Sorry!  The game has already started.',{as_user: true});
	}
};

AssassinBot.prototype._leave = function (message) {
  if(this.gameStarted === false) {
    var leaveUser;
    this.players.map(function (user) {
      if(user.id === message.user) {
        leaveUser = user;
      }
    });
    for(var i = 0; i < this.players.length; i++){
      if(this.players[i].id === message.user) {
        console.log('Left');
        this.players.splice(i, 1);
        this.postMessageToChannel(this.channels[0].name, leaveUser.name + ' has left the game.' ,{as_user: true});
      }
    }
  } else {
    this.postMessageToChannel(this.channels[0].name, 'Sorry!  The game has already started.',{as_user: true});
  }
};

AssassinBot.prototype._done = function () {
  if(this.players.length > 2) {
  	var self = this;
  	self.gameStarted = true;
  	var tempPlayers = self.players.slice();
  	this.players.forEach(function(player) {
  		var victim = Math.floor((Math.random() * tempPlayers.length));
  		var target = tempPlayers[victim];
  		if(player.name === target.name){
  			while(player.name === target.name){
  				victim = Math.floor((Math.random() * tempPlayers.length));
  				target = tempPlayers[victim];
  			}
  		}
  	  tempPlayers.splice(victim, 1);
  		self.targets[player.id] = target;
  		console.log(player.name + '\'s target is ' + target.name);
  		self.postMessageToUser(player.name, 'Your target is ' + target.name, {as_user: true});
  	});
  	this.postMessageToChannel(this.channels[0].name, 'You have all been assigned your targets.  Good luck!',
      {as_user: true});
  } else {
    this.postMessageToChannel(this.channels[0].name, 'You must have at least 3 people to start.',
      {as_user: true});
  }
};

AssassinBot.prototype._reset = function () {
    this.players = [];
    this.targets = {};
    this.deadPlayers = [];
    this.gameStarted = false;
};

AssassinBot.prototype._kill = function (message) {
  if(this.gameStarted === true) {
  	var self = this;
  	var killer;
    this.players.map(function (user) {
      if(user.id === message.user) {
        killer = user;
      }
    });
    if(killer !== undefined) {
      var newTarget = self.targets[self.targets[killer.id].id];
      this.postMessageToChannel(this.channels[0].name, self.targets[killer.id].name + ' has been assassinated.', {as_user: true});
      if(newTarget.id !== killer.id){
        // Kill the victim
        var victim = this.players.indexOf(self.targets[killer.id]);
        this.deadPlayers.push(this.players[victim]);
        this.players.splice(victim, 1);
        self.postMessageToUser(self.targets[killer.id].name, 'You ded.', {as_user: true});

        // Assign the new target
      	self.targets[killer.id] = newTarget;
    	  self.postMessageToUser(killer.name, 'Your new target is ' + newTarget.name, {as_user: true});

        this.postMessageToChannel(this.channels[0].name, 'There are ' + this.players.length + ' players left in the game.', {as_user: true});
    	} else {
    		this._reset();
    		this.postMessageToChannel(this.channels[0].name, killer.name + ' is the winner!', {as_user: true});
    	}
    } else {
      this.users.map(function (user) {
        if(user.id === message.user) {
          killer = user;
        }
      });
      this.postMessageToChannel(this.channels[0].name, killer.name + ', you can\'t kill someone if you\'re dead', {as_user: true});
    }
  } else {
      this.postMessageToChannel(this.channels[0].name, 'The game hasn\'t started yet', {as_user: true});
    }
};

AssassinBot.prototype._undo = function (message) {
	this.players.push(this.deadPlayers.pop());
	var killer;
  this.players.map(function (user) {
      if(user.id === message.user) {
        killer = user;
      }
    });
	this.postMessageToChannel(this.channels[0].name, 'The last kill was undone.', {as_user: true});
};

AssassinBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

AssassinBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

AssassinBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

AssassinBot.prototype._isMentioningAssassin = function (message) {
    return message.text.indexOf(this.user.id) > -1 || message.text.toLowerCase().indexOf(this.name) > -1;
};

AssassinBot.prototype._isFromBot = function (message) {
    return message.user === this.user.id;
};

AssassinBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = AssassinBot;

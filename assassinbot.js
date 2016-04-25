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
      } else if(message.text.toLowerCase().indexOf("join") > -1){
      	this._join(message);
      } else if(message.text.toLowerCase().indexOf("done") > -1){
      	this._done();
      } else if(message.text.toLowerCase().indexOf("kill") > -1){
      	this._kill(message);
      } else if(message.text.toLowerCase().indexOf("reset") > -1){
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
  		this.postMessageToChannel(this.channels[0].name, joinUser.name + ' has joined the game.  '+
  			'Type done when everyone has joined.',{as_user: true});
    }
	} else {
		this.postMessageToChannel(this.channels[0].name, 'Sorry!  The game has already started.',{as_user: true});
	}
};

AssassinBot.prototype._leave = function (message) {
  console.log('Joined');
  var leaveUser;
  this.users.map(function (user) {
    if(user.id === message.user) {
      leaveUser = user;
    }
  });
  if(this.players.indexOf(leaveUser) > -1) {
    this.players.splice(leaveUser, 1);
    this.postMessageToChannel(this.channels[0].name, leaveUser.name + ' has left the game.' ,{as_user: true});
  }
};

AssassinBot.prototype._done = function () {
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
};

AssassinBot.prototype._reset = function () {
    this.players = [];
    this.targets = {};
    this.deadPlayers = [];
    this.gameStarted = false;
};

AssassinBot.prototype._kill = function (message) {
	var self = this;
	var killer;
  this.users.map(function (user) {
  	if(user.id === message.user) {
	  	killer = user;
	  }
  });
  var newTarget = self.targets[self.targets[killer.id].id];
  if(newTarget.id !== killer.id){
  	self.targets[killer.id] = newTarget;
	  self.postMessageToUser(killer.name, 'Your new target is ' + newTarget.name, {as_user: true});
	  self.postMessageToUser(newTarget.name, 'You ded.', {as_user: true});
	  var victim = this.players.indexOf(newTargetId);
	  this.deadPlayers.push(victim);
	  this.players.splice(victim, 1);
		this.postMessageToChannel(this.channels[0].name, 'There are ' + this.players.length + ' players left in the game.',
      {as_user: true});
	} else {
		this._reset();
		this.postMessageToChannel(this.channels[0].name, killer.name + ' is the winner!', {as_user: true});
	}
};

AssassinBot.prototype._undo = function (message) {
	this.players.push(this.deadPlayers.pop());
	var killer;
  this.users.map(function (user) {
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

// Read namelist
var fs = require('fs');
var file = __dirname + '/list.json';

var schedule = [
	{"hour": 18, "day": 2, "type": 0},
	{"hour": 19, "day": 2, "type": 1},
	{"hour": 9, "day": 5, "type": 1}	
];



var genList = function(data){
	rst = []
	for (i = 0; i < 3; i ++){
		rst.push(data.name_list[(i+data.cur_position) % data.name_list.length]);	
	}
	return rst
}

var precedeData = function(data){
	data.cur_position = (data.cur_position + 3) % data.name_list.length;
	return data
}

var sendGlobalEmail = function(data){
	list = genList(data);

	nameList = '';
	sendList = '';

	for (i = 0; i < list.length; i ++){
		sendList = sendList + list[i].email + ', ';
		nameList = nameList + list[i].name + ', ';
	}
	for (i = 0; i < data.name_list.length; i ++){
		sendList = sendList + data.name_list[i].email + ', ';
	}

	if (nameList.length == 0){
		console.log('unexpected namelist in sendEmail(data)');
		return;
	}

	sendList = sendList.slice(0, -2);
	nameList = nameList.slice(0, -2);

	var mailOptions = {
		from: 'No-reply@pkucvda.tk',
		to: sendList,
		subject: 'Group Meeting Notification #' + (data.week + 1),
		html: "Hi all, <br /><br />According to the reading list, <b>"
				 + nameList + 
				 "</b> will present papers for next Tuesday\'s group meeting. <br /><br />Please get prepared. <br /><br /> Best Regards. <br /><br />" 
				 + "<i>" + data.extra_message + "</i>"
	}

	console.log(mailOptions.html);

	transporter.sendMail(mailOptions, function(error, info){
		if (error){
			console.log(error);
		}else{
			console.log('Message sent:  ' + info.response);
		}
	});

}

var sendSingleEmail = function(data){
	list = genList(data);

	nameList = '';
	sendList = '';

	for (i = 0; i < list.length; i ++){
		sendList = sendList + list[i].email + ', ';
		nameList = nameList + list[i].name + ', ';
	}
	
	if (nameList.length == 0){
		console.log('Bad namelist in sendEmail(data)');
		return;
	}

	sendList = sendList.slice(0, -2);
	nameList = nameList.slice(0, -2);

	var mailOptions = {
		from: 'No-reply@pkucvda.tk',
		to: sendList,
		subject: 'Group Meeting Presenter Notification #' + (data.week + 1),
		html: "Hi all, <br /><br /><b>Note: If you receive this email, you are among the presenters list. </b><br /><br />According to the reading list, <b>"
		 		+ nameList + 
		 		"</b> will present papers for next Tuesday\'s group meeting. <br /><br />Please get prepared. <br /><br />Best Regards. <br /><br />" 
		 		+ "<i>" + data.extra_message + "</i>"
	}

	console.log(mailOptions.html);

	transporter.sendMail(mailOptions, function(error, info){
		if (error){
			console.log(error);
		}else{
			console.log('Message sent:  ' + info.response);
		}
	});

}


// http://javascript.about.com/library/blweekyear.htm
Date.prototype.getWeek = function() {
var onejan = new Date(this.getFullYear(),0,1);
return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

var date = new Date();

// Send emails
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'cvdasender@gmail.com',
		pass: 'pkuidmcvda'
	}
});

var cron = require('node-schedule');
var rule = new cron.RecurrenceRule();
rule.minute = 8;

////////////////////////////////// MAIN ///////////////////////////////////

var j = cron.scheduleJob(rule, function(){

	data = fs.readFileSync(file, 'utf8');
	data = JSON.parse(data);
		
	hour = date.getHours();
	day = date.getDay();

	sent = 0;
	toSend = schedule[data.messages_to_send];
	if (date.getWeek() > data.week){
		console.log('A new week!');
		data.week = date.getWeek();
		data.messages_to_send = 0;
		data.cur_position = (data.cur_position + 3) % data.name_list.length;

		fs.writeFileSync(file, JSON.stringify(data), 'utf8');
		return;
	}
	if (data.messages_to_send >= schedule.length){
		console.log('Nothing to send');
		console.log(JSON.stringify(genList(data)));
		return;
	}
	if (day == toSend.day && hour == toSend.hour){
		console.log('sendEmail()');
		if (toSend.type == 0){
			sendGlobalEmail(data);
			sent = 1;
		}
		if (toSend.type == 1){
			sendSingleEmail(data);
			sent = 1;
		}
	}

	// Transition
	if (!sent){
		console.log('Nothing to send');
		console.log(JSON.stringify(genList(data)));
	}
	else{
		data.messages_to_send = data.messages_to_send + 1;
		fs.writeFileSync(file, JSON.stringify(data), 'utf8');
		return;
	}

	console.log('Nothing done');
	fs.writeFileSync(file, JSON.stringify(data), 'utf8');
});

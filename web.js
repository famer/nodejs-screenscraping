var express = require("express");
var logfmt = require("logfmt");
var path = require("path");
var app = express();
var jsdom = require("jsdom");

var timematrix = [
        '7:30',
        '8:15',
        '9:15',
        '10:00',
        '11:00',
        '11:45',
        '12:45',
        '13:30',
        '14:30',
        '15:15',
        '16:15',
        '17:00',
        '18:00',
        '18:45',
        '20:30'
];

   app.set('view engine', 'jade');
   app.set('views', __dirname + '/views');
   app.use(logfmt.requestLogger());
   app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
		res.render('results'); 
});

app.get('/search', function(req, res) {
	var url = "https://usermap.cvut.cz/search/?js=true&attrs=exchPersonalId&format=HTML&query="+req.query.q;
	jsdom.env({
	  url: url, 
	  scripts: ["http://code.jquery.com/jquery.js"],
	  done: function (errors, window) {
	  	var $ = window.$;
	  	items = [];
	  	$("table[id=profile] tr:gt(0)").each(function(index,e) {
	  		items.push({id: $(e).attr('id'), 'name': $('td a', e).text()});
	  	});
	  	res.render('results', {items: items, query: req.query.q});
	  }
	});
});

app.get('/teacher/:username', function(req, res) {
	var url = 'https://usermap.cvut.cz/profile/' + req.params.username;
	jsdom.env({
	  url: url,
	  scripts: ["http://code.jquery.com/jquery.js"],
	  done: function (errors, window) {
	  	var $ = window.$;
	  	contacts = {};
	  	contacts.name = $('#name').text();
	  	contacts.phone = $('table[class=info-table]:eq(0) tr:eq(2) td:eq(1)').text();
	  	contacts.room = $('table[class=info-table]:eq(0) tr:eq(1) td:eq(1)').text();
	  	contacts.email = $('table[class=info-table]:eq(0) td:contains("E-mail")').next().text();//$('table[class=info-table]:eq(0) tr:eq(4) td:eq(1)').text();
	  	contacts.number = $('table[class=info-table]:eq(1) tr:eq(1) td:eq(1)').text();

	  	var tUrl = 'https://timetable.fit.cvut.cz/public/en/ucitele/' + contacts.number.substr(0,2) +
	'/' + contacts.number.substr(2,2) + '/u' + contacts.number + '000.html' ;

	  	getUrlOnTimetable(contacts.name, function(timetableUrl) {
	  		fetchAgendaWithCallBack(timetableUrl, req.query.day, function(data) {
		  		data.contacts = contacts;
		  		res.render('teacher', data);
		  	});
	  	});
	  	
	  	
	  }
	});
	

});

function getUrlOnTimetable(name, callback) {
	name = name.replace(",", "");
	var url = "https://timetable.fit.cvut.cz/public/en/ucitele/index.html";
	jsdom.env({
	  url: url,  
	  headers: {
        'Authorization': 'Basic dGF0YXJ0aW06cmFGeGVnRmoyVHlW'
    	},
	  scripts: ["http://code.jquery.com/jquery.js"],
	  done: function (errors, window) {
	  	
	  	var $ = window.$;
	  	
	  	var timetableUrl = $('a:contains("'+name+'"):eq(0)').attr('href');

	  	timetableFullUrl = "https://timetable.fit.cvut.cz/public/en/ucitele/" + timetableUrl;
	  	
	  	callback(timetableFullUrl);
	  	
	  	
	  }
	});
}

function fetchAgendaWithCallBack(url, day, callback) {
	
	console.log(url);
	jsdom.env({
	  url: url,  
	  headers: {
        'Authorization': 'Basic dGF0YXJ0aW06cmFGeGVnRmoyVHlW'
    	},
	  scripts: ["http://code.jquery.com/jquery.js"],
	  done: function (errors, window) {
	  	var $ = window.$;
	  	var data = {};
	  	var dayNumber = day || (new Date).getDay() - 1;
	  	
	  	var colspanSum = 0;
	  	var notAbsent = false;
	  	var rooms = [];
	  	console.log('day', dayNumber, url);
	  	$('table[class=timetable]:eq(0) tbody tr:eq(' + dayNumber + ') td:gt(0)').each(function(index, e) {
	  		console.log('!!!');
	  		var span = parseInt($(e).attr('colspan'));
	  		var room = $('a:eq(1)', $(e)).text();

	  		if ( room ) {
	  			notAbsent = true;
	  			rooms.push( { room: room, since: timematrix[colspanSum], till: timematrix[colspanSum+span]});
	  		}
	  		colspanSum += span;
	  	});
	  	data.day = $('table[class=timetable]:eq(0) tbody tr:eq(' + dayNumber + ') td:eq(0)').text();
	  	console.log(data.day);
	  	data.rooms = rooms;
	  	callback(data);
	  	
	  	
	  }
	});
	
}

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

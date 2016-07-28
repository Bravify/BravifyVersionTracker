var http = require('http');
var currentRelease = {};
var expiryTime;
var config;

try {
  config = require('./config.json');
} catch(e) {
  console.log("Error reading config file!");
  process.exit(99);
}

var logging = (config.logging || false);
var port, repo;

try {
  repo = config.repository;
  port = config.port;
  if(!port || !repo) {throw true;}
} catch(e) {
  console.log("Config file doesn't include all required information!");
  process.exit(98);
}

var github = require('octonode');
var client = github.client();
var ghrepo = client.repo(repo);

http.createServer(function (req, res) {
  cachedData(function(err, data) {
    if(err) {
      res.statusCode = 500;
      res.end(JSON.stringify(err));
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    }
  });
}).listen(port, function(){
  l("info", `Listening on port ${port}.`);
});

function cachedData(cb) {
  var currentTime = new Date().getTime();
  if(currentRelease.version && expiryTime && expiryTime > currentTime) {
    l("debug", "Using cached data. expiryTime: %d | currentTime: %d", expiryTime, currentTime);
    cb(null, currentRelease);
    return;
  } else {
    l("debug", "Downloading from GitHub.");
    ghrepo.releases(function(err, data) {
      if(err) {cb(err, null);return;}
      var r = {
        version: data[0].tag_name,
        assets: data[0].assets
      };

      cb(null, r);
      currentRelease = r;
      //cache data for 20 seconds.
      expiryTime = new Date().getTime() + 20000;
    });
  }
}

function l(lvl, msg) {
  if(logging) {
    var args = Array.prototype.slice.call(arguments);
    //remove first two elements, add
    args.splice(0, 2, `${timestamp()} | ${lvl.toUpperCase()}: ${msg}`);
    console.log.apply(this, args);
  }
}

function timestamp() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

  //pad time & date with leading zeroes
  for (var i=0; i < 3; i++) {
    if (time[i] < 10) {
      time[i] = "0" + time[i];
    }
    if (date[i] < 10) {
      date[i] = "0" + date[i];
    }
  }
  return `${date.join("/")} ${time.join(":")}`;
}

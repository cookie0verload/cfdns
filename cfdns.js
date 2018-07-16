var fs = require('fs');

//The previous perl script used a config file in the below location, leaving this as default for now.
//config_path='.env'
config_path='/etc/cfdns/cfdns.cfg'

if (!fs.existsSync(config_path)) {
    console.log('Config file does not exist. Quitting!');
    return 1
}

require('dotenv').config({path: config_path})

c_key = process.env.apikey;
c_email = process.env.email;
c_domain_name = process.env.domain;
c_subdomain_name = process.env.subdomain + '.' + process.env.domain;
c_cloudflare_apiurl = 'https://api.cloudflare.com/client/v4/zones';

// Set the headers
var headers = {
    'User-Agent':   'cfdns/0.2.0',
    'Content-Type': 'application/json',
    'X-Auth-Email':	c_email,
    'X-Auth-Key':	  c_key
}

//Compare against record in cloudflare and update if different

function cloudflare_get_zone(domain){

var request = require('request');

// Configure the request
var options = {
    url: c_cloudflare_apiurl,
    method: 'GET',
    headers: headers,
    qs: {'name': domain, 'status': 'active', 'page': '1', 'per_page': '2', 'order': 'status', 'direction': 'desc', 'match': 'all'}
}

return new Promise(function(resolve, reject) {
  // Start the request
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
        //  console.log(body);
  	     var jsonContent = JSON.parse(body);
         resolve(jsonContent.result[0].id);
       } else{
         reject(error);
       }
     })
})
}

function cloudflare_get_record(subdomain,zone_id){

var request = require('request');

// Configure the request
var options = {
    url: c_cloudflare_apiurl + '/' + zone_id + '/dns_records',
    method: 'GET',
    headers: headers,
    qs: {'name': subdomain, 'status': 'active', 'page': '1', 'per_page': '2', 'order': 'status', 'direction': 'desc', 'match': 'all'}
}

return new Promise(function(resolve, reject) {
  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
          // Print out the response body
        //  console.log(body);
    var jsonContent = JSON.parse(body);
    var subdomain_details = JSON.stringify(
        {
            "id": jsonContent.result[0].id,
            "name": jsonContent.result[0].name,
            "ip": jsonContent.result[0].content
        });

    resolve(subdomain_details);
  } else {
    reject(error);
  }
  })
})
}

function cloudflare_update_record(zone_id,subdomain_id,subdomain,public_ip){

var request = require('request');

var update_body = JSON.stringify(
    {
        "type": "A",
        "name": subdomain,
        "content": public_ip,
        "ttl": 120,
        "proxied": false
    });

// Configure the request
var options = {
    url: c_cloudflare_apiurl + '/' + zone_id + '/dns_records/' + subdomain_id,
    method: 'PUT',
    headers: headers,
}

return new Promise(function(resolve, reject) {
  // Start the request
  request(options, function (error, response, body) {
//    console.log(options);
//    console.log(update_body);
//    console.log('Response:');
//    console.log(body);

    if (!error && response.statusCode == 200) {
      // Print out the response body
      //  console.log(body);
    	var jsonContent = JSON.parse(body);
      resolve(jsonContent.success);
    } else {
      reject(error);
    }
  }).write(update_body);
})
}

//Functions specified, start.

var icanhazip = require('icanhazip');
var get_zone = cloudflare_get_zone(c_domain_name);

icanhazip.IPv4().then(function(public_ip) {
  console.log('public_ip=' + public_ip);
  get_zone.then(function(zone_id) {
         var get_record = cloudflare_get_record(c_subdomain_name,zone_id);
         console.log('zone_id=' + zone_id)
         get_record.then(function(subdomain_details) {
            var subdomain = JSON.parse(subdomain_details);
            var subdomain_name = subdomain.name;
            var subdomain_id = subdomain.id;
            var subdomain_ip = subdomain.ip;

            console.log('subdomain_id=' + subdomain_id);
            console.log('subdomain_name=' + subdomain_name);
            console.log('subdomain_ip=' + subdomain_ip);

            if ( subdomain_ip == public_ip ) {
              console.log('update_required=false');
              return
            } else {
              console.log('update_required=true');
              var update_record = cloudflare_update_record(zone_id,subdomain_id,subdomain_name,public_ip);
              update_record.then(function(status) {
                console.log('updated=' + status);
              }).catch(function(e) {
                console.error(e.message);
              });
            }
          }).catch(function(e) {
            console.error(e.message);
          });

       }).catch(function(e) {
         console.error(e.message);
       });
}).catch(function(e) {
  console.error(e.message);
});

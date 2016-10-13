#!/usr/local/bin/node

var request = require('request');
var Q = require('q');
var srcLan = 'zh';
var dstLan = 'cht';
var proc = require('child_process').spawn('pbcopy');

function detectLanguage(srcString) {
	var deferred = Q.defer();
	var onSuccess = function(err, httpResponse, body) {
		response = JSON.parse(body);
		if (err || response.error != 0) {
			console.error(err || response.msg)
			deferred.reject();
		}
		deferred.resolve(response.lan);
	}
	var onError = function(err, status) {
		deferred.reject(err);
	}

	request.post({
			url: 'http://fanyi.baidu.com/langdetect',
			form: {
				query: srcString.slice(0, 200)
			}
		},
		onSuccess,
		onError
	)
	return deferred.promise;
}

function translate(srcString) {
	var deferred = Q.defer();
	request.post({
		url: 'http://fanyi.baidu.com/v2transapi',
		form: {
			from: srcLan,
			to: dstLan,
			query: srcString,
			transtype: 'translang',
			simple_means_flag: '3'
		}
	}, function(err, httpResponse, body) {
		response = JSON.parse(body);
		if (err || response.error) {
			console.error(response);
			deferred.reject(err || response.error);
        }
		else
			deferred.resolve(response.trans_result.data[0].dst);
	}, function(err, status) {
		deferred.reject(err);
	})
	return deferred.promise;
}

function toSBC(tempString) {
	result = '';
	len = tempString.length;
	for (var i = 0; i < len; i++) {
		var cCode = tempString.charCodeAt(i);
		cCode = (cCode >= 0xFF01 && cCode <= 0xFF5E) ? cCode - 0xFEE0 : cCode;
		cCode = (cCode == 0x03000) ? 0x0020 : cCode;
		result += String.fromCharCode(cCode);
	}
	return result;
}

function showResult(src, dst) {
	console.log('----------------------------------');
	console.log(src);
	console.log('---> ');
	console.log(dst);
	console.log('----------------------------------');

	proc.stdin.write(dst);
	proc.stdin.end();
}

function doTranslate() {
	translate(srcString).then(
		function(dstString) {
			dstString = toSBC(dstString);
			showResult(srcString, dstString);
		},
		function() {
			console.error('invalid dst language: ' + dstLan);
		}
	);
}

function run() {
	if (process.argv.length >= 3) {
		srcString = process.argv[2].trim()
		if (process.argv.length == 4) {
			dstLan = process.argv[3].trim();
		}
		detectLanguage(srcString).then(
			function(language) {
				srcLan = language;
				doTranslate();
			},
			doTranslate
		);

	} else {
		console.log('usage: ./cn2tw.js src_string [dest_language: en/cht/...]');
	}
}

if (require.main === module) {
	run();
}
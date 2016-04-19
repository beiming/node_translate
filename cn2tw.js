#!/usr/local/bin/node

var request = require('request');
var Q   = require('q');
var srcLan = 'zh';
var dstLan = 'cht';

function PostCode(srcString) {
	var deferred = Q.defer();
	request.post({
		url: 'http://fanyi.baidu.com/v2transapi',
		form: {
			from: srcLan,
			to: dstLan,
			query:srcString,
			transtype: 'translang',
			simple_means_flag: '3'
		}
	}, function(err, httpResponse, body) {
		response = JSON.parse(body);
		deferred.resolve(response.trans_result.data[0].dst);
	}, function(err, status) {
		deferred.reject(err)
	})
	return deferred.promise
}

function toSBC(tempString) {
	result = '';
	len = tempString.length;
	for (var i=0; i < len; i++) {
		var cCode = tempString.charCodeAt(i);
		cCode = (cCode >= 0xFF01 && cCode <= 0xFF5E) ? cCode - 0xFEE0 : cCode;
		cCode = (cCode==0x03000)?0x0020:cCode;
		result += String.fromCharCode(cCode);
	}
	return result
}

function showResult(src, dst) {
	console.log('----------------------------------');
	console.log(src);
	console.log('---> ');
	console.log(dst);
	console.log('----------------------------------');
}

if (process.argv.length == 3) {
	srcString = process.argv[process.argv.length - 1]
	PostCode(srcString).then (
		function(dstString) {
			dstString = toSBC(dstString)
			showResult(srcString, dstString)
		}
	)
}
#!/usr/local/bin/node

var request = require('request');
var Q = require('q');
var _ = require('lodash');
var exec = require('child_process').exec;
var os = require('os');

var srcLan = 'en';
var dstLan = 'zh';

var sayIt = true

function getExplain(srcString) {
  var deferred = Q.defer();
  request.post({
    url: 'http://fanyi.baidu.com/transapi',
    form: {
      from: srcLan,
      to: dstLan,
      query: srcString,
      source: 'txt',
    }
  }, function(err, httpResponse, body) {
    response = JSON.parse(body);
    if (err || response.status != 0) {
      console.error(err || response.msg)
      deferred.reject(err || response.status);
    } else if (response.hasOwnProperty('data'))
      deferred.resolve(['data', response.data[0]]);
    else
      deferred.resolve(['result', JSON.parse(response.result)]);
  }, function(err, status) {
    deferred.reject(err);
  })
  return deferred.promise;
}

function showResult(type, result) {
  console.log('----------------------------------');
  console.log(result.src);
  if (type == 'data') {
    console.log();
    console.log(result.dst);
    return;
  }
  phonic = ''
  _.forEach(result.voice, function(obj) {
    phonicObj = _.toPairs(obj)[0];
    phonicObj[0] = phonicObj[0].split('_')[0];
    phonic += _.join(phonicObj, ': ');
    phonic += '  ';
  });
  console.log(phonic);
  console.log();
  _.forEach(result.content[0].mean, function(mean) {
    console.log(mean.pre + '  ' + _.keys(mean.cont).join('; '));
  })
  console.log('----------------------------------');
  sayWords(result.src);
}

function doTranslate(srcString) {
  getExplain(srcString).then(
    function(result) {
      showResult(result[0], result[1]);
    },
    function() {
      console.error('invalid dst language: ' + dstLan);
    }
  );
}

function sayWords(srcString) {
  if (sayIt && os.type() == 'Darwin')
    exec('say ' + srcString);
}

function run() {
  if (process.argv.length >= 3) {
    srcString = process.argv[2].trim();
    if (srcString.length <= 100) {
      doTranslate(srcString);
    } else {
      console.error('string is too long');
    }
  } else {
    console.log('usage: ./cn2tw.js dest_string');
  }
}

if (require.main === module) {
  run();
}

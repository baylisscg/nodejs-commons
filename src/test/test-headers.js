var Properties = require("properties"), vows = require("vows");
var assert = require("assert"), commons = require("../lib/commons");
var express= require("express");
var propStore = (new Properties()).load(process.env.AURIN_DIR
		+ "/nodejs-commons-combined.properties", function(err) {
	if (err != null) {
		console.log(err);
		return;
	}
	startTest(this);
});

function startTest(props) {
	commons.setup(props);
	vows.describe("properties").addBatch({
		"when requesting max-age" : {
			topic : function() {
				return props.get("maxage.default");
			},
			"we get something" : function(topic) {
				assert.notEqual(topic, null);
			}
		},
		"when calling fuction of the library " : {
			topic : function() {
				return {setObjectResponse: commons.setObjectResponse, 
					setRecordsetResponse: commons.setRecordsetResponse};
			},
			"those functions are defined" : function(topic) {
				assert.notEqual(topic.setObjectResponse, undefined);
				assert.notEqual(topic.setRecordsetResponse, undefined);
			}
		}
	}).run();
}

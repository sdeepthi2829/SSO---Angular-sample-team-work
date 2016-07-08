/*globals $ AtmoResource ApiChartData Backbone Ext atmometadata currentView FDN login updateView*/
function chartTest() {

    var api = AtmoResource.factory('api', {
        id: 'api101.atmosphere'
    });
    var acd;
    api.fetch({
    	success:function(model,response){
    		acd = new ApiChartData({
		        api: api,
		        TimeInterval: '5s',
		        Duration: '10s',
		        Environment: 'Sandbox'
		    });
    	}
    });
    
    return acd;
}

$(function () {

    ApiChartData = Backbone.Model.extend({
    
        initialize: function (args) {
            this.federationURL = args.federationURL;
            this.api = args.api;
        },
        
		knownParams: ["Environment", "StartDate", "EndDate", "TimeZone", "TimeInterval", "Duration", "ShowSummary", "ShowSLAs", "ReportType"],
		
        url: function () {
            
			var base = '/api/apis/versions/' + encodeURIComponent(this.api.attributes.LatestVersionID) + '/metrics';
            var url = (this.federationURL) ? federation + base : base;
            var params = this.knownParams;
            var query = [];
            var value;
			
            for (var i = 0; i < params.length; i++) {
                value = this.attributes[params[i]];
                if (value) {
                    query.push(params[i] + "=" + value);
                }
            }
            
            return url + '?' + query.join('&');
        },
        
        metrics: function () {
            var metrics;
            if (this.attributes.Interval) {
                metrics = this.attributes.Interval;
            }
            else {
                metrics = this.defaultMetrics();
            }
            
            var results = [];
            for (var i = 0; i < metrics.length; i++) {
                results.push(this.metricToObject(metrics[i]));
            }
            
            return results;
        },
        
        /**
         * Converts the data (a single object) into a proper object
         * @param {Object} data
         */
        metricToObject: function (data) {
        
            var mObject = {};
            var field;
            
            for (var i = 0; i < data.Metric.length; i++) {
                field = data.Metric[i];
                mObject[field.Name] = field.Value;
            }
            
            mObject.StartTime = data.StartTime;
            
            return mObject;
            
        },
        
        defaultMetrics: function () {
            var raw = ({
                "Metric": [{
                    "Name": "avgResponseTime",
                    "Value": 1
                }, {
                    "Name": "minResponseTime",
                    "Value": 2
                }, {
                    "Name": "maxResponseTime",
                    "Value": 3
                }, {
                    "Name": "totalCount",
                    "Value": 4
                }, {
                    "Name": "successCount",
                    "Value": 5
                }, {
                    "Name": "faultCount",
                    "Value": 6
                }],
                "StartTime": "1970-01-01T00:00:00Z"
            });
            
            return [raw];
        }
        
    });
    
    AppChartData = Backbone.Model.extend({
        
        initialize: function (args) {
            this.federationURL = args.federationURL;
            this.api = args.api;
        },
        
		knownParams: ["Environment", "StartDate", "EndDate", "TimeZone", "TimeInterval", "Duration", "ShowSummary", "ShowSLAs", "ReportType"],
		
        url: function () {
        	var base = '/api/apps/versions/' + encodeURIComponent(this.api.attributes.LatestVersionID) + '/metrics';
            var url = (this.federationURL) ? federation + base : base;
            var params = this.knownParams;
            var query = [];
            var value;
			
            for (var i = 0; i < params.length; i++) {
                value = this.attributes[params[i]];
                if (value) {
                    query.push(params[i] + "=" + value);
                }
            }
            
            return url + '?' + query.join('&');
        },
        
        metrics: function () {
            var metrics;
            if (this.attributes.Interval) {
                metrics = this.attributes.Interval;
            }
            else {
                metrics = this.defaultMetrics();
            }
            
            var results = [];
            for (var i = 0; i < metrics.length; i++) {
                results.push(this.metricToObject(metrics[i]));
            }
            
            return results;
        },
        
        /**
         * Converts the data (a single object) into a proper object
         * @param {Object} data
         */
        metricToObject: function (data) {
        
            var mObject = {};
            var field;
            
            for (var i = 0; i < data.Metric.length; i++) {
                field = data.Metric[i];
                mObject[field.Name] = field.Value;
            }
            
            mObject.StartTime = data.StartTime;
            
            return mObject;
            
        },
        
        defaultMetrics: function () {
            var raw = ({
                "Metric": [{
                    "Name": "avgResponseTime",
                    "Value": 1
                }, {
                    "Name": "minResponseTime",
                    "Value": 2
                }, {
                    "Name": "maxResponseTime",
                    "Value": 3
                }, {
                    "Name": "totalCount",
                    "Value": 4
                }, {
                    "Name": "successCount",
                    "Value": 5
                }, {
                    "Name": "faultCount",
                    "Value": 6
                }],
                "StartTime": "1970-01-01T00:00:00Z"
            });
            
            return [raw];
        }
        
    });
    
});


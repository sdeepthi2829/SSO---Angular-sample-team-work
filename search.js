/*globals $ Backbone */
$(function () {
	SearchResult = Backbone.Model.extend({});
    
    
    SearchResultList = Backbone.Collection.extend({
    
        model: SearchResult,
        
        initialize: function (args) {
        
            args = args ? args : {};
            
            this.search_args = {};
			this.search_args.sort = args.sort ? args.sort : null;
            this.search_args.sortBy = args.sortBy ? args.sortBy : null;
			this.search_args.count = 20;
            
			this.query_args = {};
			this.query_args.q = args.q ? args.q : null;
            this.query_args.type = args.type ? args.type.toUpperCase() : '*';
            
            this.meta = {
                startIndex: 0,
                totalResults: 0,
                itemsPerPage: this.search_args.count,
                pageSize: this.search_args.count, 
                elapsedTime: 0,
				page: 1
            };
			
			this.dirty = false;
			
        },
        
        query_string: function () {
        
            var querystring = [];
            
			//sorting and result sizes
            for (var p in this.search_args) {
                if (this.search_args[p]) {
                    querystring.push(p + '=' + this.search_args[p]);
                }
            }
			
			//pagination
			if (typeof this.page() === "number")
			  start_from = (this.page() - 1) * this.meta.itemsPerPage;
			else
			  start_from = 0;
			
			//alert(start_from);
			querystring.push("start=" + start_from);
			
			//the actual query
			var query = [];
			query.push("type:" + this.query_args.type.toUpperCase());
			if (this.query_args.q) {
				query.push(this.query_args.q);
			}
			querystring.push("q=" + query.join(" AND "));
            
            return '?' + querystring.join('&');
        },
        
        url: function () {
            return '/api/search' + this.query_string();
        },
		
		isDirty: function () {
			return this.dirty;
		},
        
        parse: function (resp, xhr) {
			
			this.dirty = true;
        
            var channel = resp.channel;
			
			
			var origPageSize = this.meta.pageSize;
			var pages =  Math.ceil(channel.totalResults / origPageSize);
			var page = Math.ceil(1 + (channel.startIndex / origPageSize));
            this.meta = {
                startIndex: channel.startIndex,
                totalResults: channel.totalResults,
                itemsPerPage: channel.itemsPerPage,
                elapsedTime: channel.elapsedTime,
                pageSize: origPageSize,
				pages: pages,
				page: page
            };
            
            var data = channel.item;
            
            return data;
        },
		
		hasNextPage: function () {
			return (this.meta.page < this.meta.pages);
		},
		
		page: function () {
			return this.meta.page;
		},
		
		pages: function () {
			return this.meta.pages;
		},
		
		nextPage: function () {
			if (this.hasNextPage()) {
				return this.page() + 1;
			} else {
				return this.page();
			}
		}
    });
    
});

// the URL of your hosted search index
var searchURL = 'http://wikisearch.blevesearch.com:8080/api/search.bleve/_search'

// the number of resuts to show per page
var resultsPerPage = 10;

// the max number of pages to show in the pager
var maxPagesToShow = 5;

var now = new Date();
var yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
var last7 = new Date(yesterday.getTime() - (6 * 24 * 60 * 60 * 1000));
var last30 = new Date(last7.getTime() - (23 * 24 * 60 * 60 * 1000));
var last60 = new Date(last30.getTime() - (30 * 24 * 60 * 60 * 1000));
var last90 = new Date(last60.getTime() - (30 * 24 * 60 * 60 * 1000));

// the facets to display
var facets =  {
	"Types": {
		"field": "type",
		"size": 5
	},
	"Modified": {
		"field": "last_modified",
		"size": 4,
		"date_ranges": [
			{
				"name": "Last 24 Hours",
				"start": ISODateString(yesterday)
			},
			{
				"name": "1-7 days",
				"start": ISODateString(last7),
				"end": ISODateString(yesterday)
			},
			{
				"name": "8-30 days",
				"start": ISODateString(last30),
				"end": ISODateString(last7)
			},
			{
				"name": "30+ days",
				"end": ISODateString(last30)
			},
		]
	}
};

var filters = {};



$(document).ready(function () {
	// load/compile some templates
	var searchResultsTmpl = Handlebars.compile($('#searchResultsTmpl').html());
	var searchNoHitsTmpl = Handlebars.compile($('#noHitsTmpl').html());
	var searchErrorTmpl = Handlebars.compile($('#searchErrorTmpl').html());

	// instead an on-submit handler which
	// resets things when the query changes
	$("#searchForm").submit(function() {
		newq = $("#query").val();
		if (newq !== userQuery) {
			// reset to first page
			$("#page").val(1);
			// reset filters
			$('input:checkbox').removeAttr('checked');
		}
	});

	userQuery = getURIParameter("q", false); //$.QueryString["q"];
	page = getURIParameter("p", false); //$.QueryString["p"];
	if (!page) {
		page = 1;
	}
	$("#page").val(page);

	parseFilters();

	from = (page-1)*resultsPerPage;

	if (userQuery) {
		$("#query").val(userQuery);
		data = {
			"size": resultsPerPage,
			"from": from,
			"query": {
				"conjuncts": [
					{
						"boost": 1.0,
						"query": userQuery
					}
				]
			},
			"fields": ["*"],
			"highlight":{
                "fields": ["content"],
            },
            "facets": facets
		};

		addQueryFilters(data);

		$.ajax({
			type: "POST",
			url: searchURL,
			processData: false,
			contentType: 'application/json',
			data: JSON.stringify(data),
			success: function(r) {
				console.log(r);

				addCheckedFilters(r);
				r.userQuery = userQuery;
				r.page = page;
				setupPager(r);
				if (r.total_hits > 0) {
					r.searchTime = roundTook(r.took);
					for(var i in r.hits) {
						var hit = r.hits[i];
						hit.roundScore = roundScore(hit.score);
					}
					$('#searchResultsArea').html(searchResultsTmpl(r));
				} else {
					$('#searchResultsArea').html(searchNoHitsTmpl(r));
				}
			},
			error: function(jqxhr, text, error) {
				var msg = error;
				if (msg === "" && jqxhr.readyState === 4) {
					msg = jqxhr.statusText;
				} else if (msg === "" && jqxhr.readyState === 0) {
					msg = "network error";
				}
				$('#searchResultsArea').html(searchErrorTmpl({"msg": msg}));
			}
		});
	}
});

function addCheckedFilters(r) {
	for (var cat in filters) {
		filtercat = filters[cat];
		for (var val in filtercat) {
			for (var ti in r.facets[cat].terms) {
				var term = r.facets[cat].terms[ti];
				if (term.term === val) {
					term.isChecked = true;
				}
			}
			for (var dri in r.facets[cat].date_ranges) {
				var dr = r.facets[cat].date_ranges[dri];
				if (dr.name === val) {
					dr.isChecked = true;
				}
			}
		}
	}
}

function parseFilters() {
	for (var fname in facets) {
//		fval = $.QueryString["f" + fname];
		fvals = getURIParameter("f"+fname, true);
		for (var fvi in fvals) {
			var fv = fvals[fvi];
			if (fname in filters) {
				filters[fname][fv] = true;
			} else {
				filters[fname] = {};
				filters[fname][fv] = true;
			}
		}
	}
}

function addQueryFilters(query) {
	for (var cat in filters) {
		filtercat = filters[cat];
		for (var val in filtercat) {
			if ("date_ranges" in facets[cat]) {
				for (var dri in facets[cat]["date_ranges"]) {
					var dr = facets[cat]["date_ranges"][dri];
					if (dr.name === val) {
						filter = {
							"field": facets[cat].field,
						};
						if ("start" in dr) {
							filter.start = dr.start;
						}
						if ("end" in dr) {
							filter.end = dr.end;
						}
						query.query.conjuncts.push(filter);
					}
				}
			} else {
				filter = {
					"field": facets[cat].field,
					"match_phrase": val
				};
				query.query.conjuncts.push(filter);
			}
		}
	}
}

// given results, set up everything the pager needs
function setupPager(results) {
    results.numPages = Math.ceil(results.total_hits/resultsPerPage);
    if (results.numPages > 1) {
		results.hasMultiplePages = true;
    }
    results.notOnFirstPage = false;
    if (results.page > 1) {
		results.notOnFirstPage = true;
    }
    results.notOnLastPage = false;
    if (results.page < results.numPages) {
		results.notOnLastPage = true;
    }
    results.validPages = [];
    for (i = 1; i <= results.numPages; i++) {
		clazz = "";
		if (i == results.page) {
			clazz = "active";
		}
        results.validPages.push({"index": i, "clazz": clazz});
    }


    // now see if we have too many pages
    if (results.validPages.length > maxPagesToShow) {
        numPagesToRemove = results.validPages.length - maxPagesToShow;
        frontPagesToRemove = backPagesToRemove = 0;
        while (numPagesToRemove - frontPagesToRemove - backPagesToRemove > 0) {
            numPagesBefore = results.page - 1 - frontPagesToRemove;
            numPagesAfter = results.validPages.length - results.page - backPagesToRemove;
            if (numPagesAfter > numPagesBefore) {
                backPagesToRemove++;
            } else {
                frontPagesToRemove++;
            }
        }

        // remove from the end first, to keep indexes simpler
        results.validPages.splice(-backPagesToRemove, backPagesToRemove);
        results.validPages.splice(0, frontPagesToRemove);
    }
}

// set the page, resubmit the form
function jumpToPage(page, e) {
	if (e) {
		e.preventDefault();
    }
	$("#page").val(page);
	$("#searchForm").submit();
	return false;
}

// convert score to ms, s or the string "<1ms"
function roundTook(took) {
    if (took < 1000 * 1000) {
        return "<1ms";
    } else if (took < 1000 * 1000 * 1000) {
        return "" + Math.round(took / (1000*1000)) + "ms";
    } else {
        roundMs = Math.round(took / (1000*1000));
        return "" + roundMs/1000 + "s";
    }
}

// make the score more presentable
function roundScore(score) {
	return Math.round(score*1000)/1000;
}

function toggleFilter(category, value, e) {
	// resubmit
	$("#searchForm").submit();
}

function addFilter(filtercat, value) {
	filtercat[value] = true;
}

function getURIParameter(param, asArray) {
    return document.location.search.substring(1).split('&').reduce(function(p,c) {
        var parts = c.split('=', 2).map(function(param) { return decodeURIComponent(param).replace(/\+/g, " "); });
        if(parts.length === 0 || parts[0] != param) return (p instanceof Array) && !asArray ? null : p;
        return asArray ? p.concat(parts.concat(true)[1]) : parts.concat(true)[1];
    }, []);
}

// a handlebars helper to let us check a checkbox
// found: http://stackoverflow.com/questions/24151022/bind-attr-handlebars-helper-ember-js-with-a-specific-value-check
Handlebars.registerHelper('checked', function(currentValue) {
    return currentValue == '1' ? ' checked="checked"' : '';
});

function ISODateString(d){
 function pad(n){return n<10 ? '0'+n : n;}
 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'}

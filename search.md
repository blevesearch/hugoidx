+++
author = ["Marty Schoch"]
date = "2015-06-11T16:03:09-04:00"
linktitle = "Search"
title = "Search"
subtitle = "Search"
type = "search"
+++
<form method="GET" id="searchForm" action="/search">
<div class="row">
    <!-- search form -->
    <div class="col-md-12">
            <div id="custom-search-input">
                <div class="input-group col-md-6 col-md-offset-3">
                    <input id="page" name="p" value="1" type="hidden"/>
                    <input id="query" name="q" type="text" class="form-control input-lg" placeholder="Search" />
                    <span class="input-group-btn">
                        <button id="searchButton" class="btn btn-info btn-lg" type="submit">
                            <i class="glyphicon glyphicon-search"></i>
                        </button>
                    </span>
                </div>
            </div>
    </div>
    <!-- search results -->
    <div id="searchResultsArea" class="col-md-12"></div>
</div>
</form>

<script id="searchResultsTmpl" type="text/x-handlebars-template">

    <h5>
        {{#hasMultiplePages}}Page {{page}} of {{/hasMultiplePages}}
        {{total_hits}} results ({{searchTime}})
    </h5>

    <div class="col-md-8">
    {{#hits}}
        <div>
            <b>
                <a class="resultLink" href="{{id}}">{{fields.title}}</a>
            </b>
                     
            <span class="badge pull-right">{{roundScore}}</span>
                    
            <div class="panel panel-default">
                <div class="panel-heading">

                    <b>{{fields.author}}</b> on {{fields.date}}
                </div>

                <div class="panel-body">
                    {{#fragments}}
                        <div>
                            {{#content}}
                                <div>{{{.}}}</div>
                            {{/content}}
                        </div>
                    {{/fragments}}
                </div>

            </div>
        </div>
    {{/hits}}
    </div>

    <div class="col-md-3 col-md-offset-1">
        <h3>Refine Results</h3>
        {{#each facets}}
            <div class="panel panel-default">
                <div class="panel-heading"><b>{{@key}}</b></div>
                <div class="panel-body">
                    {{#each terms}}
                    <div class="checkbox">
                      <label>
                        <input name="f{{@../key}}" type="checkbox" value="{{term}}" onclick="toggleFilter('{{@../key}}','{{term}}',event);" {{checked isChecked}}>
                        {{term}} ({{count}})
                      </label>
                    </div>
                    {{/each}}
                    {{#each date_ranges}}
                    <div class="checkbox">
                      <label>
                        <input name="f{{@../key}}" type="checkbox" value="{{name}}" onclick="toggleFilter('{{@../key}}','{{name}}',event);" {{checked isChecked}}>
                        {{name}} ({{count}})
                      </label>
                    </div>
                    {{/each}}
                </div>
            </div>
        {{/each}}
    </div>


    {{#hasMultiplePages}}
        <div class="col-md-4 col-md-offset-4">
            <ul class="pagination">
                {{#notOnFirstPage}}
                    <li>
                        <a onclick="jumpToPage({{prevPage}})" href="">&laquo;</a>

                {{/notOnFirstPage}}

                {{#validPages}}
                    <li class="{{clazz}}">
                        <a href="" onclick="jumpToPage({{index}}, event)">{{index}}</a>
                    </li>
                {{/validPages}}
                
                {{#notOnLastPage}}
                    <li>
                        <a onclick="jumpToPage(nextPage)" href="">&raquo;</a>
                    </li>
                {{/notOnLastPage}}
            </ul>
        </div>
    {{/hasMultiplePages}}
</script>
<script id="noHitsTmpl" type="text/x-handlebars-template">
    <h5>Your search - {{userQuery}} - did not match any documents.</h5>
</script>
<script id="searchErrorTmpl" type="text/x-handlebars-template">
    <h5>Error executing search: {{msg}}</h5>
</script>

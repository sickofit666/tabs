/***************************** MARCH CRAWL ***********************************/
// @tabversion 2.0

Tabs.MarchCrawl = {
	tabLabel: 'March Crawl',
	tabOrder: 1130,
	tabColor : 'gray',
	myDiv : null,
	Marches : new Array(),
	MarchIndex : new Array(),
	UIDSearch : '',
	CityIDSearch : '',
	MarchSearching : false,
	MarchCrawling : false,
	SearchIndex : 0,
	SearchList : new Array(),
	CrawlList : new Array(),
	DeleteList : new Array(),
	MarchData : new Array(),
	
	init : function (div){
		var t = Tabs.MarchCrawl;

		t.myDiv = div;
		
		var z = '<DIV align=center class=divHeader><B>MARCH DIRECTORY</B></DIV><br><div align="center"><a onclick=\'ptfetchmarch()\'>Open March Popup</a><br><TABLE cellSpacing=0 width=95% height=0%><tr><td class="xtab"><a id=ptexportmarches><b>Export Marches</b></a>&nbsp;Page:<INPUT class="btInput" id="exportpage" size=8 style="width: 70px" type=text /></td><td class="xtab" align=right id=btcrawltable1 style="display:none;"><b>Crawl Server for Additional Marches</b></td></tr>';
		z += '<tr><td class="xtab"><a id=ptimportmarches><b>Import Marches</b></a>&nbsp;<input id=ptmarchimportfile type=file></td><td class="xtab" align=right id=btcrawltable2 style="display:none;">March ID Range:&nbsp;<INPUT class="btInput" id="midmin" size=8 style="width: 70px" type=text />&nbsp;-&nbsp;<INPUT class="btInput" id="midmax" size=8 style="width: 70px" type=text />&nbsp;&nbsp;<a id=pttogglemarchcrawl><b>Crawl</b></a></td></tr></table>';
		z += '<br><DIV align=center class=divHeader><b>SEARCH MARCH DIRECTORY</b></div>';
		z += '<TABLE cellSpacing=0 width=95% height=0%><tr><td class="xtab">Search for UID/Name: <INPUT class="btInput" id="UIDSearch" size=16 style="width: 115px" type=text value="'+t.UIDSearch+'" />&nbsp;City ID: <INPUT class="btInput" id="CityIDSearch" size=16 style="width: 115px" type=text value="'+t.CityIDSearch+'" />&nbsp;&nbsp;&nbsp;&nbsp;Search March Destination<INPUT type=checkbox id="SearchTo"></td></td><td class="xtab" align=right><a id=pttogglemarchsearch><b>Search</b></a></td></tr></table>';
		z += '<TABLE align=center cellSpacing=0 width=98% height=0%><tr><td class="xtab" align=center id=searchprogress>&nbsp;</td></tr></table>';
		z += '<div id=searchresults style="maxheight:500px; height:500px; overflow-y:auto">';
		z += '</div></div>';
		
		div.innerHTML = z;
		
		if (trusted) { ById('btcrawltable1').style.display = '';ById('btcrawltable2').style.display = ''; }	
		
		document.getElementById('pttogglemarchsearch').addEventListener('click', function () { t.toggleMarchSearch(); }, false);
		document.getElementById('pttogglemarchcrawl').addEventListener('click', function () { t.toggleMarchCrawl(); }, false);
		document.getElementById('ptexportmarches').addEventListener('click', function () { t.ExportMarches(); }, false);
		document.getElementById('ptimportmarches').addEventListener('click', function () { t.ImportMarches(); }, false);
	},
	hide : function (){ },
	show : function (){ },
	
	CrawlResult : function (rslt,rslt2,march) {
		var t = Tabs.MarchCrawl;
		setTimeout( function () {t.catalogMarch(rslt,rslt2,march);},0); // get around unsafewindow GM_SetValue error
	},	

	ExportMarches : function() {
		var t = Tabs.MarchCrawl;
		var page = parseIntNan(document.getElementById('exportpage').value);

		t.loadMarchIndex();
		if (page!=0) {
			var found = false;
			for (var a in t.MarchIndex) {
				if (t.MarchIndex[a] == page) { found = true; }
			}	
			if(!found) {
				document.getElementById('searchprogress').innerHTML = 'No such page';
				return;
			}
			document.getElementById('searchprogress').innerHTML = 'Exporting page'+page+'...';
			t.loadMarches(page*1000);
	
			URIContent = 'data:application/octet-stream,' + encodeURIComponent(JSON2.stringify(t.Marches));
		}
		else {
			var LocalMarches = [];
			var found = false;
			for (var a in t.MarchIndex) {
				found = true;
				page = t.MarchIndex[a];
				document.getElementById('searchprogress').innerHTML = 'Exporting page'+page+'...';
				t.loadMarches(page*1000);
				for (var b=0;b<t.Marches.length;b++) {
					LocalMarches.push(t.Marches[b]);
				}
			}	
			if(!found) {
				document.getElementById('searchprogress').innerHTML = 'No marches';
				return;
			}
			URIContent = 'data:application/octet-stream,' + encodeURIComponent(JSON2.stringify(LocalMarches));
		}
		NewWindow = window.open(URIContent, 'MARCHES.TXT');                
		document.getElementById('searchprogress').innerHTML = 'Export Complete.';
	},

	ImportMarches : function() {
		var t = Tabs.MarchCrawl;
		var fileInput = document.getElementById("ptmarchimportfile");
		var files = fileInput.files;
		if (files.length == 0) {
			document.getElementById('searchprogress').innerHTML = 'Please select a file.';
			return;
		}
		var file = files[0];
		var reader = new FileReader();

		reader.onload = function (e) {
			var l = JSON2.parse(e.target.result,'[]');
			if (matTypeof(l) == 'array') { t.MarchData = l; }

			for (var M in t.MarchData) {
				var march = t.MarchData[M];
				if (march.marchId) {
					document.getElementById('searchprogress').innerHTML = 'Importing '+march.marchId+'...';
					t.loadMarches(march.marchId);
					for (var a in t.Marches) {
						if (t.Marches[a].marchId == march.marchId) {t.Marches.splice(a,1);break; }
					}	
					t.Marches.push(march);
					t.Marches.sort(function(a, b){return a.marchId-b.marchId});
					t.saveMarches(march.marchId);
				}	
			}	
			document.getElementById('searchprogress').innerHTML = 'Import Complete.';
		};
		reader.readAsText(file);
	},

	toggleMarchCrawl : function () {
		var t = Tabs.MarchCrawl;
		var from = parseIntNan(document.getElementById('midmin').value);
		var to = parseIntNan(document.getElementById('midmax').value);
		if (from == 0 || to == 0) {
			document.getElementById('searchprogress').innerHTML = 'Please select from and to march ids';
			return;
		}
		t.CrawlList = [];
		var lastpage = -1;
		for (var mid = from;mid <= to;mid++) {
			var page = Math.floor(mid/1000);
			if (page != lastpage) {
				t.loadMarches(mid);
			}	
			var got = false;
			for (var a in t.Marches) {
				if (t.Marches[a].marchId == mid) {got = true; }
			}
			if (!got) { t.CrawlList.push(mid);}
		}
		if (t.CrawlList.length > 0) {
			setTimeout(t.CrawlMarches,0,true);
		}	
	},

	toggleMarchSearch : function () {
		var t = Tabs.MarchCrawl;
		if (t.MarchSearching) {
			t.MarchSearching = false;
			document.getElementById('pttogglemarchsearch').innerHTML = '<b>Search</b>';
		}
		else {
			t.UIDSearch = document.getElementById('UIDSearch').value;
			t.CityIDSearch = document.getElementById('CityIDSearch').value;
			if (t.UIDSearch == "" && t.CityIDSearch == "") {
				document.getElementById('searchprogress').innerHTML = 'Please select search criteria';
				return;
			}
			t.MarchSearching = true;
			document.getElementById('pttogglemarchsearch').innerHTML = 'Stop Search!';
			document.getElementById('searchresults').innerHTML = '<table width=100%><tr><th class=xtabHD>ID</th><th class=xtabHD>From</th><th class=xtabHD>City</th><th class=xtabHD>Co-ords</th><th class=xtabHD>Type</th><th class=xtabHD width=300>To</th><th class=xtabHD>Age</th><th class=xtabHD><INPUT type=checkbox id="mchkall"></th></tr><tr id=nextrow></tr></table>';
			document.getElementById('mchkall').addEventListener('change', function () { t.ToggleAllMarches(); }, false);
			t.loadMarchIndex();
			t.SearchIndex = 0;
			t.SearchList = [];
			setTimeout(t.DoMarchSearch,0);
		}
	},

	DoMarchSearch : function () {
		var t = Tabs.MarchCrawl;
		if (!t.MarchSearching) {
			document.getElementById('searchprogress').innerHTML = 'Search Stopped by User';
			document.getElementById('nextrow').outerHTML = '<tr><td colspan=7 align=right class=xtab><a id=ptrefreshmarches><b>Refresh Ticked Marches</b></a></td></tr><tr><td colspan=7 align=right class=xtab><a id=ptdeletemarches><b>Delete Ticked Marches</b></a></td></tr>';
			document.getElementById('ptrefreshmarches').addEventListener('click', function () { t.RefreshTickedMarches(); }, false);
			document.getElementById('ptdeletemarches').addEventListener('click', function () { t.DeleteTickedMarches(); }, false);
			return;
		}

		var SearchTo = document.getElementById('SearchTo').checked;
		var page = t.MarchIndex[t.SearchIndex];
		document.getElementById('searchprogress').innerHTML = 'Searching '+page+'...';
		t.loadMarches(page*1000);
		var now = unixTime();
		for (var a in t.Marches) {
			var M = t.Marches[a];
			var AddMarch = false;
			if (M.marchId) {
				if (((M.fromPlayerName != "" && M.fromPlayerName.toUpperCase() == t.UIDSearch.toUpperCase()) || M.fromPlayerId == t.UIDSearch || t.UIDSearch == "") && (M.fromCityId == t.CityIDSearch || t.CityIDSearch == "")) {
					AddMarch = true;
				}
				if (SearchTo && ((M.toPlayerName != "" && M.toPlayerName.toUpperCase() == t.UIDSearch.toUpperCase()) || M.toPlayerId == t.UIDSearch || t.UIDSearch == "") && (M.toCityId == t.CityIDSearch || t.CityIDSearch == "")) {
					AddMarch = true;
				}
			}	
			if (AddMarch) {
				t.SearchList.push(M.marchId);
				var returnUnixTime = M.returnUnixTime - now;
				if (returnUnixTime < 0) {
					var Age = uW.timestr(returnUnixTime*(-1)) +' ago';
				}
				else {
					var Age = '* Current *';
				}
				var ToPlayer = "";
				if (M.toPlayerId != 0) { ToPlayer = " UID "+M.toPlayerId;}
				if (M.toPlayerName != "") { ToPlayer += " ("+M.toPlayerName+")";}
				if (M.toCityId != 0) { ToPlayer += " City "+M.toCityId;}
			
				var marchType = parseInt(M.marchType);
				if (marchType == 10) marchType=4; // Change Dark Forest type to Attack!
				var	hint = "";
				switch (marchType) {
					case 1: hint=uW.g_js_strings.commonstr.transport;break;
					case 2: hint=uW.g_js_strings.commonstr.reinforce;break;
					case 3: hint=uW.g_js_strings.commonstr.scout;break;
					case 4: hint=uW.g_js_strings.commonstr.attack;break;
					case 5: hint=uW.g_js_strings.commonstr.reassign;break;
				} 
				document.getElementById('nextrow').outerHTML = '<tr id=m'+M.marchId+'><td class=xtab><a onclick=\'ptfetchmarch('+M.marchId+')\'>'+M.marchId+'</a></td><td class=xtab>'+M.fromPlayerId+' ('+M.fromPlayerName+')</td><td class=xtab>'+M.fromCityId+'</td><td class=xtab>'+coordLink(M.fromXCoord,M.fromYCoord)+'</td><td class=xtab>'+hint+'</td><td class=xtab>'+coordLink(M.toXCoord,M.toYCoord)+ToPlayer+'</td><td class=xtab>'+Age+'</td><td class=xtab style="padding-left:16px;"><INPUT type=checkbox id="mchk'+M.marchId+'"></td></tr><tr id=nextrow></tr>';
			}
		}	
	
		t.SearchIndex = t.SearchIndex + 1;
		if (t.SearchIndex >= t.MarchIndex.length) {
			document.getElementById('searchprogress').innerHTML = 'Search Complete';
			document.getElementById('pttogglemarchsearch').innerHTML = '<b>Search</b>';
			document.getElementById('nextrow').outerHTML = '<tr><td colspan=7 align=right class=xtab><a id=ptrefreshmarches><b>Refresh Ticked Marches</b></a></td></tr><tr><td colspan=7 align=right class=xtab><a id=ptdeletemarches><b>Delete Ticked Marches</b></a></td></tr>';
			document.getElementById('ptrefreshmarches').addEventListener('click', function () { t.RefreshTickedMarches(); }, false);
			document.getElementById('ptdeletemarches').addEventListener('click', function () { t.DeleteTickedMarches(); }, false);
			t.MarchSearching = false;
		}
		else {
			t.DoMarchSearch();
		}
	},

	RefreshTickedMarches : function () {
		var t = Tabs.MarchCrawl;
		t.CrawlList = [];
		for (var a in t.SearchList) {
			if (document.getElementById('mchk'+t.SearchList[a]) && document.getElementById('mchk'+t.SearchList[a]).checked) {
				t.CrawlList.push(t.SearchList[a]);
			}
		}
		if (t.CrawlList.length > 0) {
			setTimeout(t.CrawlMarches,0,false);
		}	
	},

	DeleteTickedMarches : function () {
		var t = Tabs.MarchCrawl;
		t.DeleteList = [];
		for (var a in t.SearchList) {
			if (document.getElementById('mchk'+t.SearchList[a]) && document.getElementById('mchk'+t.SearchList[a]).checked) {
				t.DeleteList.push(t.SearchList[a]);
			}
		}
		if (t.DeleteList.length > 0) {
			setTimeout(t.DeleteMarches,0,false);
		}	
	},

	CrawlMarches : function (qc) {
		var t = Tabs.MarchCrawl;
		var mid = t.CrawlList[0];
		t.CrawlList.splice(0,1);
		document.getElementById('searchprogress').innerHTML = 'Requesting march '+mid+' from server...';
		ChatStuff.fetchmarch(mid,t.CrawlResult,qc)
		if (t.CrawlList.length > 0) {
			setTimeout(t.CrawlMarches,2000,qc);
		}
		else {
			document.getElementById('searchprogress').innerHTML = 'Crawl complete.';
		}
	},

	DeleteMarches : function (qc) {
		var t = Tabs.MarchCrawl;
		var mid = t.DeleteList[0];
		t.DeleteList.splice(0,1);
		document.getElementById('searchprogress').innerHTML = 'Deleting march '+mid+' from database...';

		t.loadMarches(mid);
		for (var a in t.Marches) {
			if (t.Marches[a].marchId == mid) {t.Marches.splice(a,1);break; }
		}	
		t.saveMarches(mid);

		if (t.DeleteList.length > 0) {
			setTimeout(t.DeleteMarches,250,qc);
		}
		else {
			document.getElementById('searchprogress').innerHTML = 'Delete complete.';
		}
	},

	ToggleAllMarches : function () {
		var t = Tabs.MarchCrawl;
		for (var a in t.SearchList) {
			if (document.getElementById('mchk'+t.SearchList[a])) {
				document.getElementById('mchk'+t.SearchList[a]).checked = document.getElementById('mchkall').checked;
			}
		}	
	},

	loadMarchIndex : function () {
		var t = Tabs.MarchCrawl;
		var l = JSON2.parse(GM_getValue ('MarchIndex_'+getServerId(), '[]'));
		if (matTypeof(l) == 'array') { t.MarchIndex = l; }
	},

	saveMarchIndex : function () {
		var t = Tabs.MarchCrawl;
		GM_setValue ('MarchIndex_'+getServerId(), JSON2.stringify(t.MarchIndex));
	},

	loadMarches : function (mid) {
		var t = Tabs.MarchCrawl;
		var page = Math.floor(mid/1000);
		var l = JSON2.parse(GM_getValue ('Marches_'+getServerId()+'_'+page, '[]'));
		if (matTypeof(l) == 'array') { t.Marches = l; }
	},

	saveMarches : function (mid) {
		var t = Tabs.MarchCrawl;
		var page = Math.floor(mid/1000);
		GM_setValue ('Marches_'+getServerId()+'_'+page, JSON2.stringify(t.Marches));
		t.loadMarchIndex();
		var NewPage = true;
		for (var a in t.MarchIndex) {
			if (t.MarchIndex[a] == page) { NewPage = false; }
		}	
		if (NewPage) {t.MarchIndex.push(page);t.MarchIndex.sort(function(a, b){return a-b}); }
		t.saveMarchIndex();
	},

	catalogMarch : function (rslt,rslt2,march) {
		var t = Tabs.MarchCrawl;
		t.loadMarches(march.marchId);
		var M = new Object();
		M.marchId = march.marchId;
		M.fromPlayerId = march.fromPlayerId;
		M.fromPlayerName = rslt.userInfo[0].name;
		M.fromCityId = march.fromCityId;
		M.fromXCoord = march.fromXCoord;
		M.fromYCoord = march.fromYCoord;
		M.toXCoord = march.toXCoord;
		M.toYCoord = march.toYCoord;
		if (march.toPlayerId && march.toPlayerId != 0) {
			M.toPlayerId = march.toPlayerId;
			M.toPlayerName = rslt2.userInfo[0].name;
			M.toCityId = march.toCityId;
		}
		else {
			M.toPlayerId = 0;
			M.toPlayerName = "";
			M.toCityId = 0;
		}
		M.marchType = parseInt(march.marchType);
		M.marchStatus = parseInt(march.marchStatus);
		M.destinationUnixTime = convertTime(new Date(march["destinationEta"].replace(" ", "T")+"Z"));
		M.returnUnixTime = convertTime(new Date(march["returnEta"].replace(" ", "T")+"Z"));
		for (var a in t.Marches) {
			if (t.Marches[a].marchId == M.marchId) {t.Marches.splice(a,1);break; }
		}	
		t.Marches.push(M);
		t.Marches.sort(function(a, b){return a.marchId-b.marchId});
		t.saveMarches(march.marchId);
		if (document.getElementById('m'+M.marchId)) {
			var now = unixTime();
			var returnUnixTime = M.returnUnixTime - now;
			if (returnUnixTime < 0) {
				var Age = uW.timestr(returnUnixTime*(-1)) +' ago';
			}
			else {
				var Age = '* Current *';
			}
			var ToPlayer = "";
			if (M.toPlayerId != 0) { ToPlayer = " UID "+M.toPlayerId;}
			if (M.toPlayerName != "") { ToPlayer += " ("+M.toPlayerName+")";}
			if (M.toCityId != 0) { ToPlayer += " City "+M.toCityId;}
		
			var marchType = parseInt(M.marchType);
			if (marchType == 10) marchType=4; // Change Dark Forest type to Attack!
			var	hint = "";
			switch (marchType) {
				case 1: hint=uW.g_js_strings.commonstr.transport;break;
				case 2: hint=uW.g_js_strings.commonstr.reinforce;break;
				case 3: hint=uW.g_js_strings.commonstr.scout;break;
				case 4: hint=uW.g_js_strings.commonstr.attack;break;
				case 5: hint=uW.g_js_strings.commonstr.reassign;break;
			} 
		
			document.getElementById('m'+M.marchId).outerHTML = '<tr id=m'+M.marchId+'><td class=xtab><a onclick=\'ptfetchmarch('+M.marchId+')\'>'+M.marchId+'</a></td><td class=xtab>'+M.fromPlayerId+' ('+M.fromPlayerName+')</td><td class=xtab>'+M.fromCityId+'</td><td class=xtab>'+coordLink(M.fromXCoord,M.fromYCoord)+'</td><td class=xtab>'+hint+'</td><td class=xtab>'+coordLink(M.toXCoord,M.toYCoord)+ToPlayer+'</td><td class=xtab>'+Age+'</td><td class=xtab style="padding-left:16px;"><INPUT type=checkbox id="mchk'+M.marchId+'"></td></tr><tr id=nextrow></tr>';
		}	
	},
};
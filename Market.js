/**************************** Market Tab ****************************************/
// @tabversion 2.0

Tabs.Market = {
	tabLabel: 'Market',
	tabOrder: 8000,
	tabColor : 'gray',
	myDiv: null,
	timer: null,
	LoopCounter: 0,
	intervalSecs  : 10, 
	autodelay : 0,
	Options: {
		Running: false,
		Enabled : {1:true,2:true,3:true,4:true,5:true,6:true,7:true,8:true},
		r1 : 1,
		r2 : 1,
		r3 : 1,
		r4 : 1,
		r1Enabled : false,
		r2Enabled : false,
		r3Enabled : false,
		r4Enabled : false,
		Toggle : false,
		MinGold : 5000,
	},
   
	init: function (div) {
		var t = Tabs.Market;
        t.myDiv = div;
		
		if (!Options.MarketOptions) {
			Options.MarketOptions = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.MarketOptions.hasOwnProperty(y)) {
					Options.MarketOptions[y] = t.Options[y];
				}	
			}
		}

		if (Options.MarketOptions.Toggle) AddSubTabLink('AutoMarket',t.toggleAutoMarketState, 'MarketToggleTab');
		SetToggleButtonState('Market',Options.MarketOptions.Running,'Market');
	
		var m = '<DIV class=divHeader align=center>'+translate('MARKET ADMINISTRATION')+'</div>';
		m += '<div align="center">';

        m += '<table width=100% class=xtab><tr><td width=30%><INPUT id=btMarketToggle type=checkbox '+ (Options.MarketOptions.Toggle?'CHECKED ':'') +'/>&nbsp;'+translate("Add toggle button to main screen header")+'</td><td colspan=2 align=center><INPUT id=btAutoMarketState type=submit value="'+translate("AutoMarket")+' = '+ (Options.MarketOptions.Running?'ON':'OFF')+'"></td><td width=30% align=right>&nbsp;</td></tr>';
		m += '<tr><td colspan=2 align=left>&nbsp;</td><td colspan=2 align=right>'+translate('Minimum Gold')+':&nbsp;<input type=text value="'+Options.MarketOptions.MinGold+'" size=9 maxlength=10 id=btMarketMinGold>&nbsp;&nbsp;</td></tr></table>';
		m += '<table class=xtab><tr><td><INPUT id=pbmarketchkr1 type=checkbox '+ (Options.MarketOptions.r1Enabled?'CHECKED ':'') +'/></td><td align="right">'+translate('Buy Food when price is')+' :&nbsp;</td><td><INPUT id=pbmarketr1 type=text value=' + Options.MarketOptions.r1 + '>&nbsp;or lower</td></tr>';
		m += '<tr><td><INPUT id=pbmarketchkr2 type=checkbox '+ (Options.MarketOptions.r2Enabled?'CHECKED ':'') +'/></td><td align="right">'+translate('Buy Wood when price is')+' :&nbsp;</td><td><INPUT id=pbmarketr2 type=text value=' + Options.MarketOptions.r2 + '>&nbsp;or lower</td></tr>';
		m += '<tr><td><INPUT id=pbmarketchkr3 type=checkbox '+ (Options.MarketOptions.r3Enabled?'CHECKED ':'') +'/></td><td align="right">'+translate('Buy Stone when price is')+' :&nbsp;</td><td><INPUT id=pbmarketr3 type=text value=' + Options.MarketOptions.r3 + '>&nbsp;or lower</td></tr>';
		m += '<tr><td><INPUT id=pbmarketchkr4 type=checkbox '+ (Options.MarketOptions.r4Enabled?'CHECKED ':'') +'/></td><td align="right">'+translate('Buy Ore when price is')+' :&nbsp;</td><td><INPUT id=pbmarketr4 type=text value=' + Options.MarketOptions.r4 + '>&nbsp;or lower</td></tr></table>';

		m += '<br><DIV id=btMarketOverviewDiv style="width:'+GlobalOptions.btWinSize.x+'px;overflow-x:auto;">';
		
		m += '<TABLE width=98% class=xtab cellpadding=1 cellspacing=0 align=center style="font-size:'+Options.OverviewOptions.OverviewFontSize+'px;"><TR valign=bottom><td width=20>&nbsp;</td><td width=40>&nbsp;</td>';
		
		for (var i = 1; i <= Cities.numCities; i++) {
			m += '<TD style="font-size:11px;" align=center width=100><span id="btMarketCity_'+i+'"><B>'+Cities.cities[i-1].name.substring(0, 12)+'</b></span></td>';
		}
		m += "<td>&nbsp;</td>"; // spacer
		m += '</tr><TR align=right class="oddRow"><TD colspan=2 align=right><b>'+translate('Active')+'&nbsp;</b></td>';
		for (var i = 1; i <= Cities.numCities; i++) {
			m += '<TD><div class=xtabBorder align=center><INPUT class='+i+' id="btMarketAutoCity_'+i+'" type=checkbox '+(Options.MarketOptions.Enabled[i]?'CHECKED':'')+'></div></td>';
		}
		m += '</tr><TR align=right class="evenRow"><TD colspan=2 align=right><b>'+translate('Market')+'&nbsp;</b></td>';
		for (var i = 1; i <= Cities.numCities; i++) {
			m += '<TD><div class=xtabBorder align=center><span id="btMarketLevelCity_'+i+'">&nbsp;</span></div></td>';
		}
		m += '</tr><TR align=right class="oddRow"><TD colspan=2 align=right style="padding-top:2px;vertical-align:top;padding-left:0px;"><b>'+uW.g_js_strings.commonstr.status+'&nbsp;</b></td>';
		for (var i = 1; i <= Cities.numCities; i++) {
			m += '<TD><div align=center class=xtabBorder style="height:60px;"><span id="btMarketStatusCity_'+i+'">&nbsp;</span></div></td>';
		}
		m += '</tr><TR align=right class="evenRow"><TD style="padding-left: 0px;"><img height=18 src='+IMGURL+'gold_30.png title="'+uW.g_js_strings.commonstr.gold+'"></td><td><div id=btTotMarketGold class="totalCell xtabBorder">&nbsp;</div></td>';
		for (var i = 1; i <= Cities.numCities; i++) {
			m += '<TD><div align=center class=xtabBorder><span id="btMarketGoldCity_'+i+'">&nbsp;</span></div></td>';
		}
		
		m += '</tr></table></div></div>';
		
		div.innerHTML = m;

		ById('btMarketMinGold').addEventListener ('change', function(e) {
			if (isNaN(e.target.value)) e.target.value = 0;
			Options.MarketOptions.MinGold = e.target.value;
			saveOptions();
		}, false);
		
		for (var i = 1; i <= Cities.numCities; i++) {
			ById('btMarketAutoCity_'+i).addEventListener('click', function(e){
				var citynum = e.target['className'];
				Options.MarketOptions.Enabled[citynum] = e.target.checked;
				if (Options.MarketOptions.Enabled[citynum]) {
					t.timer = setTimeout(function () { t.doAutoLoop(Number(citynum));}, 0);
				}	
				saveOptions();
			}, false);
		}
		
		ById('btMarketToggle').addEventListener ('change', function() {
			Options.MarketOptions.Toggle = this.checked;
			saveOptions();
        }, false);
		
		ById('btAutoMarketState').addEventListener('click', function(){
			t.toggleAutoMarketState(this);
		}, false);
		
		ToggleOption('MarketOptions','pbmarketchkr1','r1Enabled');
		ToggleOption('MarketOptions','pbmarketchkr2','r2Enabled');
		ToggleOption('MarketOptions','pbmarketchkr3','r3Enabled');
		ToggleOption('MarketOptions','pbmarketchkr4','r4Enabled');
		ChangeOption('MarketOptions','pbmarketr1','r1');
		ChangeOption('MarketOptions','pbmarketr2','r2');
		ChangeOption('MarketOptions','pbmarketr3','r3');
		ChangeOption('MarketOptions','pbmarketr4','r4');
		
		// start automarket loop timer to start in 15 seconds...
		
		if (Options.MarketOptions.Running) {
			t.timer = setTimeout(function () { t.doAutoLoop(1);}, (15 * 1000));
		}	
	},
	
	toggleAutoMarketState: function(obj){
		var t = Tabs.Market;
		obj = ById('btAutoMarketState');
		if (Options.MarketOptions.Running == true) {
			Options.MarketOptions.Running = false;
			obj.value = translate("AutoMarket = OFF");
		}
		else {
			Options.MarketOptions.Running = true;
			obj.value = translate("AutoMarket = ON");
			t.timer = setTimeout(function () { t.doAutoLoop(1);}, 0);
		}
		saveOptions();
		SetToggleButtonState('Market',Options.MarketOptions.Running,'Market');
		t.PaintOverview();
	},

	hide: function (){ },
	
	show: function (init) { 
		var t = Tabs.Market;

		t.PaintOverview();
	},

	EverySecond : function () {
		var t = Tabs.Market;

		t.LoopCounter = t.LoopCounter + 1;

		if (t.LoopCounter%2==0) { // refresh overview display every 2 seconds
			if (tabManager.currentTab.name == 'Market' && Options.btWinIsOpen){ t.PaintOverview(); }	
		}	
	},

	PaintOverview : function () {
		var t = Tabs.Market;

		t.totgold=0;

		for (var i = 0; i < Cities.numCities; i++) {
			citynum = i+1;
			cityId = Cities.cities[i].id;
			var citygold = parseIntNan(Seed.citystats["city" + cityId]['gold'][0]);
			t.totgold = t.totgold+citygold;
			var span = '<span>';
			if (citygold < Options.MarketOptions.MinGold) { span = '<span class=boldRed>'; }
			ById("btMarketGoldCity_"+citynum).innerHTML = span+addCommas(citygold)+'</span>';
			
			var blvl = parseInt(getUniqueCityBuilding(cityId, 10).maxLevel);
			var str = '';
			if (blvl==0) { str = '<SPAN class=boldRed><B>'+uW.g_js_strings.commonstr.none+'!</b></span>'; }
			else { str = uW.g_js_strings.commonstr.level+'&nbsp;' + blvl; } 
			ById('btMarketLevelCity_'+citynum).innerHTML = str;

			// display number of active trades
			
			var Buying = t.getTradeCount(cityId);
			if (Buying>0) {
				if (Buying>=blvl) { ById('btMarketStatusCity_'+citynum).innerHTML = '<span class=boldRed>'+translate('Buying')+'&nbsp;'+t.getTradeCount(cityId) + '/' + blvl+'</span>'; }
				else { ById('btMarketStatusCity_'+citynum).innerHTML = '<span class=boldGreen>'+translate('Buying')+'&nbsp;'+t.getTradeCount(cityId) + '/' + blvl+'</span>'; }
			}
			else { ById('btMarketStatusCity_'+citynum).innerHTML = translate('Buying')+'&nbsp;'+t.getTradeCount(cityId) + '/' + blvl; }
		}
		ById('btTotMarketGold').innerHTML = addCommas(t.totgold);
	},

	getTradeCount : function (cityId) {
		var t = Tabs.Market;
		var marketcount = 0;
		var now = unixTime();
		var q1 = Seed.queue_mkt["city"+cityId];
		if (q1 && matTypeof(q1) == 'object') {
			for (var j in q1) {
				if (q1[j][0].deliveryStatus==1 && q1[j][0].eventUnixTime > now) marketcount++
			}
		}
		return marketcount;
	},
	
	doAutoLoop : function (idx) {
		var t = Tabs.Market;
		clearTimeout(t.timer);
		if (!Options.MarketOptions.Running) return;

		var cityId = Cities.cities[idx-1].id;
		if (idx==1) { t.loopaction = false; } 
		t.autodelay = t.intervalSecs; // ALWAYS delay these loops!
		
		// load market details for next city
		
		var freeslot = parseInt(getUniqueCityBuilding(cityId, 10).maxLevel) - t.getTradeCount(cityId);
		if (freeslot>0) {
			if (parseInt(Seed.citystats["city" + cityId].gold[0]) >= parseIntNan(Options.MarketOptions.MinGold)) {
				t.readMarket(cityId,Cities.byID[cityId].provId);
			}	
		}
		
		if (idx == Cities.numCities) {
			if (!t.loopaction) { t.autodelay = t.intervalSecs; } // if no action this loop, apply delay anyway...
			t.timer = setTimeout(function () { t.doAutoLoop(1); }, (t.autodelay * 1000));
		}	
		else {
			t.timer = setTimeout(function () { t.doAutoLoop(idx+1); }, (t.autodelay * 1000)); 
		}	
	},

	readMarket : function (cityId, pid, notify) {
		var t = Tabs.Market;
		var citynum = Cities.byID[cityId].idx+1;
		jQuery('#btMarketCity_'+citynum).css('color', 'green');
		
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.pid = pid;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getMarketInfo.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function(rslt) {
				if (rslt.ok) {
					var sold = false;
					for (var i = 1; i <= 4; i++) {
						var Selling = rslt.data[i][2];
						if (Selling) {
							for (var j in Selling) {
								var price = parseFloat(j.split("mg")[0]/1000);
								var limit = parseFloat(Options.MarketOptions['r'+i]);
								if (Options.MarketOptions['r'+i+'Enabled'] && price <= limit) {
									// buy!
									t.BuyMarket(cityId,pid,i,Selling[j],price);
									sold = true;
									break; // only one transaction per loop!
								}	
							}	
						}	
						if (sold) break; // only one transaction per loop!
					}
				}
				jQuery('#btMarketCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
			},
			onFailure: function () {
				actionLog(Cities.byID[cityId].name+': Read Market failed (AJAX Error)','MARKET');
				jQuery('#btMarketCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
			},
  		},true);
	},
	
	BuyMarket : function (cityId,pid,res,amount,price) {
		var t = Tabs.Market;
		// calculate gross price by including 0.5% tax..
		var GrossPrice = price * 1.005;
		var citynum = Cities.byID[cityId].idx+1;
		var citygold = parseInt(Seed.citystats["city" + cityId].gold[0]);
		var availgold = citygold - parseIntNan(Options.MarketOptions.MinGold);
		var TotalPrice = amount*1000*GrossPrice;
		if (TotalPrice>availgold) {
			amount = Math.floor((availgold/(GrossPrice*1000))/1.005);
			TotalPrice = availgold;
		}
		jQuery('#btMarketCity_'+citynum).css('color', 'red');
		
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.cid = cityId;
		params.quantk = amount;
		params.price = price;
		params.transac = 1;
		params.rtype = res;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/trade.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function(rslt) {
				if (rslt.ok) {
					Seed.citystats["city" + cityId].gold[0] = citygold - TotalPrice;
					var deliveries = uWCloneInto(rslt.deliveries);
					if (deliveries) {
						Seed.queue_mkt["city" + cityId] = deliveries;
					}
					actionLog(Cities.byID[cityId].name+': Bought '+amount+'000 '+uW.resourceinfo[res]+' at '+price,'MARKET');
				}
				else {
					actionLog(Cities.byID[cityId].name+': Market trade error ('+rslt.error_code+')','MARKET');
				}
				jQuery('#btMarketCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
			},
			onFailure: function () {
				actionLog(Cities.byID[cityId].name+': Market trade failed (AJAX Error)','MARKET');
				jQuery('#btMarketCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
			},
  		},true);
	},
}
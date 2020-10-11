/*************** Defend Tab **********/
// @tabversion 2.0

Tabs.Defend = {
	tabOrder: 8000,
	tabColor : 'gray',
	tabLabel: 'Defend',
	myDiv: null,
	ModelCity: null,
	ModelCityId : 0,
	LoopCounter : 0,
	InitPresetNumber : 0,
	DefState : false,
	
	Options: {
		DefendRsrv: {},
		AllTroops: true,
	},	
	
	init: function (div) {
		var t = Tabs.Defend;
		t.myDiv = div;

		uWExportFunction ('DAADelPreset', Tabs.Defend.DelPreset);
		uWExportFunction ('DAASavePreset', Tabs.Defend.SavePreset);
		uWExportFunction ('DAASelectPreset', Tabs.Defend.SelectPreset);
		
		if (!Options.DefendOptions) {
			Options.DefendOptions = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.DefendOptions.hasOwnProperty(y)) {
					Options.DefendOptions[y] = t.Options[y];
				}	
			}
		}

		// conversion
		if (Options.DefendOptions.DefendFav) {
			for (var y in Options.DashboardOptions.DefPresets) {}
			var NextPresetNumber = parseIntNan(y) + 1;
			for (var y in Options.DefendOptions.DefendFav) {
				Options.DashboardOptions.DefPresets[NextPresetNumber]={};
				Options.DashboardOptions.DefPresets[NextPresetNumber][0] = Options.DefendOptions.DefendFav[y][0];
				for (var yy in Options.DefendOptions.DefendFav[y]) {
					if (yy!=0 && Options.DefendOptions.DefendFav[y][yy]!=0) {
						Options.DashboardOptions.DefPresets[NextPresetNumber][yy] = Options.DefendOptions.DefendFav[y][yy];
					}
				}
				NextPresetNumber++;
			}
			delete Options.DefendOptions.DefendFav;
			saveOptions();
		}
		
		m = '<DIV class=divHeader align=center><b>'+tx('ASSIGN DEFENDERS')+'</b></div>';
		
		if (!SelectiveDefending) {
			m += '<div class=boldRed align=center><br>'+tx('This domain does not allow selective defending')+'!</div>';
		}
		else {
			m += '<TABLE width=100% class=xtab border=0><tr><td>'+uW.g_js_strings.commonstr.city+':&nbsp;<b><span id=DAADefendCity></span></td><td align=right><a id=DAACityStatus class="inlineButton btButton green20"><span style="width:150px"><center>'+tx('Troops are Hiding!')+'</center></span></a></td></tr>';
			m += '<tr><td colspan=2 align=center><input type=button id=DAASetTroops value="'+tx('Set Defensive Troops')+'"></td></tr></table>';

			m += '<div id=DAAMessages align=center>&nbsp;</div></div>';
			m += '<div align="center" class=divHeader>'+tx('DEFENSIVE PRESETS')+'</div>';

			m +='<div align=center><table class=xtab width=700px><tr><td><SELECT class="btSelector" style="width:190px;" id="DAAPresetSel" onchange="DAASelectPreset(this);"></select>&nbsp;<a id="DAADeletePreset" class="inlineButton btButton red14 disabled" onclick="DAADelPreset()"><span>'+uW.g_js_strings.commonstr.deletetx+'</span></a></td><td align=right>';
			m +=tx('New Name')+':&nbsp;<INPUT class=btInput id=DAAPresetName type=text style="width:190px;" maxlength=20 value=""\>&nbsp;<a id="DAASavePreset" class="inlineButton btButton red14" onclick="DAASavePreset()"><span>'+tx('Save')+'</span></a></td></tr></table>';

			m += '<div align="center" class=divHeader>'+tx('TROOPS')+'</div>';
			m += '<div id=DAAStatSource align=center style="max-height:700px;height:700px;overflow-y:auto"></div><br>';
		}

		div.innerHTML = m;

		if (SelectiveDefending) {
			t.ModelCity = new CdispCityPicker('DAACity', ById('DAADefendCity'), true, t.clickCitySelect, null);
		
			DefButton = ById('DAACityStatus');
			t.addListener(DefButton,uW.currentcityid);

			t.LoadPresets();

			ById('DAASetTroops').addEventListener('click', function () {
				t.SetDefendingTroops();
			}, false);
		}
	},
	
	show: function (init) {
		var t = Tabs.Defend;
		if (!SelectiveDefending) return;
		
		if (init) {
			t.ModelCity.selectBut(Cities.byID[InitialCityId].idx);
		}
		else {
			t.ModelCity.selectBut(Cities.byID[uW.currentcityid].idx);
		}
		t.DisplayDefenceMode(t.ModelCityId);
		t.RefreshTroops();
	},

	EverySecond : function () {
		var t = Tabs.Defend;

		if (tabManager.currentTab.name == 'Defend' && Options.btWinIsOpen && SelectiveDefending){
	
			t.LoopCounter = t.LoopCounter + 1;

			if (t.LoopCounter >= 3) { // refresh display every 3 seconds
				t.LoopCounter = 0;
				if (t.ModelCityId) {
					t.DisplayDefenceMode(t.ModelCityId);
					t.RefreshTroops();
				}
			}
		}
	},
	
	clickCitySelect: function (city) {
		var t = Tabs.Defend;
		t.ModelCityId = city.id;

		t.DisplayDefenceMode(t.ModelCityId);
		t.LoadPresets();
		
		var m = '';
		m += '<table cellspacing=0 class=xtab><TR><TH class=xtabHD colspan=2>'+uW.g_js_strings.openCastle.trooptype+'</th><TH width=100 class=xtabHD align=right>'+tx('Total')+'</th><TH width=100 class=xtabHD align=right>'+tx('Sanctuary')+'</th><TH width=100 class=xtabHD align=right>'+tx('Defending')+'</th><TH class=xtabHD align=right>'+tx('Hold in Reserve')+'</th><TH class=xtabHD align=right>'+tx('Set to Defend')+'</th><TH class=xtabHD>&nbsp;</th><TR>';
		m += '<tr><td colspan=2><input type=checkbox id=DAAAllTroops '+(Options.DefendOptions.AllTroops?'CHECKED':'')+' /><b>'+tx("All Troops")+'</b></td><td colspan=3>&nbsp;</td><td align=center><a class=xlink id=DAAResetRsrvTroops>'+tx('Reset Reserves')+'</a></td><td align=center><a class=xlink id=DAAResetDefTroops>'+tx('Reset Defenders')+'</a></td><td>&nbsp;</td></tr>';
		var r = 0;
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			if (++r % 2) { rowClass = 'evenRow'; }
			else { rowClass = 'oddRow'; }

			m += '<tr id="DAATroopRow'+i+'" class="'+rowClass+'">';
			m += '<td><img title="'+uW.unitcost['unt'+i][0]+'" height=20 src='+IMGURL+'units/unit_'+i+'_30.jpg></td><td>'+uW.unitcost['unt'+i][0]+'</td>';
			m += '<td align=right><div class="totalCell xtabBorder" id="DAAdestunit'+i+'" align=right>&nbsp;</div></td>';
			m += '<td align=right><div class="xtabBorder" id="DAAunit'+i+'" align=right>&nbsp;</div></td>';
			m += '<td align=right><div class="xtabBorder" id="DAAdefunit'+i+'" align=right style="font-weight:bold;">&nbsp;</div></td>';
			m += '<td align=right><input class=btInput style="width:80px;" align=right id="DAArsrvunit'+i+'" type=text size=10 value="' + parseIntNan(Options.DefendOptions.DefendRsrv[i]) + '"></td>';
			m += '<td align=right><input class=btInput style="width:80px;" align=right id="DAAnbunit'+i+'" type=text size=10 value="' + parseInt(Seed.defunits['city'+t.ModelCityId]['unt'+i]) + '" ></td>';
			m += '<td><input class=btInput style="height:20px;font-size:9px;" id="DAApdestunit'+i+'" type=button value="'+uW.g_js_strings.commonstr.max+'"></td>';
			m += '</tr>';
		}
		m += '</table>';
		ById("DAAStatSource").innerHTML = m;
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			ById("DAApdestunit"+i).addEventListener('click', function () {
				var u = this.id.replace("DAApdestunit", "");
				var settroops = this.id.replace("DAApdest", "DAAnb");
				var rsrvtroops = this.id.replace("DAApdest", "DAArsrv");
				ById(settroops).value = parseInt(Seed.units['city'+t.ModelCityId]['unt'+u]) + parseInt(Seed.defunits['city'+t.ModelCityId]['unt'+u]) - parseIntNan(ById(rsrvtroops).value);
				if (parseIntNan(ById(settroops).value) < 0) ById(settroops).value = 0;
			}, false);
			
			ById("DAArsrvunit"+i).addEventListener('change', function () {
				if (isNaN(this.value)) this.value = 0;
				var u = this.id.replace("DAArsrvunit", "");
				Options.DefendOptions.DefendRsrv[u] = this.value;
			}, false);
		}
		
		ById("DAAAllTroops").addEventListener('click', function() {
			Options.DefendOptions.AllTroops = this.checked;
			saveOptions();
			t.RefreshTroops();
		}, false);

		ById("DAAResetDefTroops").addEventListener('click', function () {
			for (var ui in uW.cm.UNIT_TYPES) ById("DAAnbunit" + uW.cm.UNIT_TYPES[ui]).value = 0;
		}, false);

		ById("DAAResetRsrvTroops").addEventListener('click', function () {
			for (var ui in uW.cm.UNIT_TYPES) ById("DAArsrvunit" + uW.cm.UNIT_TYPES[ui]).value = 0;
		}, false);
		
		t.RefreshTroops();
	},

	RefreshTroops: function () {
		var t = Tabs.Defend;
		var r = 0;
		
		var spanclass = '';
		if (t.DefState) { spanclass = 'boldRed'; }
		
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			ById('DAAdestunit'+i).innerHTML = addCommas(parseInt(Seed.units['city' + t.ModelCityId]['unt'+i]) + parseInt(Seed.defunits['city' + t.ModelCityId]['unt'+i]));
			ById('DAAdefunit'+i).innerHTML = '<span class="'+spanclass+'">'+addCommas(parseInt(Seed.defunits['city' + t.ModelCityId]['unt'+i]))+'</span>';
			ById('DAAunit'+i).innerHTML = addCommas(parseInt(Seed.units['city' + t.ModelCityId]['unt'+i]));
			
			var ShowLine = ((parseIntNan(Seed.units['city' + t.ModelCityId]['unt'+i])!=0) || (parseIntNan(Seed.defunits['city' + t.ModelCityId]['unt'+i])!=0) || (parseIntNan(ById('DAAnbunit'+i).value)!=0) || (parseIntNan(ById('DAArsrvunit'+i).value)!=0));
			if (ShowLine || Options.DefendOptions.AllTroops) {
				if (++r % 2) { rowClass = 'evenRow'; }
				else { rowClass = 'oddRow'; }
			}
			else { rowClass = 'divHide'; }
			ById('DAATroopRow'+i).className = rowClass;
			
			if (t.DefState) { jQuery('#DAAdefunit'+i).addClass('boldRed'); }
			else { jQuery('#DAAdefunit'+i).removeClass('boldRed'); }
		}
	},
	
	ToggleDefenceMode : function (cityId) {
		var t = Tabs.Defend;
		var state = 1;
		if (Seed.citystats["city" + cityId].gate != 0)
			state = 0;

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.cid = cityId;
		params.state = state;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/gate.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					Seed.citystats["city" + cityId].gate = state;
					t.DisplayDefenceMode(cityId);
					t.RefreshTroops();
				}
			},
		});
	},
	DisplayDefenceMode : function (cityId) {
		var t = Tabs.Defend;

		t.DefState = parseInt(Seed.citystats["city" + cityId].gate);
		if (t.DefState) DefButtonText = '<a id=DAACityStatus class="inlineButton btButton red20"><span style="width:150px"><center>'+tx('Troops are Defending!')+'</center></span></a>';
		else DefButtonText = '<a id=DAACityStatus class="inlineButton btButton green20"><span style="width:150px"><center>'+tx('Troops are Hiding!')+'</center></span></a>';
		var DefButton = ById('DAACityStatus');
		DefButton.outerHTML = DefButtonText;
		DefButton = ById('DAACityStatus');	// do again because of outerHTML
		t.addListener(DefButton,cityId);
	},
	
	addListener : function (but, i){
		var t = Tabs.Defend;
		if (!SelectiveDefending) return;
		but.addEventListener ('click', function (){t.ToggleDefenceMode(i)}, false);
	},
	
	LoadPresets : function () {
		var t = Tabs.Defend;
		ById('DAAPresetSel').options.length = 0;
		var o = document.createElement("option");
		o.text = "-- "+tx('Select Preset')+" --"
		o.value = 0;
		ById("DAAPresetSel").options.add(o);
		for (var y in Options.DashboardOptions.DefPresets) {
			var o = document.createElement("option");
			o.text = Options.DashboardOptions.DefPresets[y][0];
			o.value = y;
			ById("DAAPresetSel").options.add(o);
		}
		Dashboard.NextPresetNumber = parseIntNan(y) + 1;
		if (t.InitPresetNumber != 0) {
			ById('DAAPresetSel').value = t.InitPresetNumber;
			t.SelectPreset(ById('DAAPresetSel'));
			t.InitPresetNumber = 0;
		}
	},

	SelectPreset : function (sel) {
		var t = Tabs.Defend;
		var PN = sel.value;
		if ((PN == 0) || (PN == "")) {
			jQuery('#DAADeletePreset').addClass("disabled");
			return false
		} else {
			jQuery('#DAADeletePreset').removeClass("disabled");
		}

		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			if (Options.DashboardOptions.DefPresets[PN][i]) { ById('DAAnbunit'+i).value = Options.DashboardOptions.DefPresets[PN][i]; }
			else { ById('DAAnbunit'+i).value = "0"; }
		}
		t.RefreshTroops();
	},

	SavePreset : function () {
		var t = Tabs.Defend;
		ById('DAAMessages').innerHTML = "&nbsp;";
		var PN = ById('DAAPresetSel');
		var NewName = ById('DAAPresetName').value.trim();
		var OldName = "";
		if (!PN.value || (PN.value == 0)) {
			if (NewName == "") {
				ById('DAAPresetName').innerHTML = "<FONT COLOR=#800>"+tx('Please enter a name for the defensive preset')+"</font>";
				return false;
			}
			SavePN = Dashboard.NextPresetNumber;
		}
		else {
			if (NewName != "") {
				SavePN = Dashboard.NextPresetNumber;
			}
			else {
				SavePN = PN.value;
				OldName = Options.DashboardOptions.DefPresets[SavePN][0];
			}
		}

		Options.DashboardOptions.DefPresets[SavePN]={};
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			TroopVal = ById('DAAnbunit'+i).value;
			if (!isNaN(TroopVal) && (TroopVal != "")) {
				Options.DashboardOptions.DefPresets[SavePN][i] = TroopVal;
			}
		}

		Options.DashboardOptions.DefPresets[SavePN][0] = OldName;
		if (NewName != "") {
			Options.DashboardOptions.DefPresets[SavePN][0] = NewName;
		}
		saveOptions();
		t.InitPresetNumber = SavePN;
		t.LoadPresets();
		ById('DAAPresetName').value = "";
		ById('DAAMessages').innerHTML = tx("Defensive Preset Saved");
	},

	DelPreset : function () {
		var t = Tabs.Defend;
		var PN = ById('DAAPresetSel');
		if (!PN.value || (PN.value == 0)) return;

		Options.DashboardOptions.DefPresets[PN.value]={};
		delete Options.DashboardOptions.DefPresets[PN.value];
		saveOptions();
		t.LoadPresets();
		ById('DAAMessages').innerHTML = tx("Defensive Preset Deleted");
	},
	
	SetDefendingTroops: function () {
		var t = Tabs.Defend;
		var EnoughTroops = true;
		var cityId = t.ModelCityId;
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			if (parseIntNan(ById("DAAnbunit" + i).value) > (parseIntNan(Seed.units['city' + cityId]['unt'+i]) + parseIntNan(Seed.defunits['city' + cityId]['unt'+i]))) {
				ById("DAAnbunit" + i).style.backgroundColor = "red";
				ById("DAAnbunit" + i).style.color = "white";
				EnoughTroops = false;
			}
			else {
				ById("DAAnbunit" + i).style.backgroundColor = "";
				ById("DAAnbunit" + i).style.color = "";
			}
		}
		if (!EnoughTroops) {
			ById('DAAMessages').innerHTML = '<span style="color:#f00">'+tx("Insufficient troops in city")+'</span>';
			return false;
		}
		
		jQuery('#DAASetTroops').addClass("disabled");
		ById('DAAMessages').innerHTML = tx('Sending Request')+'...';

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.cid = cityId;
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			params["u"+i] = 0;
		}
		for (var ui in uW.cm.UNIT_TYPES) {
			i = uW.cm.UNIT_TYPES[ui];
			var TroopNum = parseIntNan(ById("DAAnbunit"+i).value);
			if (TroopNum > 0) params["u"+i] = TroopNum;
		}
		
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/cityDefenseSet.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			loading: true,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					var unitsarr = [];
					for (var j in uW.unitcost)
						unitsarr.push(0);
					for (var i = 0; i <= unitsarr.length; i++)
						if (params["u"+i])
							unitsarr[i] = params["u"+i];
					if (rslt.def != null) {
						var unitlist = uW.seed.defunits["city" + cityId];
						jQuery.each (rslt.def, function (key, val) {
							var key1 = key.replace ("u", "unt");
							unitlist[key1] = val
						})
					}
					if (rslt.res != null) {
						var unitlist = uW.seed.units["city" + cityId];
						jQuery.each (rslt.res, function(key, val) {
							var key1 = key.replace("u", "unt");
							unitlist[key1] = val
						})
					}
					ById('DAAMessages').innerHTML = '&nbsp;';
					t.RefreshTroops();
				}
				else { // error handling
					if (rslt.msg) { ById('DAAMessages').innerHTML = '<span style="color:#f00">'+rslt.msg+'</span>'; }
					else { ById('DAAMessages').innerHTML = '<span style="color:#f00">'+tx('Error setting defending troops')+'</span>'; }
				}
				jQuery('#DAASetTroops').removeClass("disabled");
			},
			onFailure: function () { // error handling
				ById('DAAMessages').innerHTML = '<span style="color:#f00">'+tx('AJAX error')+'</span>';
				jQuery('#DAASetTroops').removeClass("disabled");
			}
		},true); // noretry
	},
	
}

/** Gift Tab **/
// @tabversion 2.0
Tabs.Gift = {
	tabLabel: 'Gifts',
	tabOrder: 2110,
	tabColor : 'gray',
	myDiv: null,
	Available: new Array(),
	PeopleLoaded: false,
	LoopCounter: 0,
	freeSlot:0,
	dat:[],
	HardLimit:22,
	Options: {
		people: {}, // uid {[(0) gift id, (1) sent, (2) display name, (3) received, (4) avatar, (5) fbuid, (6) last gift sent, (7) last gift received, (8) name]} ...
		giftitems: [],
		DefaultGift: 0,
		GiftPriority: 0,
		AutoGift: false,
		ScanGift: false,
		LastGifted : 0,
		GiftsLastUpdated : 0,
		NextGiftType : 0,
		sortColNum: 7,
		sortDir: 1,
	},

// t.dat for sorting
// 0 - uid
// 1 - name
// 2 - sent
// 3 - lastsent
// 4 - received
// 5 - lastreceived
// 6 - giftid
// 7 - status

	init: function (div) {
		var t = Tabs.Gift;
		t.myDiv = div;

		if (!Options.GiftOptions) {
			Options.GiftOptions = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.GiftOptions.hasOwnProperty(y)) {
					Options.GiftOptions[y] = t.Options[y];
				}
			}
		}

		uWExportFunction('ptgiftClickSort', Tabs.Gift.giftClickSort);
		uWExportFunction('ptgiftDelete', Tabs.Gift.DeletePerson);

		var now = unixTime();
//		if (Options.GiftOptions.GiftsLastUpdated + (3600*24) < now) { // only check gifts once a day (they never change!!)
			t.PopulateGifts();
//		}

		t.PopulatePeople(); // always set up gift database??

		if (Options.GiftOptions.ScanGift) {
			setTimeout(function() { t.scangifts(4);},12000); // scan first 4 pages for gifts after initialisation
		}
	},

	giftClickSort : function (e) {
		var t = Tabs.Gift;
		var newColNum = e.id.substr(7);
		ById('GiftCol' + Options.GiftOptions.sortColNum).className = 'buttonv2 std blue';
		e.className = 'buttonv2 std green';
		if (newColNum == Options.GiftOptions.sortColNum) { Options.GiftOptions.sortDir *= -1; }
		else { Options.GiftOptions.sortColNum = newColNum; }
		saveOptions();
		t.PaintPeople();
	},

	PopulatePeople : function (notify) {
		var t = Tabs.Gift;
		t.Available = new Array();

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.ctrl = 'allianceGifting\\AllianceGiftingServiceAjax';
		params.action = 'getRecipients';
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch53.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			loading: true,
			onSuccess: function (rslt) {
				if(rslt.ok) {
					t.PeopleLoaded = true;
					t.freeSlot = rslt.freeSlot;
					for(i = 0;i<rslt.recipients.length;i++) {
						t.Available.push(rslt.recipients[i].userId);
						var sex = uW.g_js_strings.commonstr.lord;
						if (rslt.recipients[i].playerSex=="F") { sex = uW.g_js_strings.commonstr.lady; }
						var name = sex+' '+rslt.recipients[i].displayName;
						if(Options.GiftOptions.people[Number(rslt.recipients[i].userId)]) {
							Options.GiftOptions.people[Number(rslt.recipients[i].userId)][2] = name; // update display name
							Options.GiftOptions.people[Number(rslt.recipients[i].userId)][4] = rslt.recipients[i].avatarId; // update avatar
							Options.GiftOptions.people[Number(rslt.recipients[i].userId)][8] = rslt.recipients[i].displayName; // update name
							Options.GiftOptions.people[Number(rslt.recipients[i].userId)][9] = rslt.recipients[i].playerSex.toLowerCase();
						}else{
							Options.GiftOptions.people[rslt.recipients[i].userId] = [Options.GiftOptions.DefaultGift,0,name,0,rslt.recipients[i].avatarId,rslt.recipients[i].fbuid,0,0,rslt.recipients[i].displayName,rslt.recipients[i].playerSex.toLowerCase()];
						}
					}
					if (notify) notify();
				}
			},
		},true);
	},

	PopulateGifts : function (){
		var t = Tabs.Gift;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.ctrl = "GiftItems";
		params.action = "getGiftItems";
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					Options.GiftOptions.GiftsLastUpdated = unixTime();
					Options.GiftOptions.giftitems = rslt.giftItems;
					saveOptions();
				};
			},
		},true);
	},

	ClearGiftList : function (){
		var t = Tabs.Gift;
		Options.GiftOptions.people={};
		saveOptions();
		t.PopulatePeople(t.PaintPeople);
	},

	DeletePerson : function (uid) {
		var t = Tabs.Gift;
		delete Options.GiftOptions.people[""+uid];
		saveOptions();
		t.PopulatePeople(t.PaintPeople);
	},

	sendgifts : function () {
		var t = Tabs.Gift;

		if (!t.PeopleLoaded) {
			t.PopulatePeople(t.sendgifts);
			return;
		}

		var g = Options.GiftOptions.NextGiftType;
		if (g >= Options.GiftOptions.giftitems.length) { g = 0; }
		var FirstGiftType = -1;
		do { // loop at least once
			var ItemId = Number(Options.GiftOptions.giftitems[g].itemId);
			var j = new Array();
			for (var i in Options.GiftOptions.people) {
				if (Number(Options.GiftOptions.people[i][0]) == ItemId) {
					if (t.Available.indexOf(i) != -1) {
						j.push(i);
					}
				}
			}
			if (j.length) {
				if (FirstGiftType < 0) { FirstGiftType = g; }
				if(j.length > 1){
					var n = j.length;
					if (Options.GiftOptions.GiftPriority==0) { // random (Fisher-Yates Shuffle)
						var tempArr = shuffle(j);
					};
					if (Options.GiftOptions.GiftPriority==1) { // even distribution - sort by sent (1)
						var tempArr = j.sort(function(a,b){ return parseIntNan(Options.GiftOptions.people[a][1])-parseIntNan(Options.GiftOptions.people[b][1])});
					};
					if (Options.GiftOptions.GiftPriority==2) { // most received - sort by received reversed (3)
						var tempArr = j.sort(function(a,b){ return parseIntNan(Options.GiftOptions.people[b][3])-parseIntNan(Options.GiftOptions.people[a][3])});
					};
					if (Options.GiftOptions.GiftPriority==3) { // last received - sort by lastreceived reversed (7)
						var tempArr = j.sort(function(a,b){ return parseIntNan(Options.GiftOptions.people[b][7])-parseIntNan(Options.GiftOptions.people[a][7])});
					};
					if (tempArr.length > t.HardLimit) { j=tempArr.slice(0,t.HardLimit); }
					else { j=tempArr; }
				}
				t.sendgift(ItemId,j);
			};
			g++;
			if (g >= Options.GiftOptions.giftitems.length) { g = 0; }
		}
		while (g != Options.GiftOptions.NextGiftType);
		// next time, start loop at item after the first item found this time, to ensure even distribution
		g = FirstGiftType+1;
		if (g >= Options.GiftOptions.giftitems.length) { g = 0; }
		Options.GiftOptions.NextGiftType = g;
		saveOptions();
	},

	sendgift : function (giftId, recipients) {
		var t = Tabs.Gift;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.ctrl = 'allianceGifting\\AllianceGiftingServiceAjax';
		params.action = 'sendGift';
		params.recipients = String(recipients).replace(/,/g,"|");
		params.itemId = giftId;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch53.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			loading: true,
			onSuccess: function (rslt) {
				if(rslt.ok) {
					for(i = 0;i<rslt.succeedRecipients.length;i++) {
						var z = rslt.succeedRecipients[i];
						Options.GiftOptions.people[Number(z)][1] += 1;
						Options.GiftOptions.people[Number(z)][6] = unixTime();
					};
					actionLog(uW.itemlist["i"+giftId].name+' sent to '+rslt.succeedRecipients.length+' recipients','GIFTS');
					saveOptions();
				}
				else {
					if (rslt.error_code) {
						actionLog('Error sending gifts (Error Code '+rslt.error_code+')','GIFTS');
					}
					else {
						actionLog('Error sending gifts','GIFTS');
					}
				};
				t.PopulatePeople(t.PaintPeople);
			},
		},true);
	},

	scangifts : function(page) {
		var t = Tabs.Gift;
		page = Number(page);
		if(!Options.GiftOptions.ScanGift) {return;}
		if(page <= 0) {return;}
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.requestType = "GET_MESSAGE_HEADERS_FOR_USER_INBOX";
		params.boxType="inbox";
		params.pageNo=page;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getEmail.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					for (var i in rslt.message) {
						if (rslt.message[i].subject) {
							var GiftMessage = false;
							for (var j in GiftText) {
								if (rslt.message[i].subject.indexOf(GiftText[j]) != -1) {
									GiftMessage = true;
									break;
								}
							}
							if(rslt.message[i].fromUserId == "0" && GiftMessage){
								t.foundgift(i);
							}
						}
					}
					setTimeout(function() {	t.scangifts(parseInt(page-1))},5000);
				} else return;
			},
		},true);
	},

	foundgift : function (id) {
		var t = Tabs.Gift;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.messageId=id;
		params.requestType = "GET_MESSAGE_FOR_ID";
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getEmail.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					var name = rslt.messageBody.split(" ")[1];
					for(x in Options.GiftOptions.people) {
						if(Options.GiftOptions.people[x][8] == name) {
							Options.GiftOptions.people[x][3] += 1;
							Options.GiftOptions.people[x][7] = unixTime();
							saveOptions();
							break;
						}
					}
					t.PaintPeople();
					t.deletemsgs(id);
				}
			},
		},true);
	},

	deletemsgs : function (msgid) {
		var t = Tabs.Gift;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.requestType="ACTION_ON_MESSAGES";
		params.selectedAction="delete";
		params.selectedMessageIds=msgid;
		params.boxType="inbox";
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getEmail.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {},
		},true);
	},

	PaintGiftStats : function() {
		var t = Tabs.Gift;
		var sentgifts = 0;
		for(h in Options.GiftOptions.people){
			sentgifts += parseIntNan(Options.GiftOptions.people[h][1]);
		};
		ById('giftnumber').innerHTML=sentgifts;
		ById('giftnumbertoday').innerHTML=t.freeSlot;
	},

	PaintPeople : function() {
		var t = Tabs.Gift;
		var peopletab = ById('GiftsTAB');
		if (!peopletab) return;

		function sortFunc(a, b) {
			if (typeof (a[Options.GiftOptions.sortColNum]) == 'number') {
				if (Options.GiftOptions.sortDir > 0)
					return a[Options.GiftOptions.sortColNum] - b[Options.GiftOptions.sortColNum];
				else
					return b[Options.GiftOptions.sortColNum] - a[Options.GiftOptions.sortColNum];
			} else if (typeof (a[Options.GiftOptions.sortColNum]) == 'boolean') {
				return 0;
			} else {
				if (Options.GiftOptions.sortDir > 0)
					return a[Options.GiftOptions.sortColNum].localeCompare(b[Options.GiftOptions.sortColNum]);
				else
					return b[Options.GiftOptions.sortColNum].localeCompare(a[Options.GiftOptions.sortColNum]);
			}
		}

		t.dat = [];

		var GiftsAvailable = (t.freeSlot != 0);
		var EmptyDatabase = true;

		for (var h in Options.GiftOptions.people) {
			if (Options.GiftOptions.people[h][5]) { // fbuid
				EmptyDatabase = false;
				var StatusText = '';
				if (t.Available.indexOf(h) == -1) {
					var sentdate = "";
					if (Options.GiftOptions.people[h][6] && Options.GiftOptions.people[h][6] != 0) {
						sentdate = formatDate(Options.GiftOptions.people[h][6]);
					}
					var StatusText = '<span style="color:#800;">'+tx('Player unavailable')+'</span>';
					if (sentdate==formatDate(unixTime())) {
						StatusText = '<span style="color:#080;">'+tx('Gift sent today')+'</span>';
					}
					else {
						if (!GiftsAvailable) {
							StatusText = '('+tx('No more gifts can be sent today')+')';
						}
					}
				}
				t.dat.push([h,(Options.GiftOptions.people[h][8]?Options.GiftOptions.people[h][8]:Options.GiftOptions.people[h][2]),Options.GiftOptions.people[h][1],Options.GiftOptions.people[h][6],Options.GiftOptions.people[h][3],Options.GiftOptions.people[h][7],Options.GiftOptions.people[h][0],StatusText]);
			}
		}

		if (!EmptyDatabase) {
			t.dat.sort(sortFunc);

			var m = '<center><table width=98% cellspacing=0 cellpadding=0 class=xtab>';
			m += '<TR><td width=25>&nbsp;</td><TD align=left nowrap><A id=GiftCol1 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.player+'&nbsp;</span></a></td>\
				<TD width=100 nowrap><A id=GiftCol2 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Sent')+'&nbsp;</span></a></td>\
				<TD width=70 align=right nowrap><A id=GiftCol3 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Last Sent')+'&nbsp;</span></a></td>\
				<TD width=100 nowrap><A id=GiftCol4 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Received')+'&nbsp;</span></a></td>\
				<TD width=70 align=right nowrap><A id=GiftCol5 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Last Received')+'&nbsp;</span></a></td>\
				<TD width=100 align=left nowrap><A id=GiftCol6 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Gift to Send')+'&nbsp;</span></a></td>\
				<TD width=200 align=left nowrap><A id=GiftCol7 onclick="ptgiftClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.status+'&nbsp;</span></a></td>\
				<TD width=25 nowrap><A class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Action')+'&nbsp;</span></a></td>\
				</tr>';

			var r = 0;

			for (var G in t.dat) {
				var h = t.dat[G][0]; // uid
				if (h) {
					var StatusText = t.dat[G][7];
					if (++r % 2) { rowClass = 'evenRow'; }
					else { rowClass = 'oddRow'; }

					m += t.FormatPerson(h,rowClass,StatusText);
				}
			}
			m += '</table></center>';
		}
		else {
			m = '<div align=center><br><br>'+tx('No gifting entries available. You may need to wait a day for the gift database to re-populate')+'...</div>';
		}
		peopletab.innerHTML = m;
		if (!EmptyDatabase) {
			ById('GiftCol' + Options.GiftOptions.sortColNum).className = 'buttonv2 std green';
		}

		var element_class = ById('GiftsTAB').getElementsByClassName('giftstosend');
		for (var c=0; c < element_class.length; c++) {
			if (element_class[c]) {
				element_class[c].addEventListener('change', function(e) {
					if (Options.GiftOptions.people[Number(e.target.id)]) {
						Options.GiftOptions.people[Number(e.target.id)][0] = Number(e.target.value);
						saveOptions();
					};
				} , false);
			}
		}

		t.PaintGiftStats();
	},

	FormatPerson : function (h,rowClass,StatusText) {
		var name = Options.GiftOptions.people[h][2];
		var fbuid = Options.GiftOptions.people[h][5];
		var sentdate = "";
		var receiveddate = "";
		if (Options.GiftOptions.people[h][6] && Options.GiftOptions.people[h][6] != 0) {
			sentdate = formatDate(Options.GiftOptions.people[h][6]);
		}
		if (Options.GiftOptions.people[h][7] && Options.GiftOptions.people[h][7] != 0) {
			receiveddate = formatDate(Options.GiftOptions.people[h][7]);
		}
		var avatar = '<A target="_blank" href="https://www.facebook.com/profile.php?id=' + fbuid + '">';
		if (Options.ChatOptions.chatIcons) { avatar += '<img width=25 style="vertical-align:middle;" src="https://graph.facebook.com/' + fbuid + '/picture">'; }
		else {
			var ava = uW.stimgUrl + "img/avatars/v2/25/" + (Options.GiftOptions.people[h][9]||"m") + Options.GiftOptions.people[h][4] + ".png";
			avatar += '<img width=25 style="vertical-align:middle;" src="'+ava+'">';
		}
		avatar += '</a>';
		var n = '';
		n += '<tr class="'+rowClass+'"><td width=25 style="padding:1px;">' + avatar + '</td><td>'+PlayerLink(h,name)+'</td>';
		n += '<td align=center>'+Options.GiftOptions.people[h][1]+'</td><td align=right>'+sentdate+'</td><td align=center>'+Options.GiftOptions.people[h][3]+'</td><td align=right>'+receiveddate+'</td>';
		n += '<td><select class="giftstosend" id="'+h+'" name="'+name+'"><option value="0">None</option>';
		for (var g=0;g < Options.GiftOptions.giftitems.length;g++) {
			if (Options.GiftOptions.people[Number(h)][0] == Number(Options.GiftOptions.giftitems[g].itemId))
				n += '<option value="'+Options.GiftOptions.giftitems[g].itemId+'" selected="selected">'+Options.GiftOptions.giftitems[g].name+'</option>';
			else
				n += '<option value="'+Options.GiftOptions.giftitems[g].itemId+'">'+Options.GiftOptions.giftitems[g].name+'</option>';
		}
		n += '</select></td>';
		n += '<td>'+StatusText+'</td>';
		n += '<td align=center>'+strButton8(tx('Del'),'onClick="ptgiftDelete('+h+')"')+'</td></tr>';
		return n;
	},

	show: function (){
		var t = Tabs.Gift;

		var m = '<DIV class=divHeader align=center>'+tx('GIFT ADMINISTRATION')+'</div>';
		m += '<table align=center width=98% class=xtab><tr><td width=20%>&nbsp;</td><td align=center><INPUT id=giftssend type=submit value="'+uW.g_js_strings.directory_changetab.sendgifts+'">&nbsp;<INPUT id=resetgiftlist type=submit value="'+tx('Reset Gift Database')+'"></td><td width=20% align=right>'+tx('Total Gifts Sent')+':&nbsp;<span id=giftnumber></span></td></tr>';
		m += '<tr><td colspan=2>&nbsp;</td><td align=right>'+tx('Gifts Remaining for Today')+':&nbsp;<span id=giftnumbertoday></span></td></tr></table>';
		m += '<DIV class=divHeader align=center>'+tx('GIFT OPTIONS')+'</DIV>';
		m += '<table align=center width=98% class=xtab><tr><td>&nbsp;</td><td width=100>'+tx('Default Gift to send')+':&nbsp;</td><td><select id="giftsdefault">';
		m += '<option value="0">'+uW.g_js_strings.commonstr.none+'</option>';
		for(g =0;g < Options.GiftOptions.giftitems.length;g++) {
			if (Options.GiftOptions.giftitems[g].itemId==Options.GiftOptions.DefaultGift) {
				m+='<option value="'+Options.GiftOptions.giftitems[g].itemId+'" selected="selected">'+Options.GiftOptions.giftitems[g].name+'</option>';
			}
			else {
				m+='<option value="'+Options.GiftOptions.giftitems[g].itemId+'">'+Options.GiftOptions.giftitems[g].name+'</option>';
			}
		};
		m += '</select>&nbsp;<INPUT class=btInput id=giftssetall type=submit value="'+tx('Set All')+'">&nbsp;<INPUT class=btInput id=giftssetnew type=submit value="'+tx('Set All Unassigned')+'"></td></tr>';
		m += '<tr><td>&nbsp;</td><td>'+tx('Gift Recipient Priority')+':&nbsp;</td><td>'+htmlSelector({0: tx('Random'), 1: tx('Even distribution'), 2: tx('Most gifts received'), 3: tx('Last received')}, Options.GiftOptions.GiftPriority, 'id=giftspriority')+'</td></tr>';
		m += '<tr><td><INPUT id=pbaugift type=checkbox '+ (Options.GiftOptions.AutoGift?' CHECKED':'') +'\></td><td colspan=2>'+tx('Enable Automatic Gifting')+'</td></tr>';
		m += '<tr><td><INPUT id=pbadgift type=checkbox '+ (Options.GiftOptions.ScanGift?' CHECKED':'') +'\></td><td colspan=2>'+tx('Delete incoming gift messages (and log entries in gift database)')+'</td></tr></table>';
		m += '<DIV class=divHeader align=center>'+tx('GIFT DATABASE')+'</DIV>';
		m += '<DIV style="max-width:'+GlobalOptions.btWinSize.x+'px;height:400px; max-height:400px; overflow-y:scroll" id=GiftsTAB><div align=center><br><br>'+tx('Loading Database')+'...</div></DIV><br>';

		t.myDiv.innerHTML = m;

		t.PopulatePeople(t.PaintPeople);

		ById('resetgiftlist').addEventListener('click', function(){ t.ClearGiftList(); } , false);
		ById('giftssend').addEventListener('click', function(){ t.sendgifts(); } , false);

		ChangeOption('GiftOptions','giftsdefault','DefaultGift');
		ChangeOption('GiftOptions','giftspriority','GiftPriority');

		ById('giftssetall').addEventListener('click', function() {
			var element_class = ById('GiftsTAB').getElementsByClassName('giftstosend');
			for (var c = 0; c < element_class.length; c++) {
				element_class[c].value = Options.GiftOptions.DefaultGift;
				Options.GiftOptions.people[Number(element_class[c].id)][0] = Number(Options.GiftOptions.DefaultGift);
			};
			saveOptions();
		}, false);

		ById('giftssetnew').addEventListener('click', function(){
			var element_class = ById('GiftsTAB').getElementsByClassName('giftstosend');
			for (var c = 0; c < element_class.length; c++) {
				if (element_class[c].value==0) {
					element_class[c].value = Options.GiftOptions.DefaultGift;
					Options.GiftOptions.people[Number(element_class[c].id)][0] = Number(Options.GiftOptions.DefaultGift);
				}
			};
			saveOptions();
		}, false);

		ById('pbadgift').addEventListener('change', function(){
			Options.GiftOptions.ScanGift = this.checked;
			saveOptions();
			if(Options.GiftOptions.ScanGift) { t.scangifts(4); }
		}, false);

		ById('pbaugift').addEventListener('change', function(){
			Options.GiftOptions.AutoGift = this.checked;
			Options.GiftOptions.LastGifted = 0; // always reset timer
			saveOptions();
		}, false);
	},

	EverySecond : function () {
		var t = Tabs.Gift;

		if (t.PeopleLoaded) {
			var now = unixTime();
			if (Options.GiftOptions.AutoGift && Options.GiftOptions.LastGifted + 3600 < now) { // hourly check for autogifting
				t.sendgifts();
				Options.GiftOptions.LastGifted = now;
				saveOptions();
			}
		}

		t.LoopCounter = t.LoopCounter + 1;

		if (t.LoopCounter >= 60) {
			t.LoopCounter = 0;
			// check for gifts on first page every 60 seconds..
			t.scangifts(1);
		}
	},
}

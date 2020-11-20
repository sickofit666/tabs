/*********************************** News TAB ***********************************/
Tabs.News = {
   tabOrder: 10098,
   tabColor : 'blue',
  tabDisabled : false,
  tabLabel : 'News',
  myDiv : null,

   init : function (div){
      var t = Tabs.News;
      t.myDiv = div;
   div.innerHTML = '<DIV class=pbStat><font color="#FFFFFF">Breaking News!</div><br>';
      GM_xmlhttpRequest({
         method: 'GET',
         url: http+'raw.githubusercontent.com/sickofit666/emoticons/main/BreakingNews.txt',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
         },
         onload: function (news) {
            if(news.status != 200) {
               div.innerHTML += '<center><div style="background-color:#808080; width:600px; height:200px; text-align:left; overflow-y:auto;"><b>Unable to fetch news <br>Error: '+news.status+'</b></div></center>';
               return;
            }
            var m = '<center>';
            m += '<div style="background-color:#000000; width:950px; height:200px; text-align:left; overflow-y:auto;">';
            m += '<div id=newsdate><font color="#FFFFFF"></div>'
            m += '<b>'+news.responseText.replace(/\n/g,"<br>")+'</b>';
            m += '</div></center><br>';
            div.innerHTML += m;
            var first = Number(news.responseHeaders.indexOf("Last-Modified"))+15;
            var last = news.responseHeaders.indexOf("\n",first);
            var lastmodified = news.responseHeaders.slice(first,last);
            if (Options.BreakingNews != lastmodified) {
               Options.BreakingNews=lastmodified;
               Options.BreakingNewsV = false;
               saveOptions();
            }
            if(Options.BreakingNewsV == false)
            setTimeout(t.notify,10000);
             document.getElementById('newsdate').innerHTML = '';
         },
      });
   },
  hide : function (){
    var t = Tabs.News;
  },

  show : function (){
    var t = Tabs.News;
    Options.BreakingNewsV = true;
    saveOptions();
  },
  notify : function() {
   var t = Tabs.News;
   var elem = document.getElementById("pbtcNews");
elem.setAttribute("style","background: -moz-linear-gradient(center top , #ff0000, #b10000) repeat scroll 0 0 transparent;");
  },

}
/**
 * docusky.ui.manageDbListSimpleUI.js
 * (URL)
 *
 * (Description)
 * 這是利用 docusky web api 所包裝起來的一份 JavaScript
 * Note: - this component is only tested under Firefox and Chrome
 *       - requires jquery
 *
 * @version
 * 0.01 (May xx 2016)
 * 0.02 (August xx 2016)
 * 0.03 (January 23 2017) fix css class name (adds prefix 'dsw-' to better avoid naming conflicts)
 * 0.04 (March 01 2017) add simple message for upload progress
 * 0.05 (April 23 2017) add hideWidget() and modify some codes to let invoker better use widget functions
 * 0.06 (July 28 2017)  set some functions as "private" methods (and fix some bugs)
 * 0.07 (August 09 2017) open uploadMultipart() method
 * 0.08 (January 28 2017) add enableWidgetEvent(), disableWidgetEvent() to allow db/corpus callback
 * 0.09 (January 30 2018) expose login() and uploadMultipart(), and add with credentials to allow CORS requests
 * 0.10 (May 13 2018) add default 'corpusClick' function
 * 0.11 (Feb 19 2019) add renameDbTitle, getUserProfile function (modify widgetEvents so that the callback func
 *                    has evt in the first arg and this in the second arg)
 *
 * @copyright
 * Copyright (C) 2016 Hsieh-Chang Tu
 *
 * @license
 *
 */

if (window.navigator.userAgent.indexOf("MSIE ") > 0) {
   alert("抱歉，DocuSky 工具目前只支援 Firefox 與 Chrome");
}

var ClsDocuskyManageDbListSimpleUI = function(param) {       // constructor
   var me = this;                           // stores object reference

   me.package = 'docusky.ui.manageDbListSimpleUI.js';      // 主要目的：取得給定 db, corpus 的文件
   me.version = 0.10;
   me.idPrefix = 'DbList_';                 // 2016-08-13

   me.utility = null;
   me.protocol = null;                      // 'http',
   me.urlHostPath = null;
   me.urlWebApiPath = null;
   me.urlGetDbListJson = null;
   me.urlUploadXmlFilesToBuildDbJson = null;
   me.urlDeleteDbJson = null;
   me.urlLogin = null;
   me.urlLogout = null;
   me.username = '';
   me.callerEvent = null;
   me.callerCallback = null;              // 儲存成功執行後所需呼叫的函式
   me.initialized = false;
   me.dbList = [];                        // 儲存 DocuSky 的 user databasees 列表
   me.fileName = '';                      // 欲上傳檔案（在本地）的名稱
   me.fileData = '';                      // 欲上傳檔案的內容
   me.fileSizeLimit = 120 * 1024 * 1024;  // 120MB limit -- 需配合 urlUploadXmlFilesToBuildDbJson.php 的設定
   me.enableRefresh = true;               // 2017-04-19
   me.timeoutFunId = null;

   me.loadingIconWidth = 140;             // 2018-01-07: 參考 docusky.ui.getDbCorpusDocumentsSimpleUI
   me.displayLoadingIcon = true;          // 2018-01-07

   me.displayWidget = true;               // 2017-07-24
   me.widgetEvents = { dbClick: null,     // null: disable clicking db -- can be set from invoker as obj.widgetEvents.dbClick=function(s){...}, where s will be the db title
                       corpusAttCntClick: null,                // 2018-01-08: 若 enable 此項，則 corpusClick/attCntClick 將失效
                       corpusClick:
                          function(evt, obj, db, corpus) {     // 2018-05-13: default function ==> open a new window to display db+corpus content
                             var url = me.urlWebApiPath + "/webpage-search-3in1.php?db=" + db + "&corpus=" + corpus;
                             window.open(url, "_blank");
                          },
                       attCntClick: null
                     };
   me.validEvtKeys = ['dbClick', 'corpusAttCntClick', 'corpusClick', 'attCntClick'];
   me.loginSuccFunc = null;                // 2019-02-19
   me.loginFailFunc = null;
   me.Error = null; //all scope error handle

   // =================================
   //       main functions
   // =================================

   var init = function() {
      //var scriptPath = me.utility.getScriptPath();
      //me.urlHostPath = scriptPath.protocol + '://' + scriptPath.host + '/' + me.utility.dirname(scriptPath.path) + '/webApi';
      // 注意： 由於利用 jQuery 動態載入 utility functions，call stack 最後會是在 jQuery 函式，因此不能從 me.utility.getScriptPath() 取得 script URL
      me.urlHostPath = "https://docusky.org.tw/DocuSky";
      //alert(me.urlHostPath);                  // e.g., http://localhost:8000/PHP5/DocuSky
      me.urlWebApiPath = me.urlHostPath + '/webApi';
      me.urlGetDbListJson =  me.urlWebApiPath + '/getDbListJson.php';
      me.urlUploadXmlFilesToBuildDbJson =  me.urlWebApiPath + '/uploadXmlFilesToBuildDbJson.php';
      me.urlDeleteDbJson =  me.urlWebApiPath + '/deleteDbJson.php';
      me.urlRenameDbTitleJson = me.urlWebApiPath + '/renameDbTitleJson.php';
      me.urlGetUserProfileJson = me.urlWebApiPath + '/getUserProfileJson.php';
      //me.urlUpdateUserProfileJson = me.urlWebApiPath + '/updateUserProfileJson.php';    // api not existed yet
      me.urlLogin = me.urlWebApiPath + '/userLoginJson.php';
      me.urlLogout = me.urlWebApiPath + '/userLogoutJson.php';
      me.username = '';

      me.uniqueId = me.utility.uniqueId();

      // login container
      var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
      var loginContainerOverlayId = me.idPrefix + "loginContainerOverlay" + me.uniqueId;
      var closeLoginContainerId = me.idPrefix + "closeLoginContainer" + me.uniqueId;
      var dsUsernameId = me.idPrefix + "dsUsername" + me.uniqueId;
      var dsPasswordId = me.idPrefix + "dsPassword" + me.uniqueId;
      var loginSubmitId = me.idPrefix + "loginSubmit" + me.uniqueId;
      var closeLoginButtonId = me.idPrefix + "closeLoginButton" + me.uniqueId;
      var loginMessageId = me.idPrefix + "loginMessage" + me.uniqueId;

      var s = "<div id='" + loginContainerId + "' class='dsw-container'>"
			   + "<div id='" + loginContainerOverlayId + "' class='dsw-overlay'></div>"
            + "<div class='dsw-titleBar'><table><tr><td class='dsw-titleContainer'><div class='dsw-titlename'>DocuSky Login</div></td><td class='dsw-closeContainer' id='" + closeLoginContainerId + "'><span class='dsw-btn-close' id='" + closeLoginButtonId + "'>&#x2716;</span></td></tr></table></div>"
            + "<div class='dsw-containerContent'>"
            + "<table>"
            + "<tr><td class='dsw-td-dslogin dsw-logintitle'>Username:</td><td class='dsw-td-dslogin'><input type='text' class='dsw-userinput' id='" + dsUsernameId + "'/></td></tr>"
            + "<tr><td class='dsw-td-dslogin dsw-logintitle'>Password:</td><td class='dsw-td-dslogin'><input type='password' class='dsw-userinput' id='" + dsPasswordId + "'/></td></tr>"
            + "<tr><td class='dsw-td-dslogin dsw-loginsubmit' colspan='2'><input id='" + loginSubmitId + "' type='submit' value='登入'/></td></tr>"
            + "<tr><td colspan='2' class='dsw-loginmsg' id='" + loginMessageId + "'></td></tr>"
            + "</table>"
            + "</div>"
            + "</div>";
      $("html").append(s);             // 呃, 用 body 有時會出問題？
      $("#" + loginContainerId).hide();

      $("#" + loginSubmitId).click(function(e) {
         me.login($("#" + dsUsernameId).val(), $("#" + dsPasswordId).val(), me.loginSuccFunc, me.loginFailFunc);    // 2018-01-30
      });
      $("#" + closeLoginButtonId).click(function(e) {
         $("#" + loginContainerId).fadeOut();
         me.hideWidget();
      });

      // dbListContainer container
      var dbListContainerId = me.idPrefix + "dbListContainer" + me.uniqueId;
      var dbListContentId = me.idPrefix + "dbListContent" + me.uniqueId;
      var spanUsernameId = me.idPrefix + "spanUsername" + me.uniqueId;
      var dbListImportToBuildDbId = me.idPrefix + "dbListImportToBuildDb" + me.uniqueId;
      var logoutAnchorId = me.idPrefix + "logoutAnchor" + me.uniqueId;
      var closeDbListId = me.idPrefix + "closeDbList" + me.uniqueId;	// 20170224
      var uploadXmlFileId = me.idPrefix + "uploadXmlFile" + me.uniqueId;
      var uploadXmlToBuildDbId = me.idPrefix + "uploadXmlToBuildDb" + me.uniqueId;
      var dbTitleForImportId = me.idPrefix + "dbTitleForImport" + me.uniqueId;
      var uploadFormId = me.idPrefix + "uploadForm" + me.uniqueId;
      var uploadProgressId = me.idPrefix + "uploadProgress" + me.uniqueId;

      var myVer = me.package + " - Ver " + me.version;
      var t = "登出";
      var s = "<div id='" + dbListContainerId + "' class='dsw-container'>"
            + "<div class='dsw-titleBar'>"
            + "<table><tr><td class='dsw-titleContainer'><div class='dsw-titlename' title='" + myVer + "'>資料庫文獻集列表</div></td>"
            + "<td class='dsw-closeContainer'><div class='dsw-btn-close' id='" + closeDbListId + "'>&#x2716;</div><span class='dsw-btn-logout' id='" + logoutAnchorId + "'>Logout</span><span class='dsw-useridContainer'><span class='dsw-userid' id='" + spanUsernameId + "'>" + me.username + "</span></span></td></tr></table>"
            + "</div>"
            + "<div id='" + dbListContentId + "' class='dsw-containerContent'>"
            + "</div>"
            + "<hr width='96%'/>"
            + "<div id='" + dbListImportToBuildDbId + "' class='dsw-containerContent'>"
            + "<form id='" + uploadFormId + "' name='uploadForm'>"
            + "<div>上載單份 ThdlExportXml 檔以建構文字資料庫：<input type='file' id='" + uploadXmlFileId + "' name='importedFiles[]' accept='.xml'></input></div>"
            + "<table class='dsw-uploadfile'>"
            + "<tr><td>資料庫名稱:</td>"
            + "    <td><input type='text' class='dsw-userinput' id='" + dbTitleForImportId + "' name='dbTitleForImport' value='Default'></input></td>"
            + "    <td width='40%'><div class='dsw-uploadprogressbar' id='" + uploadProgressId + "'><div class='dsw-uploadprogressbar-progress'></div></div></td>"
            + "    <td align='right'><button id='" + uploadXmlToBuildDbId + "' disabled='disabled'>開始上傳</button></td></tr>"
            + "</table>"
            + "</div>"
            + "</form></div>";
            + "</div>";
      $("html").append(s);
      $("#" + dbListContainerId).hide();

      $("#" + logoutAnchorId).click(function(e) {
         e.preventDefault();
         $.ajaxSetup({xhrFields: {withCredentials: true}});
         $.get(me.urlLogout, function(jsonObj) {
            //me.utility.displayJson(jsonObj);
            var dbListContainerId = me.idPrefix + "dbListContainer" + me.uniqueId;
            if (jsonObj.code == 0) {         // successfully logged out
               $("#" + dbListContainerId).fadeOut();
               alert("Successfully logged out");
            }
            else {
               $("#" + dbListContainerId).fadeout();
               alert(jsonObj.code + ': ' + jsonObj.message);
            }
         }, 'json');
      });

      $("#" + closeDbListId).click(function(e) {
         me.hideWidget();              // 2017-04-18
      });

      $("#" + uploadXmlToBuildDbId).click(function(e) {
         e.preventDefault();             // 2016-05-05: 非常重要，否則會出現 out of memory 的 uncaught exception
         //var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
         $("#" + loadingContainerId).show().position({my: "center", at: "center bottom", of: e});     // jqueryUI
         var url = me.urlUploadXmlFilesToBuildDbJson;
         var formData = $("#" + uploadFormId).serializeArray();
         var nameVal = $("#" + uploadXmlFileId).attr("name");     // <input type="file" name="...">
         formData.file = {value: me.fileData, filename: me.fileName, name:nameVal};
         //alert(JSON.stringify(formData));
         me.uploadMultipart(url, formData);
      });

      // loadingContainer
      var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
      var loadingSignId = me.idPrefix + "loadingSign" + me.uniqueId;
      var workingProgressId = me.idPrefix + "workingProgressId" + me.uniqueId;
      var s = "<div id='" + loadingContainerId + "' style='position:absolute; border:3px grey solid; border-radius:6px; background-color:white; z-index: 1003;'>" +
              "<div id='" + loadingSignId + "'>" +
              "<img src='" + me.urlWebApiPath + "/images/loading-circle.gif' width='140' border='0'/>" +
              "</div>" +
              "<div id='" + workingProgressId + "' style='position:absolute; top:60px; width:100%; text-align:center;;'></div>" +
              "</div>";
      $("html").append(s);
      $("#" + loadingContainerId).hide();

      me.initialized = true;
   };

   me.login = function(username, password, succFunc, failFunc) {      // 2018-01-30: expose login()
      // login and shows DbList
      //$.ajaxSetup({async:false});
      var postdata = { dsUname: username, dsPword: password };     // camel style: to get dbCorpusDocuments
      $.ajaxSetup({xhrFields: {withCredentials: true}});           // 2018-01-30: must add this for later CORS requests
      $.post(me.urlLogin, postdata, function(jsonObj) {
         //me.utility.displayJson(jsonObj);
         var loginMessageId = me.idPrefix + "loginMessage" + me.uniqueId;
         var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
         if (jsonObj.code == 0) {         // successfully login
           $("#" + loginMessageId).empty();    // 成功登入，清除（先前可能有的）訊息
           $("#" + loginContainerId).fadeOut();
           if (typeof succFunc === 'function') succFunc(jsonObj.message);    // 2019-02-19 fixed
           else me.manageDbList(me.callerEvent, me.callerCallback);
         }
         else {
            console.error("Login error");
            if (typeof failFunc === 'function'){
              failFunc(jsonObj);
            }
            else if(typeof me.Error === "function"){
              me.Error("Login error");
            }
            else {
               $("#" + loginContainerId).show();
               $("#" + loginMessageId).html(jsonObj.code + ': ' + jsonObj.message);    // jsonObj.code == 101 ==> Requires login
            }
         }
      }, 'json')
      .fail(function (jqXHR, textStatus, errorThrown){
         console.error("Connection error");
         if (typeof failFunc === "function") {
            failFunc();
         }
         else if(typeof me.Error === "function"){
            me.Error("Connection error");
         }
         else{
          let loginMessageId = me.idPrefix + "loginMessage" + me.uniqueId;
          let loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
          $("#" + loginContainerId).show();
          $("#" + loginMessageId).html("Connection error");
          let retry = function(){
            //$.ajaxSetup({xhrFields: {withCredentials: true}});
            //$.ajax(this); //occur CORS
            me.login(username, password, succFunc, failFunc);
          }
          setTimeout(retry,3000);
         }

      });
   };

   me.hideWidget = function(bool) {
      me.displayWidget = (bool === false);      // only hide when parameter equals false
      //alert(me.displayWidget);
      if (!me.displayWidget) {
         var dbListContainerId = me.idPrefix + "dbListContainer" + me.uniqueId;
         $("#" + dbListContainerId).hide();
         var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
         $("#" + loginContainerId).hide();
         clearTimeout(me.timeoutFunId);
         me.enableRefresh = false;
      }
   };

   // 2018-01-07
   me.hideLoadingIcon = function(bool) {
      me.displayLoadingIcon = (bool === false);
   };

   // 2017-12-28: current events 'dbClick', 'corpusAttCntClick', 'corpusClick', 'attCntClick'
   me.enableWidgetEvent = function(evtKey, callback) {
      if (me.validEvtKeys.indexOf(evtKey) !== false) {
         me.widgetEvents[evtKey] = callback;
      }
   }

   me.disableWidgetEvent = function(evtKey) {
      if (me.validEvtKeys.indexOf(evtKey) !== false) me.widgetEvents[evtKey] = null;
   }

   var displayDbList = function(evt, succFunc) {

      var dbList = me.dbList;
      //alert(JSON.stringify(dbList, null, '\t'));

      var refreshDbList = false;

      var contentTableId = me.idPrefix + "contentTable" + me.uniqueId;
      var dbListContentId = me.idPrefix + "dbListContent" + me.uniqueId;
      var uploadXmlFileId = me.idPrefix + "uploadXmlFile" + me.uniqueId;

      var s = "<table id='" + contentTableId + "' class='dsw-tableDbCorpuslist'>";
      for (var i=0; i<dbList.length; i++) {
         var db = dbList[i]['db'];
         var dbStatus = dbList[i]['dbStatus'];
         if (dbStatus != 0 && dbStatus != 9) refreshDbList = true;           // 只要有一份資料庫尚未完成工作，就啟動 refresh
         var corpusList = dbList[i]['corpusList'];
         var corpusAttCntList = dbList[i]['corpusAttCntList'];               // 2017-12-28
         var myList = corpusList.split(';');
         var attCntList = corpusAttCntList.split(';');
         var corpusListStr = "<div>";
         for (var j=0; j<myList.length; j++) {
            if (j > 0) corpusListStr += ' ‧ ';
            var corpus = myList[j];
            var attCnt = attCntList[j];
            var t2 = "";
            if (me.widgetEvents.corpusAttCntClick) {
               var t1 = "<span class='dsw-corpusAttCntClick' x-db='" + db + "' x-corpus='" + corpus + "'>"
                      + corpus
                      + (attCnt > 0 ? " [" + attCnt + "]" : "")
                      + "</span>";
            }
            else {
               var t1 = (me.widgetEvents.corpusClick) ? "<span class='dsw-corpusClick' x-db='" + db + "' x-corpus='" + corpus + "'>" + corpus + "</span>" : corpus;
               if (attCnt > 0) {
                  t2 = (me.widgetEvents.attCntClick) ? "<span class='dsw-attCntClick' x-db='" + db + "' x-corpus='" + corpus + "'> [" + attCnt + "]</span>" : "[" + attCnt + "]";
               }
            }
            corpusListStr += "<span class='dsw-dbList-corpusnames-corpusname'>"
                          + t1 + t2
                          + "</span>";
         }
         corpusListStr += "</div>";

         var t = (me.widgetEvents.dbClick) ? "<span class='dsw-dbClick' x-db='" + db + "'>" + db + "</span>" : db;
         s += "<tr class='dsw-tr-dbcorpuslist'>"
           +  "<td class='dsw-td-dbList dsw-td-dbList-dbname'>" + t + "</td>"
           +  "<td class='dsw-td-dbList dsw-td-dbList-corpusnames'>" + corpusListStr + "</td>"
           +  "<td class='dsw-td-dbList dsw-td-dbList-delete'><a class='deleteDb' href='" + me.urlDeleteDbJson + "?db=" + db + "'>刪除</a></td>";
           +  "</tr>";
      }

      s += "</table>";

      $("#" + dbListContentId).html(s);
      var w = $("#" + contentTableId).width();
      // $("#" + dbListContentId).width(800);	// 20170224

      $("span.dsw-dbClick").on("click", function(evt) {
         me.hideWidget();
         if (typeof me.widgetEvents.dbClick === 'function') me.widgetEvents.dbClick(evt,this,$(this).attr("x-db"));
      });
      $("span.dsw-corpusAttCntClick").on("click", function(evt) {
         me.hideWidget();
         if (typeof me.widgetEvents.corpusAttCntClick === 'function') me.widgetEvents.corpusAttCntClick(evt,this,$(this).attr("x-db"), $(this).attr("x-corpus"));
      });
      $("span.dsw-corpusClick").on("click", function(evt) {
         me.hideWidget();
         if (typeof me.widgetEvents.corpusClick === 'function') me.widgetEvents.corpusClick(evt,this,$(this).attr("x-db"), $(this).attr("x-corpus"));
      });
      $("span.dsw-attCntClick").on("click", function(evt) {
         me.hideWidget();
         if (typeof me.widgetEvents.attCntClick === 'function') me.widgetEvents.attCntClick(evt,this,$(this).attr("x-db"), $(this).attr("x-corpus"));
      });

      // test...
      // me.enableWidgetEvent('dbClick', function(db) { alert(db); });

      var h = $("#" + contentTableId).height();
      $("#" + dbListContentId).height(Math.min(280,h));

      $("#" + uploadXmlFileId).change(function(e) {
         // Note: currently only support one file upload!
         var files = this.files;
         me.fileName = files[0].name;          // store to object value (only the first file)
         var fileSize = files[0].size;
         if (fileSize > this.fileSizeLimit) {
            alert("Error\n" +
                  "The size of " + this.fileName + " (" + fileSize + ") exceeds upload limit\n" +
                  "Upload limit size: " + this.fileSizeLimit);
            this.fileData = '';               // if upload empty string, DocuSky will return 'invalid XML' message
            return;
         }
         var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
         var uploadXmlToBuildDbId = me.idPrefix + "uploadXmlToBuildDb" + me.uniqueId;
         $("#" + loadingContainerId).show().position({ my: "center", at: "center", of: $("#" + dbListContentId), collision: "fit"});     // jqueryUI
         readFile(files[0]).done(function(fileData){
            me.fileData = fileData;
            $("#" + loadingContainerId).hide();
            $("#" + uploadXmlToBuildDbId).prop('disabled', false);
         });
      });

      $(".deleteDb").click(function(e) {
         e.preventDefault();         // prevent default anchor action

         // 2016-08-23: add confirm check
         var href = this.href;
         var match = this.href.match(/db=([^&]+)/);
         var confirmed = confirm("確定要刪除資料庫：「" + decodeURIComponent(match[1] + '」?'));
         if (!confirmed) return;      // cancel
         me.deleteDb(match[1]);

         /*$.ajaxSetup({xhrFields: {withCredentials: true}});
         $.get(this.href, function(jsonObj) {
            var dbListContainerId = me.idPrefix + "dbListContainer" + me.uniqueId;
            //me.utility.displayJson(jsonObj);
            if (jsonObj.code == 0) {         // successfully logged out
               //$("#" + dbListContainerId).fadeOut();
               alert("Successfully deleted");
               me.manageDbList(me.callerEvent, me.callerCallback);
            }
            else {
               $("#" + dbListContainerId).fadeout();
               alert(jsonObj.code + ': ' + jsonObj.message);
            }
         }, 'json');*/
      });

      // 2016-11-19
      if (me.enableRefresh && refreshDbList) {
         me.timeoutFunId = setTimeout(function() { me.manageDbList(evt, null); }, 15000);      // 15 seconds
      }
   };

   //2019-03-06 : public function
   me.deleteDb = function(DbTitle,succFunc,failFunc) {
     if (!me.initialized) init();
     var url = me.urlDeleteDbJson + '?db=' + DbTitle;
     $.ajaxSetup({xhrFields: {withCredentials: true}});
     $.get(url, function(data) {
        if (data.code == 0) {          // successfully invoke delete api
           if (typeof succFunc === "function") succFunc();
           else alert(data.message);
        }
        else if (data.code == 101) {             // requires login
          $("#" + loginContainerId).show();
          var jelement = $("#" + loginContainerId);
          var w = jelement.width();
          var h = jelement.height();
          jelement.css({ top: '40px', left: '80px' });
          jelement.show();
        }
        else {                        // fail to invoke delete api
          if (typeof failFunc === "function"){
            failFunc();
          }
          else if(typeof me.Error === "function"){
            me.Error("Server error");
          }
          else {
            alert("Error: " + data.code + "\n" + data.message);
          }
        }
     }, 'json')
     .fail(function (jqXHR, textStatus, errorThrown){
        console.error("Connection error");
        if (typeof failFunc === "function") {
           failFunc();
        }
        else if(typeof me.Error === "function"){
           me.Error("Connection error");
        }
        else{
         alert("Connection error");
         let retry = function(){
           //$.ajaxSetup({xhrFields: {withCredentials: true}});
           //$.ajax(this); //occur CORS
           me.deleteDb(DbTitle,succFunc,failFunc);
         }
         setTimeout(retry,3000);
        }

     });
   }

   // 2019-02-17: public function
   me.renameDbTitle = function(oldDbTitle, newDbTitle, succFunc, failFunc) {
      if (!me.initialized) init();
      var url = me.urlRenameDbTitleJson + '?oldDbTitle=' + oldDbTitle + '&newDbTitle=' + newDbTitle;
      $.ajaxSetup({xhrFields: {withCredentials: true}});
      $.get(url, function(data) {
         if (data.code == 0) {          // successfully invoke rename api (but may not update record successfully)
            if (typeof succFunc === "function") succFunc();
            else alert(data.message);
         }
         else if (data.code == 101) {             // requires login
            $("#" + loginContainerId).show();
            var jelement = $("#" + loginContainerId);
            var w = jelement.width();
            var h = jelement.height();
            jelement.css({ top: '40px', left: '80px' });
            jelement.show();
         }
         else {
           if (typeof failFunc === "function"){
             failFunc();
           }
           else if(typeof me.Error === "function"){
             me.Error("Server error");
           }
           else {
             alert("Error: " + data.code + "\n" + data.message);
           }
         }
      }, 'json')
      .fail(function (jqXHR, textStatus, errorThrown){
         console.error("Connection error");
         if (typeof failFunc === "function") {
            failFunc();
         }
         else if(typeof me.Error === "function"){
            me.Error("Connection error");
         }
         else{
          alert("Connection error");
          let retry = function(){
            //$.ajaxSetup({xhrFields: {withCredentials: true}});
            //$.ajax(this); //occur CORS
            me.renameDbTitle(oldDbTitle, newDbTitle, succFunc, failFunc);
          }
          setTimeout(retry,3000);
         }

      });
   }

   // 2019-02-19
   me.getUserProfile = function(evt, succFunc) {
      if (!me.initialized) init();
      var url = me.urlGetUserProfileJson;
      $.ajaxSetup({xhrFields: {withCredentials: true}});
      $.get(url, function(data) {
         if (data.code == 0) {          // successfully invoke rename api (but may not update record successfully)
            if (typeof succFunc === "function") succFunc(data.message);
            else alert("USER PROFILE:\n" + JSON.stringify(data.message));

         }
         else if (data.code == 101) {             // requires login
            var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
            $("#" + loginContainerId).show();
            var jelement = $("#" + loginContainerId);
            var w = jelement.width();
            var h = jelement.height();
            jelement.css({ top: '40px', left: '80px' });
            jelement.show();
         }
         else {
            alert("Error: " + data.code + "\n" + data.message);
         }
      }, 'json');
   }

   me.manageDbList = function(evt, succFunc, failFunc) {
      //if (!me) { var me = this; }
      if (!me.initialized) init();

      me.callerEvent = evt;
      me.callerCallback = succFunc;
      me.enableRefresh = true;

      // 決定顯示的位置
      var winWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      // winWidth = $('body').innerWidth();
      // var scrollbarWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - Local.winWidth;
      var winHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

      var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
      var loginContainerOverlayId = me.idPrefix + "loginContainerOverlay" + me.uniqueId;
      var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;

      //$.ajaxSetup({async:false});
      $.ajaxSetup({xhrFields: {withCredentials: true}});
      $.get(me.urlGetDbListJson, function(data) {

         if(evt){
           let loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
           $("#"+loadingContainerId).hide();
         }

         if (data.code == 0) {          // successfully get db list

            me.dbList = data.message;

            if(evt){
              var dbListContainerId = me.idPrefix + "dbListContainer" + me.uniqueId;
              var jelement = $("#" + dbListContainerId);
              var w = jelement.width();
              var h = jelement.height();
              var overX = Math.max(0, evt.pageX - 40 + w - winWidth);     // 超過右側邊界多少 pixels
              var posLeft = Math.max(10, evt.pageX - overX - 40);
              var overY = Math.max(0, evt.pageY + h + 15 - winHeight);    // 超過下方邊界多少 pixels
              //var posTop = Math.min(winHeight - overY - 15, evt.pageY + 15);
              var posTop = evt.pageY + 5;
              jelement.css({ top: posTop + 'px', left: posLeft + 'px' });
              $("#" + dbListContainerId).show();

            }

            //2019-03-08 inset username on dbListContainerId
            //Owning to the init() limit, it is needed to insert username here.
            if(!me.username){
              me.getUserProfile(null,function(data){
                me.username = data.username;
                var spanUsernameId = me.idPrefix + "spanUsername" + me.uniqueId;
                $("#"+spanUsernameId).html(me.username);
              });
            }

            // 2017-07-22
            if (typeof me.callerCallback === "function") {
               me.hideWidget(me.displayWidget);
               me.callerCallback();
            }
            else{
              displayDbList(evt);
            }
         }
         else if (data.code == 101) {             // requires login

           if(evt){
             $("#" + loginContainerId).show();
             var jelement = $("#" + loginContainerId);
             var w = jelement.width();
             var h = jelement.height();
             var overX = Math.max(0, evt.pageX - 40 + w - winWidth);     // 超過右側邊界多少 pixels
             var posLeft = Math.max(10, evt.pageX - overX - 40);
             var overY = Math.max(0, evt.pageY + h + 15 - winHeight);    // 超過下方邊界多少 pixels
             //var posTop = Math.min(winHeight - overY - 15, evt.pageY + 15);
             var posTop = evt.pageY + 5;
             jelement.css({ top: posTop + 'px', left: posLeft + 'px' });
             jelement.show();

           }
           else{
             $("#" + loginContainerId).show();
             var jelement = $("#" + loginContainerId);
             var w = jelement.width();
             var h = jelement.height();
             var overX = Math.max(0, w - 40 - winWidth);     // 超過右側邊界多少 pixels
             var posLeft = Math.max(10, overX - 40);
             var overY = Math.max(0, h + 15 - winHeight);    // 超過下方邊界多少 pixels
             var posTop = 5;
             jelement.css({ top: posTop + 'px', left: posLeft + 'px' });
             jelement.show();

           }

         }
         else {
             console.error("Server Error");
             if (typeof failFunc === "function") {
                me.hideWidget(me.displayWidget);
                failFunc();
             }
             else if(typeof me.Error === "function"){
                me.hideWidget(me.displayWidget);
                me.Error("Server Error");
             }
             else{
               alert("Error: " + data.code + "\n" + data.message);
             }
         }
      }, 'json')
      .fail(function (jqXHR, textStatus, errorThrown){
         console.error("Connection error");
         if(evt){
           let loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
           $("#"+loadingContainerId).show();
           let workingProgressId = me.idPrefix + "workingProgressId" + me.uniqueId;
           $("#" + workingProgressId).html("<font size='3.5'>Unstable <br> network</font>");
         }
         if (typeof failFunc === "function") {
            me.hideWidget(me.displayWidget);
            failFunc();
         }
         else if(typeof me.Error === "function"){
            me.hideWidget(me.displayWidget);
            me.Error("Connection error");
         }
         else{

          let retry = function(){
            //$.ajaxSetup({xhrFields: {withCredentials: true}});
            //$.ajax(this); //occur CORS
            me.manageDbList(evt, succFunc, failFunc);
          }
          setTimeout(retry,3000);
         }

      });

   };


   // for multipart file upload
   var readFile = function(file) {
      var loader = new FileReader();
      var def = $.Deferred(), promise = def.promise();

      //--- provide classic deferred interface
      loader.onload = function (e) { def.resolve(e.target.result); };
      loader.onprogress = loader.onloadstart = function (e) { def.notify(e); };
      loader.onerror = loader.onabort = function (e) { def.reject(e); };
      promise.abort = function () { return loader.abort.apply(loader, arguments); };

      //loader.readAsBinaryString(file);
      loader.readAsText(file, 'UTF-8');         // 不能用 binary 讀入，會變成亂碼

      return promise;
   };

   // 2017-08-09: open uploadMultipart() method
   me.uploadMultipart = function(url, data, callback) {       // 2017-04-23: add callback
      var mul = buildMultipart(data);
      $.ajax({
         url: url,
         data: mul.data,
         processData: false,
         type: "post",
         //async: false,          // not supported in CORS (Cross-Domain Resource Sharing)
         xhrFields: {
            withCredentials: true
         },
         crossDomain: true,
         contentType: "multipart/form-data; boundary=" + mul.myBoundary,
         xhr: function() {
            var xhr = $.ajaxSettings.xhr();
            // upload progress
            xhr.upload.addEventListener("progress", function(evt) {
               if (evt.lengthComputable) {
                  var position = evt.loaded || evt.position;
				      var percentComplete_f = position / evt.total * 100;	// 20170302
                  var percentComplete_i = Math.ceil(percentComplete_f);	// 20170302
                  var r = (percentComplete_i == 100) ? ' ... waiting for server response' : '';
				      $("#" + me.uploadProgressId + " .dsw-uploadprogressbar-progress").text(percentComplete_i + '%' + r).css("width", percentComplete_f + "%");	// 20170302
				      //$("div.dsw-uploadprogressbar-progress").text(percentComplete_i + '%' + r).css("width", percentComplete_f + "%");	// 20170302
               }
            }, false);     // true: event captured in capturing phase, false: bubbling phase
            //// download progress
            //xhr.addEventListener("progress", function(evt){
            //   if (evt.lengthComputable) {
            //      var percentComplete = evt.loaded / evt.total;
            //      //Do something with download progress
            //   }
            //}, false);
            return xhr;
         },
         success: function(data, status, xhr) {
            var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
            $("#" + loadingContainerId).hide();
            if (data.code == 0) {                      // successfully get db list
               if (typeof callback === 'function') callback(data);
               else {
                  alert(data.message);
                  me.manageDbList(me.callerEvent, null);  // me.callerCallback? refresh db_corpus list
               }
            }
            else {
               alert("Error: " + data.code + "\n" + data.message);
            }
            $("#" + me.uploadProgressId).hide();
            //$("div.dsw-uploadprogressbar").hide();    // 20170419
            //$("#" + uploadXmlToBuildDbId).prop('disabled', true);
        },
         error: function(xhr, status, error) {
            //var err = eval("(" + xhr.responseText + ")");
            $("#" + me.uploadProgressId).hide();
            var loadingContainerId = me.idPrefix + "loadingContainer" + me.uniqueId;
            $("#"+loadingContainerId).hide();
            alert(error);
            //ert(xhr.responseText);
         }
      });
	   $("#" + me.uploadProgressId).find(".dsw-uploadprogressbar-progress").text("").css("width", "0%").end().show();	// 20170302
      //$("div.dsw-uploadprogressbar-progress").text("").css("width", "0%").end().show();	// 20170302
   };

   var buildMultipart = function(data) {
      var key, chunks = [], myBoundary;
      myBoundary = $.md5 ? $.md5(new Date().valueOf()) : (new Date().valueOf());
      myBoundary = '(-----------docusky:' + myBoundary + ')';

      for (var key in data) {
         if (key == "file") {
            chunks.push("--" + myBoundary + "\r\n" +
               "Content-Disposition: form-data; name=\"" + data[key].name + "\"; filename=\"" + data[key].filename + "\"\r\n" +
               "Content-Type: application/octet-stream\r\n" +
               "Content-Transfer-Encoding: binary\r\n\r\n" +
               data[key].value);
         }
         else {
            chunks.push("--" + myBoundary + "\r\n" +
               "Content-Disposition: form-data; name=\"" + data[key].name + "\"\r\n\r\n" +
               data[key].value);
         }
      }

      return {
         myBoundary: myBoundary,
         data: chunks.join("\r\n")+"\r\n--"+myBoundary+"--"
      };
   };

   //// 動態載入 utility functions
   //me.scriptPath = new Error().stack.match(/((http[s]?):\/\/([^\/]+)\/((.+)\/)?)([^\/]+\.js):/)[1];
   me.utility = docuskyWidgetUtilityFunctions;
   if (!me.initialized) init();

};

// ----------------------------------------------------------------------------------

var docuskyWidgetUtilityFunctions = {
   getUrlParameterVarValue: function(url, varname) {
      var p = url.indexOf('?');
      if (p == -1) return '';
      var urlVars = url.substr(p+1).split('&');

      for (i = 0; i < urlVars.length; i++) {
         var nameVal = urlVars[i].split('=');
         if (nameVal[0] === varname) {
            return nameVal[1] === undefined ? true : nameVal[1];
         }
      }
      return '';
   },

   //getScriptPath: function() {
   //   var ua = window.navigator.userAgent;
   //   var msie = ua.indexOf("MSIE ");
   //   if (msie) {
   //      // use fixed url
   //      var pathParts = "http://docusky.digital.ntu.edu.tw/docusky/js.ui/docusky.widget.utilityFunctions.js";
   //   }
   //   else {
   //      var errorStack = new Error().stack;
   //      var pathParts = errorStack.match(/((http[s]?):\/\/([^\/]+)\/((.+)\/)?([^\/]+\.js)):/);
   //   }
   //   return {
   //      fullPath: pathParts[1],
   //      protocol: pathParts[2],
   //      host: pathParts[3],
   //      path: pathParts[5],
   //      file: pathParts[6]
   //   };
   //},

   basename: function(path) {
      return path.replace(/.*[/]/, "");
   },

   dirname: function(path) {
      return path.match(/(.*)[/]/)[1];
   },

   uniqueId: (function() {
      var counter = 0;
      return function() {
         return "_" + counter++;
      }
   })(),

   getDateStr: function(d, separator) {
      if (typeof separator == "undefined") separator = '';
      var twoDigitsMonth = ("0" + (d.getMonth()+1)).slice(-2);      // slice(-2) to get last 2 chars
      var twoDigitsDay = ("0" + d.getDate()).slice(-2);
      var strDate = d.getFullYear() + separator + twoDigitsMonth + separator + twoDigitsDay;
      return strDate;
   },

   //copyArray: function(o) {
   //   var output, v, key;
   //   output = Array.isArray(o) ? [] : {};
   //   for (key in o) {
   //      v = o[key];
   //      output[key] = (typeof v === "object") ? this.copyArray(v) : v;
   //   }
   //   return output;
   //},

   displayJson: function(jsonObj) {
      //var jsonStr = $("pre").text();
      //var jsonObj = JSON.parse(jsonStr);
      var jsonPretty = JSON.stringify(jsonObj, null, '\t');
      alert(jsonPretty);
   },

   // 2017-01-01
   includeJs: function(url) {
      var script  = document.createElement('script');
      script.src  = url;
      script.type = 'text/javascript';
      script.defer = true;        // script will not run until after the page has loaded
      document.getElementsByTagName('head').item(0).appendChild(script);
   }

};

// 20170302, 20180319: CSS injection
$('head').append('<style id="dsw-simplecomboui">'
	+ 'div.dsw-container { position:absolute; border:#4F4F4F solid 3px; background-color:#EFEFEF; border-radius:4px; display:inline-block; font-family: "Arial","MingLiU"; font-size: 16px; z-index:1001 }'
	+ 'div.dsw-titleBar { background-color:#4F4F4F; color:white; z-index:1001; padding: 6px; line-height: 16px; }'
	+ 'div.dsw-containerContent { padding: 6px; overflow-x:hidden; overflow-y:auto; font-size:medium; z-index:1001 }'
	+ '.dsw-titleBar table,.dsw-containerContent table { width: 100%; line-height:1.3em; border-collapse: collapse; border-spacing:0; }'
	+ 'table.dsw-tableDbCorpuslist { width:100%; margin-right: 16px; border-collapse: collapse; border-spacing: 0; font-size:medium; line-height:1.3em; color:#2F2F3F; }'
	+ 'tr.dsw-tr-dbcorpuslist:nth-child(even) { background: #DFDFDF; line-height:1.3em; }'
	+ 'tr.dsw-tr-dbcorpuslist:nth-child(odd)  { background: #FFFFFF; line-height:1.3em; }'
   + '.dsw-titleContainer { width: 60%; padding: 0; }'
   + '.dsw-closeContainer { position: relative; text-align: right; direction: rtl; padding: 0; }'
   + '.dsw-titlename { display: inline-block; line-height: 16px; white-space: nowrap; }'
   + '.dsw-btn-close { display: inline-block; line-height: 16px; cursor: pointer; }'
   + '.dsw-btn-close:hover { background-color:#BFBFBF; color:#96438A; }'
   + '.dsw-btn-close:active { background-color:#BFBFBF; color:#96438A; }'
   + '.dsw-td-dbcorpuslist { vertical-align: middle; padding: 0.25rem;}'
   + '.dsw-td-dbcorpuslist-num { text-align: right;}'
   + '.dsw-useridContainer { display: inline-block; width: 50px; white-space: nowrap; overflow: visible; margin: 0 72px 0 0; }'
   + '.dsw-userid { display: inline-block; direction: ltr; }'
   + '.dsw-btn-logout { position: absolute; right: 0; top: -2px; color:#2F2F2F; background-color:#EFEFEF; border-radius: 3px; font-size: 0.75rem; line-height: 0.75rem; padding: 4px; margin: 0 24px 0 0; cursor: pointer; }'
   + '.dsw-btn-logout:hover { background-color:#BFBFBF; color:#96438A; }'
   + '.dsw-btn-logout:active { background-color:#BFBFBF; color:#96438A; }'
   + '.dsw-overlay { display: none; position: absolute; background-color: #AAAAAA; opacity: 0.5; z-index: 1002; height: 100%; width: 100%; }'
   + 'input[type="text"].dsw-userinput,input[type="password"].dsw-userinput { box-sizing: content-box; padding: 2px 8px; border: 1px solid grey; border-radius: 2px; font-size: 14px; height: 20px; width: 150px; }'
   + '.dsw-td-dslogin { padding: 0; height: 1.75rem; vertical-align: middle; }'
   + '.dsw-logintitle { padding-right: 6px; }'
   + '.dsw-loginsubmit { direction: rtl; }'
   + '.dsw-loginmsg { padding: 0; color: red; font-size: 12px; font-weight: bold; }'
   + 'table.dsw-filenameList { width: 100%; margin-right: 16px; border-collapse: collapse; border-spacing: 0; line-height: 1.25; }'
   + '.dsw-filenameList td { padding: 0.25rem; vertical-align: top; white-space: nowrap; }'
   + '.dsw-filenameList-id { text-align: right; }'
   + '.dsw-filename-download,.dsw-filename.delete { text-align: center; }'
   + '.dsw-filenameList-category,.dsw-filenameList-path { text-align: left; overflow-x: hidden; text-overflow: ellipsis; }'
   + '.dsw-filenameList-id {}'	// Let ID automatically adjust width
   + '.dsw-filenameList-download,.dsw-filenameList-delete { width: 45px; max-width: 45px; text-align: center; }'
   + '.dsw-filenameList-category { font-weight: bold; min-width: 120px; max-width: 150px; }'
   + '.dsw-filenameList-path { min-width: 450px; max-width: 550px; }'
   + '.table.dsw-uploadfile{ width: 100%; border-collapse: collapse; border-spacing: 0; }'
   + '.dsw-uploadfile td { padding: 0; }'
   + '.dsw-td-dbList { padding: 0.25rem; }'
   + '.dsw-td-dbList-dbname,.dsw-td-dbList-corpusnames{ text-align:left; border:1px solid #5C5C5C; }'
   + '.dsw-td-dbList-delete{ text-align: center;  border:1px solid #5C5C5C; }'
   + '.dsw-td-dbList-dbname{ font-weight:600; min-width: 100px; max-width:180px; word-wrap: break-word; word-break: break-all; }'
   + '.dsw-td-dbList-corpusnames{ min-width: 450px; max-width: 550px; }'
   + '.dsw-td-dbList-delete{ min-width:40px; max-width: 60px; white-space: nowrap; }'
   + '.dsw-dbList-corpusnames-corpusname { display: inline-block; vertical-align: middle; white-space: nowrap; max-width: 250px; overflow-x: hidden; text-overflow: ellipsis; }'
   + '.dsw-uploadprogressbar { display: none; box-sizing: border-box; height: 20px; width: 100%; margin: 0; padding: 0; border: 1px solid #515F6B; border-radius: 3px; overflow: hidden; background-color: #AFB9C3; }'
   + '.dsw-uploadprogressbar-progress { display: block; height: 100%; margin: 0; padding: 0; border: 0; background-color: #4C93D4; text-align: center; color: white; white-space: nowrap; }'
   + 'span.dsw-dbClick { cursor:pointer; text-decoration:underline; color:blue; }'
   + 'span.dsw-corpusAttCntClick { cursor:pointer; text-decoration:underline; color:blue; }'
   + 'span.dsw-corpusClick { cursor:pointer; text-decoration:underline; color:blue; }'
   + 'span.dsw-attCntClick { cursor:pointer; text-decoration:underline; color:blue; }'
   + '</style>'
);

// ----------------------------------------------------------------------------------
// initialize widget
var docuskyManageDbListSimpleUI = new ClsDocuskyManageDbListSimpleUI();

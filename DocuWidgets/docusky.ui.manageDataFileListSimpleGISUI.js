/**
 * docusky.ui.manageDataFileListSimpleGISUI.js
 * modified from docusky.ui.manageDataFileListSimpleUI.js
 * (URL)
 *
 * (Description)
 * 這是利用 docusky web api 所包裝起來的一份 JavaScript
 * Note: - this component is only tested in Firefox and Chrome
 *       - requires jquery
 *
 * @version
 * 0.01 (May xx 2016)
 * 0.02 (August xx 2016)
 * 0.03 (January 23 2017) fix css class name (adds prefix 'dsw-' to better avoid naming conflicts)
 * 0.04 (March 01 2017) add simple message for upload progress
 * 0.05 (July 07 2017) bugs fix: apply encodeURIComponent() to category/pathfile
 * 0.06 (July 28 2017) move "utility" functions here
 * 0.07 (May 09 2019) add error handling, me.Error, me.maxResponseTimeout, me.maxRetryCount, me.uploadProgressFunc
 *                     fix server improperly return a non-JSON (should not retry in this case)
 * 
 * @copyright
 * Copyright (C) 2016 Hsieh-Chang Tu
 *
 * @license
 */

if (window.navigator.userAgent.indexOf("MSIE ") > 0) {
      alert("抱歉，DocuSky 工具目前只支援 Firefox 與 Chrome");
   }

   var ClsDocuskyManageDataFileListSimpleUI = function(param) {    // constructor
      this.package = 'docusky.ui.manageDataFileListSimpleUI.js';   // 主要目的：取得 data file list，並讓使用者可上載或刪除 data files
      this.version = 0.07;
      this.idPrefix = 'DataFile_';                                 // 2016-08-13

      this.utility = null;
      this.protocol = null;                                        // 'http',
      this.urlHostPath = null;
      this.urlGetAllCategoryDataFilenamesJson = null;
      this.urlGetCategoryDataFilenamesJson = null;                 // v0.02
      this.urlSaveDataFileJson = null;
      this.urlDeleteDataFileJson = null;
      this.urlLoadDataFileBinary = null;
      this.urlLogin = null;
      this.urlLogout = null;
      this.username = '';
      this.loginCallback = null;               // 儲存當前欲執行的函式（成功登入後將自動呼叫）
      this.callerEvent = null;
      this.callerCallback = null;              // 儲存成功執行後所需呼叫的函式
      this.initialized = false;
      this.categoryFilenameList = [];          // 儲存 category => filenames 的物件
      this.fileName = '';                      // 欲上傳檔案（在本地）的名稱
      this.fileData = '';                      // 欲上傳檔案的內容
      this.Error = null; //all scope error handle
      this.maxResponseTimeout = 300000;
      this.maxRetryCount = 10;
      this.presentRetryCount = 0;
      this.uploadProgressFunc = null; //callback function for the percentage of upload progress

      this.jsonTransporter = {                 // 利用此物件（的 category, datapath, filename, jsonObj）在 client-server 之間傳遞 json 物件
         category: 'unknown',
         datapath: 'unknown',
         filename: 'unknown',
         jsonObj: null,
         serverCode: 0,
         serverMessage: '',

         // 利用此函式存取 Json 物件
         storeJson: function(category, datapath, filename, jsonObj, succFunc, failFunc) {
            //2019-05-08: 舊的方式傳入 (json, callback) 兩參數，但與 retrieveJson(category, datapath, filename, callback)不對稱
            // Note: to access parent function, we can use ParentClass.prototype.myMethod.call(this, arg1, arg2, ..)
            // Here I simply use 'docuskyManageDataFileListSimpleUI' to access the parent object

            if (arguments.length <= 2) {              // (jsonObj, callback)
               var me = this;
               me.jsonObj = arguments[0];
               var jsonStr = JSON.stringify(me.jsonObj);
               var succFunc = (arguments.length == 2) ? arguments[1] : null;
               var category = me.category;   // 舊的方式，利用物件屬性傳遞儲存位置
               var datapath = me.datapath;
               var filename = me.filename;
            }
            else {                                    // (category, datapath, filename, jsonObj, callback)
               var category = arguments[0];
               var datapath = arguments[1];
               var filename = arguments[2];
               var jsonStr = JSON.stringify(arguments[3]);
               var succFunc = (arguments.length >= 5) ? arguments[4] : null;
               var failFunc = (arguments.length >= 6) ? arguments[5] : null;
            }

            if (docuskyManageDataFileListSimpleUI.urlSaveDataFileJson === null) docuskyManageDataFileListSimpleUI.init();
            var url = docuskyManageDataFileListSimpleUI.urlSaveDataFileJson;

            var fd = new FormData();
            fd.append('uploadDataCategory', category);
            fd.append('uploadDataPath', datapath);
            fd.append('uploadDataFilename', filename);
            //var bytes = new Uint8Array(me.fileData.length);
            //for (var i=0; i<me.fileData.length; i++) bytes[i] = me.fileData.charCodeAt(i);
            //var blob = new Blob([bytes]);
            var blob = new Blob([jsonStr]);
            //alert(me.fileData.length + ':' + blob.size);
            fd.append('importedFiles[]', blob);
            docuskyManageDataFileListSimpleUI.uploadBlob(url, fd, false, succFunc, failFunc);    // false: disable dialog
         },

         retrieveJson: function(category, datapath, filename, succFunc, failFunc) {
            var me = this;
            me.category = category;
            me.datapath = datapath;
            me.filename = filename;
            var url = docuskyManageDataFileListSimpleUI.urlLoadDataFileBinary;;
            var parameters = "catpathfile=" + encodeURIComponent(me.category) + "/" + encodeURIComponent(me.datapath) + "/" + encodeURIComponent(me.filename);
            url += "?" + parameters;
            $.ajaxSetup({xhrFields: {withCredentials: true}});
            $.getJSON(url, function(data) {
               if(data){
                 me.jsonObj = data;
                 if (typeof succFunc === 'function') succFunc();
               }
               else{
                 console.error("Server Error");
                 if (typeof failFunc === "function"){
                   failFunc();
                 }
                 else if(typeof me.Error === "function"){
                   docuskyManageDataFileListSimpleUI.Error("Server Error");
                 }
                 else {
                   alert("retrieveJson Error");
                 }
               }

            });
         },

         // 2019-05-08
         listCategoryDataFiles: function(category, datapath, succFunc, failFunc) {
            var me = this;
            if (datapath == "*") datapath = "";
            var catpath = category + '/' + datapath;
            var url = docuSkyDataFilesObj.urlGetCategoryDataFilenamesJson;
            var parameters = "catpath=" + catpath;
            url += "?" + parameters;
            $.ajaxSetup({xhrFields: {withCredentials: true}});
            $.get(url, function(data) {
              if(data.code == 0){
                me.jsonObj = data;
                if (typeof succFunc === 'function') succFunc();
              }
              else{
                console.error("Server Error");
                if (typeof failFunc === "function"){
                  failFunc();
                }
                else if(typeof me.Error === "function"){
                  docuskyManageDataFileListSimpleUI.Error("Server Error");
                }
                else {
                  alert("listCategoryDataFiles Error");
                }
              }
            })
            .fail(function (jqXHR, textStatus, errorThrown){
              if (jqXHR.status=="200") {          // 2019-05-07: server return not correct json
                 alert("Server response seems not a valid JSON");
                 return;
              }
              if(jqXHR.status=="404" || jqXHR.status=="403"){
                console.error("Server Error");
              }
              else{
                console.error("Connection Error");
              }
               if (typeof failFunc === "function") {
                  failFunc();
               }
               else if(typeof docuskyManageDataFileListSimpleUI.Error === "function"){
                 if(jqXHR.status=="404" || jqXHR.status=="403"){
                   docuskyManageDataFileListSimpleUI.Error("Server Error");
                 }
                 else{
                   docuskyManageDataFileListSimpleUI.Error("Connection Error");
                 }
               }
               else{
                 if(jqXHR.status=="404" || jqXHR.status=="403"){
                   alert("Server Error");
                 }
                 else{
                   if(docuskyManageDataFileListSimpleUI.presentRetryCount < docuskyManageDataFileListSimpleUI.maxRetryCount){
                     docuskyManageDataFileListSimpleUI.presentRetryCount++;
                     alert("Connection Error");
                     let retry = function(){
                       docuskyManageDataFileListSimpleUI.jsonTransporter.listCategoryDataFiles(category, datapath, succFunc, failFunc);
                     }
                     setTimeout(retry,3000);
                   }
                   else{
                     alert("Please check your Internet connection and refresh this page.");
                   }

                 }
               }

            });
         }

      };

      // =================================
      //       main functions
      // =================================

      this.init = function() {
         var me = this;

         //var scriptPath = me.utility.getScriptPath();
         //this.urlHostPath = scriptPath.protocol + '://' + scriptPath.host + '/' + this.utility.dirname(scriptPath.path) + '/webApi';
         // 注意： 由於利用 jQuery 動態載入 utility functions，call stack 最後會是在 jQuery 函式，因此不能從 me.utility.getScriptPath() 取得 script URL
         let scheme = location.protocol.substr(0, location.protocol.length-1);
         if (scheme == 'file') this.urlHostPath = "https://docusky.org.tw/docusky/webApi";
         else this.urlHostPath = this.utility.dirname(me.utility.dirname(me.scriptPath + 'dummy')) + '/webApi';// e.g., http://localhost:8000/PHP5/DocuSky
         this.urlGetAllCategoryDataFilenamesJson =  this.urlHostPath + '/getAllCategoryDataFilenamesJson.php';
         this.urlGetCategoryDataFilenamesJson =  this.urlHostPath + '/getDataFilenamesUnderCatpathJson.php';
         this.urlSaveDataFileJson =  this.urlHostPath + '/saveDataFileByHttpPostJson.php';
         this.urlDeleteDataFileJson =  this.urlHostPath + '/deleteDataFileJson.php';
         this.urlLoadDataFileBinary = this.urlHostPath + '/getDataFileBinary.php';
         this.urlLogin = this.urlHostPath + '/userLoginJson.php';
         this.urlLogout = this.urlHostPath + '/userLogoutJson.php';
         this.username = '';

         this.uniqueId = this.utility.uniqueId();

         // login container
         var loginContainerId = this.idPrefix + "loginContainer" + this.uniqueId;
         var closeLoginContainerId = this.idPrefix + "closeLoginContainer" + this.uniqueId;
         var dsUsernameId = this.idPrefix + "dsUsername" + this.uniqueId;
         var dsPasswordId = this.idPrefix + "dsPassword" + this.uniqueId;
         var loginSubmitId = this.idPrefix + "loginSubmit" + this.uniqueId;
         var loginMessageId = this.idPrefix + "loginMessage" + this.uniqueId;

         var s = "<div id='" + loginContainerId + "' class='dsw-container'>"
               + "<div class='dsw-titleBar'><table><tr><td class='dsw-titleContainer'><div class='dsw-titlename'>DocuSky Login</div></td><td class='dsw-closeContainer' id='" + closeLoginContainerId + "'><div class='dsw-btn-close'>&#x2716;</div></td></tr></table></div>"
               + "<div class='dsw-containerContent'>"
               + "<table>"
               + "<tr><td class='dsw-td-dslogin dsw-logintitle'>Username:</td><td class='dsw-td-dslogin'><input type='text' class='dsw-userinput' id='" + dsUsernameId + "'/></td></tr>"
               + "<tr><td class='dsw-td-dslogin dsw-logintitle'>Password:</td><td class='dsw-td-dslogin'><input type='password' class='dsw-userinput' id='" + dsPasswordId + "'/></td></tr>"
               + "<tr><td colspan='2' class='dsw-td-dslogin dsw-loginsubmit'><button id='" + loginSubmitId + "'>登入</button></td></tr>"
               + "<tr><td colspan='2' class='dsw-loginmsg' id='" + loginMessageId + "'></td></tr>"
               + "</table>"
               + "</div>"
               + "</div>";
         $("html").append(s);
         $("#" + loginContainerId).hide();

         $("#" + loginSubmitId).click(function(e) {
            me.username = $("#" + dsUsernameId).val();
            $("#" + spanUsernameId).html(me.username);
            me.login(me.username, $("#" + dsPasswordId).val());
         });
         $("#" + closeLoginContainerId).click(function(e) {
            $("#" + loginContainerId).hide();
         });

         var filenameListContainerId = this.idPrefix + "filenameListContainer" + this.uniqueId;
         var spanUsernameId = this.idPrefix + "spanUsername" + this.uniqueId;
         var filenameListContentId = this.idPrefix + "filenameListContent" + this.uniqueId;
         var dataFilenameToUploadId = this.idPrefix + "dataFilenameToUpload" + this.uniqueId;
         var uploadFormId = this.idPrefix + "uploadForm" + this.uniqueId;
         var uploadDataFilenameSelectedId = this.idPrefix + "uploadDataFilenameSelected" + this.uniqueId;
         var uploadDataCategoryId = this.idPrefix + "uploadDataCategory" + this.uniqueId;
         var uploadDataPathId = this.idPrefix + "uploadDataPath" + this.uniqueId;
         var uploadFormSubmitId = this.idPrefix + "uploadFormSubmit" + this.uniqueId;
         var logoutAnchorId = this.idPrefix + "logoutAnchor" + this.uniqueId;
         var closefilenameListId = this.idPrefix + "closefilenameList" + this.uniqueId;
           var uploadProgressId = this.idPrefix + "uploadProgress" + this.uniqueId;	// 20170302

         // filenameListContainer container
         var t = "登出";
         var s = "<div id='" + filenameListContainerId + "' class='dsw-container'>"
               + "<div class='dsw-titleBar'>"
               + "<table><tr><td class='dsw-titleContainer'><div class='dsw-titlename'>DataFile List</div></td>"
               + "<td class='dsw-closeContainer'>" + "<div class='dsw-btn-close' id='" + closefilenameListId + "'>&#x2716;</div>" + "<span class='dsw-btn-logout' id='" + logoutAnchorId + "'>Logout</span>" + "<span class='dsw-useridContainer'><span class='dsw-userid' id='" + spanUsernameId + "'>" + this.username + "</span></span>" + "</td>" + "</tr></table>"
               + "</div>"
               + "<div id='" + filenameListContentId + "' class='dsw-containerContent'>"
               + "</div>"
               + "&nbsp;&nbsp;<button style='font-size:9pt' class='ui-button ui-widget ui-corner-all' onclick='showReferenceLayers(0)' type='button'><span class='ui-icon  ui-icon-document'></span>開啟公開圖層</button>"
               + "&nbsp;<button style='font-size:9pt' class='ui-button ui-widget ui-corner-all' onclick='showCSVupload()' type='button'><span class='ui-icon ui-icon-arrowthickstop-1-n'></span>上傳CSV/TSV</button>"
               + "&nbsp;<button style='font-size:9pt' class='ui-button ui-widget ui-corner-all' id='layersJoin' onclick='layerJoin($(\"input:checked[name=layerCheckbox]\"))' type='button'><span class='ui-icon ui-icon-newwin'></span>結合2圖層</button>"
               + "&nbsp;<button style='font-size:9pt' class='ui-button ui-widget ui-corner-all' id='changeJsonFileNameBtn' onclick='changeJsonFileName()' type='button'><span class='ui-icon ui-icon-grip-dotted-vertical'></span>重新命名</button>"
			   + "&nbsp;<a target='_blank' style='font-size:9pt' class='ui-button ui-widget ui-corner-all'  href='api/convertTools.html'><span class='ui-icon ui-icon-seek-next'></span>l轉換工具</a><br/> "
               + "&nbsp;&nbsp;<input type='checkbox' disabled='disabled' />顯示多個圖層 / <button style='font-size:9pt' class='ui-button ui-widget ui-corner-all'><span class='ui-icon ui-icon-calculator'></span>🔍</button> 儲存樣式與顯示屬性表格"
               + "<hr width='96%'/>"
               + "<div id='" + dataFilenameToUploadId + "' class='dsw-containerContent'>"
               + "<form id='" + uploadFormId + "' name='uploadForm'>"
               + "<div>上載單份JSON資料檔：<input type='file' id='" + uploadDataFilenameSelectedId + "' name='importedFiles[]'></input></div>"
               + "<table class='dsw-uploadfile'>"
               + "<tr><td>指定欲儲存的位置：</td>"
               + "<td>類別：<input type='text' class='dsw-userinput' id='" + uploadDataCategoryId + "' name='uploadDataCategory' value='gis'></input></td>"
               + "<td>路徑：<input type='text' class='dsw-userinput' id='" + uploadDataPathId + "' name='uploadDataPath' size='20' value='web'></input></td>"
               + "</tr><tr>"
               + "<td colspan='2'><div class='dsw-uploadprogressbar' id='" + uploadProgressId + "'><div class='dsw-uploadprogressbar-progress'></div></div></td>"
               + "<td align='right'><button id='" + uploadFormSubmitId + "'>開始上傳</button></td></tr>"
               + "</table>"
               + "</div>"
               + "</form></div>";
               + "</div>";
         $("html").append(s);
         $("#" + filenameListContainerId).hide();

         $("#" + logoutAnchorId).click(function(e) {
            var me2 = me;
            e.preventDefault();
            $.ajaxSetup({xhrFields: {withCredentials: true}});
            $.get(me.urlLogout, function(jsonObj) {
               var filenameListContainerId = me2.idPrefix + "filenameListContainer" + me2.uniqueId;
               if (jsonObj.code == 0) {         // successfully logged out
                  $("#" + filenameListContainerId).fadeOut();
                  alert("Successfully logged out");
               }
               else {
                  $("#" + filenameListContainerId).fadeout();
                  alert(jsonObj.code + ': ' + jsonObj.message);
               }
            }, 'json');
         });

         $("#" + closefilenameListId).click(function(e) {
            $("#" + filenameListContainerId).hide();
         });

         $("#" + uploadFormSubmitId).click(function(e) {
            e.preventDefault();             // 2016-05-05: 非常重要，否則會出現 out of memory 的 uncaught exception
            var url = me.urlSaveDataFileJson;

            var uploadDataCategoryId = me.idPrefix + "uploadDataCategory" + me.uniqueId;
            var uploadDataPath = me.idPrefix + "uploadDataPath" + me.uniqueId;

            var fd = new FormData();
            fd.append('uploadDataCategory', $("#" + uploadDataCategoryId).val());
            fd.append('uploadDataPath', $("#" + uploadDataPathId).val());
            fd.append('uploadDataFilename', me.fileName);
            var bytes = new Uint8Array(me.fileData.length);
            for (var i=0; i<me.fileData.length; i++) bytes[i] = me.fileData.charCodeAt(i);
            var blob = new Blob([bytes]);
            //alert(me.fileData.length + ':' + blob.size);
            fd.append('importedFiles[]', blob);
            me.uploadBlob(url, fd, true, null);       // true: enable dialog display

            //// HTTP POST with multipart -- but, XmlHttp has some restrictions on sending binary data!
            //var formData = $("#uploadForm").serializeArray();
            //var nameVal = $("#uploadDataFilenameSelected").attr("name");     // <input type="file" name="...">
            //formData.file = {value: me.fileData, filename: me.fileName, name:nameVal};
            //me.uploadMultipart(url, formData);
         });

         this.initialized = true;
      };

      this.login = function(username, password, succFunc, failFunc) {
         var me = this;
         //$.ajaxSetup({async:false});
         var postdata = { dsUname: username, dsPword: password };     // camel style: to get dbCorpusDocuments
         $.post(this.urlLogin, postdata, function(jsonObj) {
            var me2 = me;
            var loginMessageId = me2.idPrefix + "loginMessage" + me2.uniqueId;
            var loginContainerId = me2.idPrefix + "loginContainer" + me2.uniqueId;
            //me.utility.displayJson(jsonObj);
            if (jsonObj.code == 0) {         // successfully login
              $("#" + loginMessageId).empty();    // 成功登入，清除（先前可能有的）訊息
              $("#" + loginContainerId).fadeOut();
              if (typeof succFunc === 'function') succFunc(jsonObj.message);    // 2019-05-09
              else me.manageDataFileList(me.callerEvent, me.callerCallback);
            }
            else if (jsonObj.code == 101) ;     // Requires login
            else {
               console.error("Login Error");
               if (typeof failFunc === 'function'){
                 failFunc(jsonObj);
               }
               else if(typeof me.Error === "function"){
                 docuskyManageDataFileListSimpleUI.Error("Login Error");
               }
               else {
                 $("#" + loginMessageId).html(jsonObj.code + ': ' + jsonObj.message);
               }
            }
         }, 'json');
         //$.ajaxSetup({async:true});
      };

      // 繪製 DataFileList 的表格
      this.displayFilenameList = function() {     // category => filelist
         var me = this;
         var categoryFilenameList = this.categoryFilenameList;
         //alert(JSON.stringify(categoryFilenameList, null, '\t'));

         var contentTableId = this.idPrefix + "contentTable" + this.uniqueId;
         var filenameListContentId = this.idPrefix + "filenameListContent" + this.uniqueId;
         var uploadDataFilenameSelectedId = this.idPrefix + "uploadDataFilenameSelected" + this.uniqueId;

         var s = "<table  style='font-size:11pt' class='dsw-filenameList' id='" + contentTableId + "'>";
         //s += "<tr><td colspan='6'><button onclick='showCSVupload()' type='button'>Upload CSV</button>  <button id='layersJoin' onclick='layerJoin($(\"input:checked[name=layerCheckbox]\"))' type='button'>Join 2 layers</button> <button id='clearAllLayersBtn' onclick='clearAllLayers()' type='button'>Clear All Layers</button>   <br/> [Checkbox] for viewing layer / 🔍 for saving style and showing table.<td><tr>";
         s +="<tr><th></th><th>category</th><th align='center'>path/Date_DB_Corpus</th><th>套疊</th><th align='center'>樣式(Shape-Color-Size)</th><th>屬性表格/儲存樣式</th><th>下載json</th><th>刪除</th></tr>"
         var itemNumber = 0;
         for (var category in categoryFilenameList) {
            var pathfiles = categoryFilenameList[category];
            for (var i=0; i<pathfiles.length; i++) {
               itemNumber++;
               var pathfile = pathfiles[i];
               var categoryEncoded = encodeURIComponent(category);       // 20170707
               var pathfileEncoded = encodeURIComponent(pathfile);       // 20170707
               var iconID=pathfile.replace("web/","").replace(/-/g,"_").replace(/\)/g,"_").replace(/\(/g,"_").replace(".json","");//.split("_")[0];
               var dir=pathfile.split("/")[0];
               if (category==='gis') {
                     s += "<tr><td class='dsw-filenameList-id'>" + itemNumber + ".</td>"
                     + "<td  align='center' class='dsw-filenameList-category' title='" + category + "'>" + category + "</td>"
                     + "<td class='dsw-filenameList-path' title='" + pathfile + "'>" + removeStyleFromFileName(pathfile) + "</td>"
                     + "<td class='dsw-filenameList-layerCheckbox'>"
                     if (dir==="web") {
                        s+= "<input type='checkbox' name='layerCheckbox' title='套疊多個圖層' class='layerCheckbox' onclick='layerToggle(this.value,this.checked)'  value='" + category + "/" + pathfile + "'>"
                     } else {
                        s+= "<input type='checkbox' name='layerCheckbox' title='select this layer' class='layerCheckbox'  value='" + category + "/" + pathfile + "'>"
                     }
                     s+= "</td>"
                     + "<td class='dsw-filenameList-layerStyle'>"
                     if (dir==="web") {
                     s +=  '   <span id="icon' + iconID + '"  title="' + pathfile + '" class="iconStyle"><img src="leaflet/images/marker-icon.png" width="10"></span>'
                     + '   <select id="shapeSelector' + iconID + '" class="iconSelect" onchange="resetIconStyle(\'' + iconID  + '\', $(this).find(\'option:selected\').text() )">'
                     + '   <option value="default" >default</option>'
                     + '   <option value="⬤">⬤</option>'
                     + '   <option value="◎">◎</option>'
                     + '   <option value="◉">◉</option>'
                     + '   <option value="▣">▣</option>'
                     + '   <option value="▇">▇</option>'
                     + '   <option value="▲">▲</option>'
                     + '   <option value="△">△</option>'
                     + '   <option value="▼">▼</option>'
                     + '   <option value="▽">▽</option>'
                     + '   <option value="★">★</option>'
                     + '   <option value="✪">✪</option>'
                     + '   <option value="✦">✦</option>'
                     + '   <option value="✱">✱</option>'
                     + '   <option value="⊛">⊛</option>'
                     + '   <option value="♥">♥</option>'
                     + '   <option value="◆">◆</option>'
                     + '   <option value="◈">◈</option>'
                     + '   <option value="◊">◊</option>'
                     + '   <option value="⬟">⬟</option>'
                     + '   <option value="✿">✿</option>'
                     + '   <option value="♝">♝</option>'
                     + '   <option value="♚">♚</option>'
                     + '   <option value="☻">☻</option>'
                     + '   <option value="⚑">⚑</option>'
                     + '   <option value="☗">☗</option>'
                     + '   <option value="♣">♣</option>'
                     + '   <option value="☺">☺</option>'
                     + '   <option value="👍">👍</option>'
                     + '   </select>'
                     + '   <select id="colorSelector' + iconID + '"  class="iconSelect" onchange="resetIconStyle(\'' + iconID  + '\', $(\'#shapeSelector' + iconID + '\').find(\'option:selected\').text() )">'
                     + '   <option value="FF3355">Red</option>'
                     + '   <option value="8B0000">DarkRed</option>'
                     + '   <option value="FF4500">OrangeRed</option>'
                     + '   <option value="FF6347">Tomato</option>'
                     + '   <option value="FF7F50">Coral</option>'
                     + '   <option value="DC143C">Crimson</option>'
                     + '   <option value="FFA500">Orange</option>'
                     + '   <option value="008000">Green</option>'
                     + '   <option value="ADFF2F">GreenYellow</option>'
                     + '   <option value="90EE90">LightGreen</option>'
                     + '   <option value="20B2AA">LightSeaGreen</option>'
                     + '   <option value="7CFC00">LawnGreen</option>'
                     + '   <option value="00FF7F">SpringGreen</option>'
                     + '   <option value="87CEFA">LightSkyBlue</option>'
                     + '   <option value="000080">Navy</option>'
                     + '   <option value="3366FF" selected="selected">Blue</option>'
                     + '   <option value="00BFFF">DeepSkyBlue</option>'
                     + '   <option value="1E90FF">DodgerBlue</option>'
                     + '   <option value="9ACD32">YellowGreen</option>'
                     + '   <option value="FFFF00">Yellow</option>'
                     + '   <option value="F5F5F5">WhiteSmoke</option>'
                     + '   <option value="FFFFFF">White</option>'
                     + '   <option value="AAAAAA">Gray</option>'
                     + '   <option value="2F4F4F">DarkSlateGray</option>'
                     + '   <option value="8B008B">DarkMagenta</option>'
                     + '   <option value="000000">Black</option>'
                     + '   </select>'
                     + '   <select id="sizeSelector' + iconID + '"  class="iconSelect" onchange="resetIconStyle(\'' + iconID  + '\', $(\'#shapeSelector' + iconID + '\').find(\'option:selected\').text() )">'
                     + '   <option value="5">5</option>'
                     + '   <option value="6">6</option>'
                     + '   <option value="7">7</option>'
                     + '   <option value="8" selected="selected">8</option>'
                     + '   <option value="9">9</option>'
                     + '   <option value="10">10</option>'
                     + '   <option value="11">11</option>'
                     + '   <option value="12">12</option>'
                     + '   <option value="13">13</option>'
                     + '   <option value="14">14</option>'
                     + '   <option value="15">15</option>'
                     + '   <option value="16">16</option>'
                     + '   <option value="17">17</option>'
                     + '   <option value="18">18</option>'
                     + '   <option value="19">19</option>'
                     + '   <option value="20">20</option>'
                     + '   <option value="25">25</option>'
                     + '   <option value="30">30</option>'
                     + '   </select>'
                        }
                     s +=  "</td>"
                     + "<td class='dsw-filenameList-showOnMap' align='center'>"
                     if (dir==="web") {
                        s +="<a class='findDataOnMap' style='text-decoration:none;' href='" + me.urlLoadDataFileBinary + "?catpathfile=" + category + "/" + pathfile + "' onclick='saveStyle(this.href, \"" + iconID + "\");' title='搜尋屬性資料 及 儲存樣式'><button type='button' style='cursor:pointer;'><span class='ui-icon ui-icon-calculator'></span>🔍</button></a>"
                     } else if (dir==="wmts"){
                        s +="<button type='button' style='cursor:pointer;' onclick='loadPanelLayer(\"" + pathfile.split("/")[1] + "\")' title='Load WMTS Layers'><span class='ui-icon ui-icon-folder-collapsed'></span></button>"
                     }
                     s +="</td>"
                     + "<td class='dsw-filenameList-download'><a class='downloadFile'  style='text-decoration:none;' target='DataFileDownload' href='" + me.urlLoadDataFileBinary + "?catpathfile=" + categoryEncoded + "/" + pathfileEncoded + "' title='json file'><span class='ui-icon ui-icon-arrowthickstop-1-s'></span></a></td>"
                     + "<td class='dsw-filenameList-delete'><a class='deleteFile'  style='text-decoration:none;' href='" + me.urlDeleteDataFileJson + "?category=" + categoryEncoded + "&pathfile=" + pathfileEncoded + "'  title='Delete this layer'><span class='ui-icon ui-icon-trash'></span></td>";
                     + "</tr>";
                  }
            }
         }

         s += "</table>";

         //<button id='csvConvert2JSON' onclick='csv2JsonLayer($(\"input:checked[name=layerCheckbox]\"))' type='button'>CSV to JSON</button>

         $("#" + filenameListContentId).html(s);
         // $("#" + filenameListContentId).width(720);  // 2017/02/22

         var h = $("#" + contentTableId).height();
         $("#" + filenameListContentId).height(Math.min(280,Math.max(h,50)));

         $("#" + uploadDataFilenameSelectedId).change(function(e) {
            // Currently only support one file upload
            var files = this.files;
            me.fileName = files[0].name;
            me.readFile(files[0]).done(function(fileData){
               me.fileData = fileData;
               //alert(me.fileData.length);
            });
            //me.urlSaveDataFileJson
         });


         //===================
         loadStyleSetting();

         $(".deleteFile").click(function(e) {
            clearAllLayers();
            var me2 = me;
            e.preventDefault();
            $.ajaxSetup({xhrFields: {withCredentials: true}});
            $.get(this.href, function(jsonObj) {
               var filenameListContainerId = me2.idPrefix + "filenameListContainer" + me2.uniqueId;
               $("#" + filenameListContainerId).fadeOut();
               //me2.utility.displayJson(jsonObj);
               if (jsonObj.code == 0) {         // successfully logged out
                  alert("Successfully deleted");
               }
               else {
                  alert(jsonObj.code + ': ' + jsonObj.message);
               }
            }, 'json');
         });

         $( "input[name=layerCheckbox]").on("click", function() {
               // if ($("input:checked[name=layerCheckbox]").length>2) {
               //      $(this).prop('checked', false);
               // 		alert('Select 2 Layers');
               //       //$("input:checked[name=layerCheckbox]")[2].prop('checked', false);
               // }
               // //console.log($("input:checked[name=layerCheckbox]" ).length);

                 // $("input:checked[name=layerCheckbox]").val()


         } );

          $(".findDataOnMap").click(function(e) {
               //console.log(this.href);
               //http://docusky.org.tw/docusky/webApi/getDataFileBinary.php?catpathfile=gis/web/20170419-142549-Liexianzhuan0409-35.json
               var u=this.href.split('/');
               //console.log(decodeURIComponent(u[u.length-1].replace(".json","")));
               readDocuSkyJSON(decodeURIComponent(u[u.length-1].replace(".json","")));
               var me2 = me;
               var filenameListContainerId = me2.idPrefix + "filenameListContainer" + me2.uniqueId;
               $("#" + filenameListContainerId).fadeOut();
               e.preventDefault();
         });
      }

      // 顯示 DataFileList 的 container
      this.manageDataFileList = function(evt, succFunc, failFunc) {
         if (!this.initialized) this.init();

         this.callerEvent = evt;
         this.callerCallback = succFunc;
         this.loginCallback = this.getDbCorpusDocuments;

         var me = this;
         // 決定顯示的位置
         var winWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
         // winWidth = $('body').innerWidth();
         // var scrollbarWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - Local.winWidth;
         var winHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

         //$.ajaxSetup({async:false});
         $.ajaxSetup({xhrFields: {withCredentials: true}});
         $.get(this.urlGetAllCategoryDataFilenamesJson, function(data) {
            var filenameListContainerId = me.idPrefix + "filenameListContainer" + me.uniqueId;
            var loginContainerId = me.idPrefix + "loginContainer" + me.uniqueId;
            if (data.code == 0) {          // successfully get db list
               var jelement = $("#" + filenameListContainerId);
               var w = jelement.width();
               var h = jelement.height();
                     //console.log(w,h);
               var overX = Math.max(0, evt.pageX - 40 + w - winWidth);     // 超過右側邊界多少 pixels
               var posLeft = Math.max(10, evt.pageX - overX - 40);
               var overY = Math.max(0, evt.pageY + h + 15 - winHeight);    // 超過下方邊界多少 pixels
               var posTop = Math.min(winHeight - overY - 15, evt.pageY + 15);
                     //console.log(posTop,posLeft);
                     if (posLeft>560) {posLeft=posLeft-560;}
               jelement.css({ top: posTop + 'px', left: posLeft-10 + 'px' });
               jelement.show();
               me.categoryFilenameList = data.message;
               me.displayFilenameList();
               //me.filenameList = data.message.filenameList;
               //me.callerCallback();
               if (typeof me.callerCallback === "function") me.callerCallback();
            }
            else if (data.code == 101) {             // requires login
               var jelement = $("#" + loginContainerId);
               var w = jelement.width();
               var h = jelement.height();
               var overX = Math.max(0, evt.pageX - 40 + w - winWidth);     // 超過右側邊界多少 pixels
               var posLeft = Math.max(10, evt.pageX - overX - 40);
               var overY = Math.max(0, evt.pageY + h + 15 - winHeight);    // 超過下方邊界多少 pixels
               var posTop = Math.min(winHeight - overY - 15, evt.pageY + 15);
               jelement.css({ top: posTop + 'px', left: posLeft + 'px' });
               jelement.show();
            }
            else {
                console.error("Server Error");
                if (typeof failFunc === "function") {
                   failFunc();
                }
                else if(typeof me.Error === "function"){
                   me.Error("Server Error");
                }
                else{
                  alert("Error: " + data.code + "\n" + data.message);
                }
            }
         }, 'json')
         .fail(function (jqXHR, textStatus, errorThrown){
             if (jqXHR.status=="200") {          // 2019-05-07: server return not correct json
                alert("Server response seems not a valid JSON");
                return;
             }
             if(jqXHR.status=="404" || jqXHR.status=="403"){
               console.error("Server Error");
             }
             else{
               console.error("Connection Error");
             }

            if (typeof failFunc === "function") {
               failFunc();
            }
            else if(typeof me.Error === "function"){
               if(jqXHR.status=="404" || jqXHR.status=="403"){
                 me.Error("Server Error");
               }
               else{
                 me.Error("Connection Error");
               }

            }
            else{

             if(jqXHR.status=="404" || jqXHR.status=="403"){
                alert("Server Error");
             }else{
               if(me.presentRetryCount < me.maxRetryCount){
                 me.presentRetryCount++;
                 alert("Connection Error");
                 let retry = function(){
                   me.manageDataFileList(evt, succFunc, failFunc);
                 }
                 setTimeout(retry,3000);
               }
               else{
                 alert("Please check your Internet connection and refresh this page.");
               }
             }

            }

         });
         //$.ajaxSetup({async:true});

      };

      // for multipart file upload
      this.readFile = function(file) {
         var loader = new FileReader();
         var def = $.Deferred(), promise = def.promise();

         //--- provide classic deferred interface
         loader.onload = function (e) { def.resolve(e.target.result); };
         loader.onprogress = loader.onloadstart = function (e) { def.notify(e); };
         loader.onerror = loader.onabort = function (e) { def.reject(e); };
         promise.abort = function () { return loader.abort.apply(loader, arguments); };

         loader.readAsBinaryString(file);
         //loader.readAsText(file,'UTF-8');         // 若內容為 UTF8 編碼，則不能用 binary 讀入（會變成亂碼？）

         return promise;
      };

      this.uploadBlob = function(url, fData, displayDialog, succFunc, failFunc) {
         var me = this;
         var uploadCompleteDialog = displayDialog;
         var uploadCallback = succFunc;             // 2016-08-17: by PyKenny
         var uploadProgressId = this.idPrefix + "uploadProgress" + this.uniqueId;
         $.ajax({
           url: url,
           data: fData,
           processData: false,      // tell jquery not to process data
           timeout: me.maxResponseTimeout,
           type: "post",
            //async: false,          // not supported in CORS (Cross-Domain Resource Sharing)
            contentType: false,      // set false to let jquery specify multipart parameter
            xhr: function() {
               var xhr = $.ajaxSettings.xhr();
               xhr.upload.addEventListener("progress", function(evt) {   // upload progress
                  if (evt.lengthComputable) {
                     var position = evt.loaded || evt.position;
                     var percentComplete_f = position / evt.total * 100;	// 20170302
                     var percentComplete_i = Math.ceil(percentComplete_f);	// 20170302

                     var r = (percentComplete_i == 100) ? ' ... waiting for server response' : '';
                     $("#" + uploadProgressId + " .dsw-uploadprogressbar-progress").text(percentComplete_i + '%' + r).css("width", percentComplete_f + "%");	// 20170302
                  }
                  if(typeof me.uploadProgressFunc === 'function') me.uploadProgressFunc(percentComplete_i);
               }, false);     // true: event captured in capturing phase, false: bubbling phase
               // xhr.addEventListener("progress", function(evt){           // download progress
               //    if (evt.lengthComputable) {
               //       var percentComplete = evt.loaded / evt.total;
               //       //Do something with download progress
               //    }
               //}, false);
               return xhr;
            },
            success: function(data, status, xhr) {
               if (data.code == 0) {          // successfully get db list
                  //alert(data.message);
                  // refresh data file list
                  if (me.callerEvent != null && uploadCompleteDialog == true) {
                     me.manageDataFileList(me.callerEvent, me.callerCallback);
                  }
                  else {     // 2016-08-12: v0.02
                     if (typeof uploadCallback === 'function'){
                        uploadCallback(data);
                             }
                  }
               }
               else {	// error occurs in docusky

                   console.error("Server Error");
                   if (typeof failFunc === 'function'){
                        failFunc(data);
                  }
                   else if(typeof me.Error === "function"){
                      me.Error("Server Error");
                   }
                   else{
                     alert("Error: " + data.code + "\n" + data.message);
                   }
               }
               $("#" + uploadProgressId).hide();	// 20170302
            },
            error: function(xhr, status, error) {	// error occurs in ajax request
               $("#" + uploadProgressId).hide();	// 20170302
               console.error("Connection Error");
               if (typeof failFunc === "function") {
                 failFunc(error);
               }
               else if(typeof me.Error === "function"){
                 me.Error("Connection Error");
               }
               else{
                 if(me.presentRetryCount < me.maxRetryCount){
                   me.presentRetryCount++;
                   alert("Connection Error");
                   let retry = function(){
                     me.uploadBlob(url, fData, displayDialog, succFunc, failFunc);
                   }
                   setTimeout(retry,3000);
                 }
                 else{
                   alert("Please check your Internet connection and refresh this page.");
                 }
               }
            }
         });
           $("#" + uploadProgressId).find(".dsw-uploadprogressbar-progress").text("").css("width", "0%").end().show();	// 20170302
      };

      this.uploadMultipart = function(url, data, succFunc, failFunc) {
         var me = this;
         var mul = me.buildMultipart(data);
         //alert(mul.data);
         $.ajax({
            url: url,
            data: mul.data,
            processData: false,      // tell jquery not to process data
            timeout: me.maxResponseTimeout,
            type: "post",
            //async: false,          // not supported in CORS (Cross-Domain Resource Sharing)
            contentType: "multipart/form-data; boundary="+mul.myBoundary,
            success: function(data, status, xhr) {
               if (data.code == 0) {          // successfully get db list
                  alert(data.message);
               }
               else {

                 if (typeof succFunc === 'function'){
                    succFunc(data);
                  }else{
                    alert("Upload Error: " + data.code + "\n" + data.message);
                  }
               }
            },
            error: function(xhr, status, error) {	// error occurs in ajax request

               console.error("Connection Error");
               if (typeof failFunc === "function") {
                 failFunc(error);
               }
               else if(typeof me.Error === "function"){
                 me.Error("Connection Error");
               }
               else{
                 if(me.presentRetryCount < me.maxRetryCount){
                   me.presentRetryCount++;
                   alert("Connection Error");
                   let retry = function(){
                     me.uploadMultipart(url, data, succFunc, failFunc);
                   }
                   setTimeout(retry,3000);
                 }
                 else{
                   alert("Please check your Internet connection and refresh this page.");
                 }
               }
            }
         });
      };

      this.buildMultipart = function(data) {
         var key, crunks = [], myBoundary;
         myBoundary = $.md5 ? $.md5(new Date().valueOf()) : (new Date().valueOf());
         //while (!bound) {
         //   bound = $.md5 ? $.md5(new Date().valueOf()) : (new Date().valueOf());
         //   for (key in data) if (~data[key].indexOf(bound)) { bound = false; continue; }
         //}
         myBoundary = '(-----------docusky:' + myBoundary + ')';

         for (var key in data){
            if (key == "file") {
               crunks.push("--"+myBoundary+"\r\n"+
                  "Content-Disposition: form-data; name=\""+data[key].name+"\"; filename=\""+data[key].filename+"\"\r\n"+
                  "Content-Type: application/octet-stream\r\n"+
                  "Content-Transfer-Encoding: binary\r\n\r\n"+
                  data[key].value);
            }
            else{
               crunks.push("--"+myBoundary+"\r\n"+
                  "Content-Disposition: form-data; name=\""+data[key].name+"\"\r\n\r\n"+
                  data[key].value);
            }
         }

         return {
            myBoundary: myBoundary,
            data: crunks.join("\r\n")+"\r\n--"+myBoundary+"--"
         };
      };

      // 動態載入 utility functions
      this.scriptPath = new Error().stack.match(/(((?:http[s]?)|(?:file)):\/\/[\/]?([^\/]+)\/((.+)\/)?)([^\/]+\.js):/)[1];
      this.utility = docuskyWidgetUtilityFunctions;
      if (!this.initialized) this.init();

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
      //      var pathParts = "http://docusky.org.tw/docusky/js.ui/docusky.widget.utilityFunctions.js";
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
   + 'table.dsw-filenameList { border: 1px solid #A0A0A0;width: 100%; margin-right: 16px; border-collapse: collapse; border-spacing: 0; line-height: 1.25; }'
               + '.dsw-filenameList tr:nth-child(even) {    background-color: #ccffff;border-bottom:1px solid #AAAAAA; }'
               + '.dsw-filenameList tr:nth-child(odd) {    background-color: #fff;;border-bottom:1px solid #AAAAAA; }'
               + '.dsw-filenameList tr:hover {background-color: #ffe5e5;}'
			   + '.dsw-filenameList th { font-size:9pt;background-color:#585858;color: white; }'
			   + '.dsw-filenameList td { padding: 0.25rem; vertical-align: top; white-space: nowrap; }'
   + '.dsw-filenameList-id { text-align: right; }'
   + '.dsw-filename-download,.dsw-filename.delete { text-align: center; }'
   + '.dsw-filenameList-category,.dsw-filenameList-path { text-align: left; overflow-x: hidden; text-overflow: ellipsis; }'
   + '.dsw-filenameList-id {}'	// Let ID automatically adjust width
   + '.dsw-filenameList-download,.dsw-filenameList-delete { width: 45px; max-width: 45px; text-align: center; }'
   + '.dsw-filenameList-category { font-weight: bold; min-width: 20px; max-width: 50px; }'
   + '.dsw-filenameList-path { min-width: 150px; max-width: 400px;white-space:nowrap; }'
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

   function removeStyleFromFileName(fn){

         return fn.split("_style")[0].replace(".json","").replace(".js","")
   }

   // ----------------------------------------------------------------------------------
   // initialize widget
   var docuskyManageDataFileListSimpleUI = new ClsDocuskyManageDataFileListSimpleUI();

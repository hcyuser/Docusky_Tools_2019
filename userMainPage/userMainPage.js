var docuSkyObj = null;
var docuskyJson = null;
var JsonData = null;
var tmp = {};
var formData = [];

$(document).ready( function () {
    docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
    docuskyJson = docuskyManageDataFileListSimpleUI;

    let param = {
                target: 'USER',
                db: docuSkyObj.db,
                corpus: '[ALL]',
                query: '.all',
                page: docuSkyObj.page, // current page
                pageSize: docuSkyObj.pageSize
            };
    docuSkyObj.getQueryResultDocuments(param, null, null);
    $("body").hover(function() {
        if($("#CorpusDoc_dbCorpusListContainer_0").is(":visible")){
          docuSkyObj.hideWidget(true);
        }

    });
    $('#DocManageTable').DataTable();
    $('#GISManageTable').DataTable();
    GetCorpus();
    GetJson();
} );

function GetCorpus(){

  $.ajax({
     type: 'GET',
     url: `https://docusky.org.tw/DocuSky/webApi/getDbCorpusListJson.php`,
     dataType: 'json',
     success: function (data) {
        let AllCorpus = data.message;
        //console.log(AllCorpus);
        PrintDocManageTable(AllCorpus);
     },
     error: function(response){
          console.log(response.responseText);
        }
    });
}
function  PrintDocManageTable(AllCorpus){
  let CorpusGroup = {}, DBStatus = {}, DBTime = {};
  let TablePrefix = `<thead>
  <tr>
  <th>資料庫名稱</th>
  <th>資料庫的文獻集</th>
  <th>狀態</th>
  <th>建立時間</th>
  <th>動作</th>
  </tr>
  </thead>
  <tbody>`;
  for( Corpus in AllCorpus ){
      let now = AllCorpus[ Corpus ];
      if( now.db in CorpusGroup )
          CorpusGroup[ now.db ].push( now.corpus );
      else
          CorpusGroup[ now.db ] = [ now.corpus ];
      DBStatus[ now.db ] = now.dbStatus;
      DBTime[now.db] = now.timeCreated;
  }
  let status = [ 'OK', '建置中', '建置中', '建置中', '刪除中']
  for(DB in CorpusGroup){
    TablePrefix += `<tr><td>` + DB + `</td><td>`
                + CorpusGroup[ DB ].join( '<br>' ) + `</td><td>`
                + status[DBStatus[ DB ]] + `</td><td>`
                + DBTime[DB] + `</td>`;

    TablePrefix += `<td>刪除 下載</td></tr>`;
  }
  $('#DocManageTable').DataTable().destroy();
  $("#DocManageTable").html(TablePrefix + `</tbody>`);
  $('#DocManageTable').DataTable({
      paging:true,
      searching:true,
      info:true
   });

}

function GetJson(){
  $.ajax({
     type: 'GET',
     url: `http://docusky.org.tw/docusky/webApi/getAllCategoryDataFilenamesJson.php`,
     dataType: 'json',
     success: function (data) {
        JsonData = data.message;
        PrintJsonData(JsonData);
     },
     error: function(response){
          console.log(response.responseText);
        }
  });

}

function PrintJsonData(JsonData){
  let TablePrefix = `<thead>
  <tr>
  <th>種類</th>
  <th>路徑</th>
  <th>檔名</th>
  <th>動作</th>
  </tr>
  </thead>
  <tbody>`;
  for(catgory in JsonData){
   JsonData[catgory].forEach(function(item, index){
     item  = item.split("/");
     //alert(item[0]+" "+ item[1]);
    TablePrefix += `<tr><td>` + catgory + `</td><td>` + item[0] + `</td><td>` + item[1] + `</td>` + `<td><button type="button" onclick="renameJsonDialogContent('`+catgory+`', '`+item[0]+`', '`+item[1]+`');">重新命名</button>`
    +`<button type="button" onclick="deleteJson('`+catgory+`', '`+item[0]+`', '`+item[1]+`')">刪除</button> 下載</td></tr>`;
    });

  }
  $('#JsonManageTable').DataTable().destroy();
  $("#JsonManageTable").html(TablePrefix + `</tbody>`);
  $('#JsonManageTable').DataTable({
      paging:true,
      searching:true,
      info:true
   });

}

function UploadXMLFile(){
  let fileSizeLimit = "120" * 1024 * 1024;  // upload size limit -- 需配合 uploadXmlFilesToBuildDbJson.php 的設定

  // Currently only support one file upload

  var files = $("#UploadXmlFileId").get(0).files;
  tmp.fileName = files[0].name;
  tmp.fileSize = files[0].size;
  if (tmp.fileSize > fileSizeLimit) {
      alert("Error: \n" +
          "The size of " + tmp.fileName + " (" + tmp.fileSize + ") exceeds upload limit\n" +
          "Upload limit size: " + fileSizeLimit);
      tmp.fileData = '';               // if upload empty string, DocuSky will return 'invalid XML' message
      return;
  }
  readFile(files[0]).done(function(fileData){
      tmp.fileData = fileData;
  });

}

var readFile = function(file){
    var loader = new FileReader();
    var def = $.Deferred(), promise = def.promise();

    //--- provide classic deferred interface
    loader.onload = function (e) { def.resolve(e.target.result); };
    loader.onprogress = loader.onloadstart = function (e) { def.notify(e); };
    loader.onerror = loader.onabort = function (e) { def.reject(e); };
    promise.abort = function () { return loader.abort.apply(loader, arguments); };

    //loader.readAsBinaryString(file);
    loader.readAsText(file,'UTF-8');         // 不能用 binary 讀入，會變成亂碼
    return promise;
};

function UploadXMLBTN(event){
  event.preventDefault();             // 2016-05-05: 非常重要，否則會出現 out of memory 的 uncaught exception
  var url = 'http://docusky.org.tw/DocuSky/webApi/uploadXmlFilesToBuildDbJson.php';
  formData = [];
  formData[0] = {};
  formData[0]["name"] = "dbTitleForImport";
  formData[0]["value"] = $.trim($("#UploadDBName").val());
  let nameVal = "importedFiles[]";
  formData.file = {value: tmp.fileData, filename: tmp.fileName, name:nameVal};
  //console.log(formData);
  uploadMultipart(url, formData);

}

var uploadMultipart = function(url, data) {
        var mul = buildMultipart(data);
        $.ajax({
            url: url,
            data: mul.data,
            processData: false,
            type: "post",
            //async: false,          // not supported in CORS (Cross-Domain Resource Sharing)
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
                        $("#" + uploadProgressId + " .ds-uploadprogressbar-progress").text(percentComplete_i + '%' + r).css("width", percentComplete_f + "%");	// 20170302
                        //$("#" + uploadProgressId).text(percentComplete_i + '%' + r);
                    }
                }, false);     // true: event captured in capturing phase, false: bubbling phase
                return xhr;
            },
            success: function(data, status, xhr) {
                if (data.code == 0) {              // successfully get db list
                    alert(data.message);
                }
                else {
                    alert("Error: " + data.code + '\n' + data.message);
                }
            },
            error: function(xhr, status, error) {
                //var err = eval("(" + xhr.responseText + ")");
                alert(error);
            }
        });

    };

    var buildMultipart = function(data) {
        var key, crunks = [], myBoundary;
        myBoundary = $.md5 ? $.md5(new Date().valueOf()) : (new Date().valueOf());
        myBoundary = '(-----------docusky:' + myBoundary + ')';

        for (var key in data){
            if (key == "file") {
                crunks.push("--" + myBoundary + '\r\n' +
                    "Content-Disposition: form-data; name='" + data[key].name + "'; filename='" + data[key].filename + "'" + '\r\n' +
                    'Content-Type: application/octet-stream\r\n' +
                    'Content-Transfer-Encoding: binary\r\n\r\n' +
                    data[key].value);
            }
            else{
                crunks.push("--" + myBoundary + '\r\n' +
                    "Content-Disposition: form-data; name='" +
                    data[key].name + "'" +
                    '\r\n\r\n' +
                    data[key].value);
            }
        }

        return {
            myBoundary: myBoundary,
            data: crunks.join('\r\n') + '\r\n--' + myBoundary + "--"
        };
    };

function UploadJson(event){
  event.preventDefault();
  let transporter = docuskyJson.jsonTransporter;
  readJsonFile($("#UploadJsonFileId").get(0).files[0]).done(function(fileData){
      transporter.storeJson($("#JsonCatgory").val(), $("#JsondataPath").val(), $("#UploadJsonFileId").get(0).files[0].name, JSON.parse(fileData), storeJsonCallback);

  });

}

function storeJsonCallback() {
   alert("上傳成功");
}

function readJsonFile(file){
  var loader = new FileReader();
  var def = $.Deferred(), promise = def.promise();

  //--- provide classic deferred interface
  loader.onload = function (e) { def.resolve(e.target.result); };
  loader.onprogress = loader.onloadstart = function (e) { def.notify(e); };
  loader.onerror = loader.onabort = function (e) { def.reject(e); };
  promise.abort = function () { return loader.abort.apply(loader, arguments); };

  //loader.readAsBinaryString(file);
  loader.readAsText(file,'UTF-8');         // 不能用 binary 讀入，會變成亂碼
  return promise;
}

function renameJsonDialogContent(catgory, datapath, fromFilename){
  $("#oldDataFileCatgory").html(catgory);
  $("#oldDataFileDatapath").html(datapath);
  $("#oldDataFileName").html(fromFilename);
  $("#renameDataFileDialog").modal('show');
}

function renameJson(){
  let transporter = docuskyJson.jsonTransporter;
  transporter.renameDataFile($("#oldDataFileCatgory").html(),$("#oldDataFileDatapath").html(),$("#oldDataFileName").html(),$("#newDataFileName").val(),null);
  $("#renameDataFileDialog").modal('hide');
  alert("命名成功");
  GetJson();

}

function deleteJson(catgory, datapath, filename){
  let transporter = docuskyJson.jsonTransporter;
  transporter.deleteDataFile(catgory, datapath, filename, null);
  alert("刪除成功");
  GetJson();

}

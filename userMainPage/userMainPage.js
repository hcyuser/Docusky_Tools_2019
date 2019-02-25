var docuSkyObj = null;
var docuskyJson = null;
var docuskyDbObj = null;
var JsonData = null;
var tmp = {};
var formData = [];
var JsonFilename = "";
$(document).ready( function () {

    if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){
      $('body > header .small-9.columns').hide();
    }

    docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
    docuskyDbObj = docuskyManageDbListSimpleUI;
    docuskyJson = docuskyManageDataFileListSimpleUI;
    /*let param = {
                target: 'USER',
                db: docuSkyObj.db,
                corpus: '[ALL]',
                query: '.all',
                page: docuSkyObj.page, // current page
                pageSize: docuSkyObj.pageSize
            };*/
    //docuSkyObj.getQueryResultDocuments(param, null, null);
    //$("body").hover(function() {
    //    if($("#CorpusDoc_dbCorpusListContainer_0").is(":visible")){
    //       docuSkyObj.hideWidget(true);
    //    }
    //});
    docuskyDbObj.loginSuccFunc = InitialAfterLogin;
    //docuskyDbObj.manageDbList(null);
    $('#DocManageTable').DataTable();
    $('#GISManageTable').DataTable();
    $("#JsonManage").hide();
    GetName();
    GetCorpus();
    GetJson();
} );

function InitialAfterLogin(data){
  GetName();
  GetCorpus();
  GetJson();
}

function goToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function pinLeftControlBTM(selector){

  if(selector.parent().parent().parent().attr( 'style' )){
    selector.parent().parent().parent().removeAttr('style');
    selector.removeAttr('style');
  }else{
    selector.parent().parent().parent().attr( 'style', "position: -webkit-sticky;position: sticky;top: 0;border-radius: 4px;z-index:999;");
    selector.attr( 'style','background-color: darkred;');
  }
  //alert(selector.attr( 'style' ));

}

function hideUploadTool(){
  if($("#DocManage").is(":visible")){
    $("#DocManageUploadTool").toggle();
  }
  if($("#JsonManage").is(":visible")){
    $("#JsonManageUploadTool").toggle();
  }
}

function GetName(){
  docuskyDbObj.getUserProfile(null, function(data){ $(".user").html(data.display_name+" 的資料庫");});
}

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
    let webpage_search = "";
    for(CorpusIndex in CorpusGroup[ DB ]){
      if(CorpusGroup[ DB ].length==1){
        webpage_search += `<a href="https://docusky.org.tw/DocuSky/webApi/webpage-search-3in1.php?target=USER&db=`+DB+`&corpus=`+CorpusGroup[ DB ][CorpusIndex]+`">`+CorpusGroup[ DB ][CorpusIndex]+`</a>`;
      }else{
        webpage_search += `<a href="https://docusky.org.tw/DocuSky/webApi/webpage-search-3in1.php?target=USER&db=`+DB+`&corpus=`+CorpusGroup[ DB ][CorpusIndex]+`">`+CorpusGroup[ DB ][CorpusIndex]+`</a><br>`;
      }

    }
    //console.log(webpage_search);
    //CorpusGroup[ DB ].join( '<br>' )
    TablePrefix += `<tr><td>` + DB + `</td><td>`
                + webpage_search + `</td><td>`
                + status[DBStatus[ DB ]] + `</td><td>`
                + DBTime[DB] + `</td>`;

    TablePrefix += `<td> <button type="button" onclick='renameDBDialogContent("`+DB+`")'>重新命名</button> <button type="button" onclick='deleteXML("`+DB+`")'>刪除</button>  <button type="button" onclick='downloadDocuXml("`+DB+`")'>下載</button></td></tr>`;
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
     url: `https://docusky.org.tw/docusky/webApi/getAllCategoryDataFilenamesJson.php`,
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
  if(typeof(JsonData)==='string'){
    return;
  }
  for(catgory in JsonData){
   JsonData[catgory].forEach(function(item, index){
     item  = item.split("/");
     let multipath = item[0];

     item.forEach(function(it,index){
       if(index!=(item.length-1)&& index!=0){
         multipath = multipath + "/" + it;
       }

      });

     TablePrefix += `<tr><td>` + catgory + `</td><td>` + multipath + `</td><td>` + item[item.length-1] + `</td>` + `<td> <button type='button' onclick='renameJsonDialogContent("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>重新命名</button> <button type="button" onclick='deleteJson("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>刪除</button> <button type="button" onclick='retrieveJson("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>下載</button></td></tr>`;
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
  var url = 'https://docusky.org.tw/DocuSky/webApi/uploadXmlFilesToBuildDbJson.php';
  formData = [];
  formData[0] = {};
  formData[0]["name"] = "dbTitleForImport";
  formData[0]["value"] = $.trim($("#UploadDBName").val());
  let nameVal = "importedFiles[]";
  formData.file = {value: tmp.fileData, filename: tmp.fileName, name:nameVal};
  //console.log(formData);
  docuskyDbObj.uploadMultipart(url, formData);
  GetCorpus();

}

var uploadMultipart = function(url, data) {
   alert('uploading...');
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
   GetCorpus();
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
  $("#newDataFileName").val(fromFilename);
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

function retrieveJson(catgory,datapath,filename){
   window.open('https://docusky.org.tw/docusky/webApi/getDataFileBinary.php?catpathfile='+catgory+"/"+datapath+"/"+filename);
   let transporter = docuskyJson.jsonTransporter;
   JsonFilename = filename;
   transporter.retrieveJson(catgory, datapath, filename, retrieveJsonCallback);
   //transporter.retrieveJson(catgory, datapath, filename, null);
   //alert(JSON.stringify(docuskyJson.jsonTransporter.jsonObj));

}

function retrieveJsonCallback(){

  let json = docuskyJson.jsonTransporter.jsonObj;
  //console.log(JSON.stringify(json));
  //console.log(JsonFilename);

  //var t=setTimeout("alert(JSON.stringify(docuskyJson.jsonTransporter.jsonObj));",3000);
  let blob = new Blob([JSON.stringify(json)]);
  saveAs(blob, JsonFilename);

  /*
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(json)));
  element.setAttribute('download', JsonFilename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);*/
}

function deleteXML(DB){
  var URL = "https://docusky.org.tw/DocuSky/webApi/deleteDbJson.php?db="+DB;
  $.ajax({
     type: 'GET',
     url: URL,
     dataType: 'json',
     success: function (data) {
        alert("刪除中");
        GetCorpus();
     },
     error: function(response){
          console.log(response.responseText);
        }
  });
}

function renameDBDialogContent(oldname){
  $("#oldDBName").html(oldname);
  $("#newDBName").val(oldname);
  $("#renameDBDialog").modal('show');
}

function renameDB(){
  docuskyDbObj.renameDbTitle($("#oldDBName").html(), $("#newDBName").val(),null);
  $("#renameDBDialog").modal('hide');
  alert("命名成功");
  GetCorpus();
}

/*------------------download DocuXml-------------------*/
var downloadDocuXml = function (dbname) {
    var documents = {};
    let param = {
        target: 'USER',
        db: dbname,
        corpus: '[ALL]',
        query: '.all',
        page: 1,
        pageSize: 200
    };

    let getDocList = function() {
        let totalFound = docuSkyObj.totalFound;
        let param = {
            target: 'USER',
            db: docuSkyObj.db,
            corpus: '[ALL]',
            query: '.all',
            page: docuSkyObj.page, // current page
            pageSize: docuSkyObj.pageSize
        };
        for (let i in docuSkyObj.docList) {
            documents[docuSkyObj.docList[i].number] = docuSkyObj.docList[i].docInfo
        }

        if (param.page * param.pageSize <= totalFound) {
            param.page += 1;
            docuSkyObj.getQueryResultDocuments(param, null, getDocList);
        } else {

            let exporter = new DocuSkyExporter();
            let xmlString = exporter.generateDocuXml(documents, param.db);
            let blob = new Blob([xmlString]);
            let filename =  dbname + '.xml';
            saveAs(blob, filename)
        }
    };

    docuSkyObj.hideLoadingIcon(false);
    alert("下載中，請稍候");
    docuSkyObj.getQueryResultDocuments(param, null, getDocList);

};

var DocuSkyExporter = function() {
    this.corpus = {};
    this.db = '';
};
DocuSkyExporter.prototype.generateDocuXml = function(documents, db) {
    let documentXml = '';
    this.db = db;
    for (let number in documents) {
        let d = documents[number];
        d.number = number;
        documentXml += this.parseDocument(d);
    }
    return "<ThdlPrototypeExport>"
        + this.generateFeatureAnalysisInfo()
        + "<documents>"
        + documentXml
        + "</documents></ThdlPrototypeExport>";
};

DocuSkyExporter.prototype.generateFeatureAnalysisInfo = function() {
    let result = "";
    for (let corpus in this.corpus) {
        result += "<corpus name='"+ corpus +"'><feature_analysis>";
        for (let userDefineTag in this.corpus[corpus].feature_analysis) {
            result += "<tag name='" + userDefineTag + "' default_sub_category='-' default_category='" + userDefineTag + "' type='contentTagging'/>";
        }
        result += '</feature_analysis></corpus>';
    }
    return result;
};

DocuSkyExporter.prototype.parseUserDefinedTag = function(corpus, content) {
    try {
        let UserDefinedTag = '';
        const tagName = {};
        const regex = /<(Udef_[^>]+?)>(.*)<\/Udef_[^>|<]+?>/g;
        let m;
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            tagName[m[1]] = m[1];
            if (!(m[1] in this.corpus[corpus].feature_analysis)) this.corpus[corpus].feature_analysis[m[1]] = m[1];
        }
        for (let key in tagName) {
            UserDefinedTag += "<tag default_sub_category='-' default_category='" + key + "' type='contentTagging'>" + key + "</tag>";
        }
        return UserDefinedTag;
    } catch (e) {
        console.log(e);
    }
};

DocuSkyExporter.prototype.convertMetadata = function(docMetadataXml) {
    if (docMetadataXml === undefined) return '';
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docMetadataXml, "text/xml");
    let xmlString = '';
    if (xmlDoc.firstChild.nodeName === "DocMetadata")
        xmlString = xmlDoc.firstChild.innerHTML;
    return xmlString;
};
DocuSkyExporter.prototype.convertTitle = function(docTitleXml) {
    if (docTitleXml === undefined) return '';
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docTitleXml, "text/xml");
    return xmlDoc.querySelector("DocTitle").textContent;
};
DocuSkyExporter.prototype.convertTimeInfo = function({
                                                         dateOrigStr='',
                                                         dateDynasty='',
                                                         dateEra='',
                                                         dateChNormYear='',
                                                         dateAdDate='',
                                                         dateAdYear='',
                                                         timeseqType='',
                                                         timeseqNumber='',
                                                     }) {
    return "<time_orig_str>" + dateOrigStr + "</time_orig_str>"
        + "<time_dynasty>" + dateDynasty + "</time_dynasty>"
        + "<time_era>" + dateEra + "</time_era>"
        + "<time_norm_year>" + dateChNormYear + "</time_norm_year>"
        + "<time_ad_date>" + dateAdDate + "</time_ad_date>"
        + "<time_ad_year>" + dateAdYear + "</time_ad_year>"
        + "<timeseq_type>" + timeseqType + "</timeseq_type>"
        + "<timeseq_number>" + timeseqNumber + "</timeseq_number>";
};
DocuSkyExporter.prototype.convertPlaceInfo = function({
                                                          geoLevel1='',
                                                          geoLevel2='',
                                                          geoLevel3='',
                                                          geoX='',
                                                          geoY='',
                                                      }) {
    return "<geo_level1>" + geoLevel1 + "</geo_level1>"
        + "<geo_level2>" + geoLevel2 + "</geo_level2>"
        + "<geo_level3>" + geoLevel3 + "</geo_level3>"
        + "<geo_longitude>" + geoX + "</geo_longitude>"
        + "<geo_latitude>" + geoY + "</geo_latitude>";
};
DocuSkyExporter.prototype.parseDocument = function({
                                                       // 必要資訊
                                                       number,                 // document number in corpus
                                                       corpus,                 // corpus
                                                       docClass,
                                                       corpusOrder,            // corpus: corpus_order attribute
                                                       docContentXml,          // doc_content
                                                       docMetadataXml,         // xml_metadata
                                                       docTitleXml,            // title
                                                       docFilename,            // document: filename attribute
                                                       timeInfo,               // dateOrigStr: time_orig_str, dateDynasty: time_dynasty,
                                                       placeInfo,              // geoLevel1: geo_level1 ... geoLevel3: geo_level3, geoX: geo_longitude, geoY: geo_latitude
                                                       //------------------------------------------------------
                                                       docCompilation='',         // compilation
                                                       docSource='',              // doc_source
                                                       docSourceOrder=0,        // doc_source: doc_source_order attribute
                                                       docType='',                // doctype
                                                       docXmlFormatSubname='',    // docclass
                                                       author='',                 // author
                                                       docUserTagging='',         // doc_user_tagging (DocuSky don't support this information currently)
                                                       docTopicL1='',             // topic
                                                       docTopicL1Order=0,
                                                       //--------------------- other information--------------
                                                       // 這邊的資訊 DocuXml Draft 並沒有提供相對應的轉換
                                                       docId='',
                                                       docTimeCreated='',
                                                       xmlFormatName='',
                                                       srcFilename='',
                                                       // extraMetadata='',    // DocuSky不支援?
                                                   }) {
    if (!(corpus in this.corpus)) {
        this.corpus[corpus] = {
            'corpusOrder': corpusOrder,
            'feature_analysis': {}
        };
    }
    docClass = (docClass === undefined) ? "-" : docClass;
    return "<document filename='" + docFilename + "'>"
        + "<corpus corpus_order='"+ corpusOrder +"'>" + corpus + "</corpus>"
        + "<compilation>" + docCompilation + "</compilation>"
        + "<title>" + this.convertTitle(docTitleXml) + "</title>"
        + "<doc_source>" + docSource + "</doc_source>"
        + "<doctype>" + docType + "</doctype>"
        + "<docclass>" + docClass + "</docclass>"
        + "<author>" + author + "</author>"
        + this.convertPlaceInfo(placeInfo)
        + "<topic>" + docTopicL1 + "</topic>"
        + this.convertTimeInfo(timeInfo)
        + "<doc_content>" + docContentXml + "</doc_content>"
        + "<xml_metadata>" + this.convertMetadata(docMetadataXml) + "</xml_metadata>"
        + "<doc_user_tagging>" + this.parseUserDefinedTag(corpus, docContentXml) + "</doc_user_tagging>"
        + "</document>";
};

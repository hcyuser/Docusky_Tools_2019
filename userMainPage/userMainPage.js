var docuSkyObj = null;
var docuskyJson = null;
var docuskyDbObj = null;
var JsonData = null;
var tmp = {};
var formData = [];
var JsonFilename = "";
var PreviousDocManageTablePrefix = "";
var PreviousJsonManageTablePrefix = "";
var DocManageTableOption = {orderCol:0,orderType:"asc",pageLen:100,pageNum:0};
var JsonManageTableOption = {orderCol:0,orderType:"asc",pageLen:100,pageNum:0};
$(document).ready( function () {

    if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){
      $('body > header .small-9.columns').hide();
    }

    docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
    docuskyDbObj = docuskyManageDbListSimpleUI;
    docuskyJson = docuskyManageDataFileListSimpleUI;
    docuskyDbObj.loginSuccFunc = InitialAfterLogin;
    docuskyDbObj.uploadProgressFunc = uploadProgressFunc;
    $("#JsonManage").hide();
    $("#DocToolBox").hide();
    $("#JsonToolBox").hide();
    GetName();
    GetCorpus();
    GetJson();

    let removeWidgetLogin  = function(){
      if($("#DbList_loginContainer_0").is(':visible')){
        $('#LoginDialog').modal({backdrop: 'static', keyboard: false});
        $('#LoginDialog').modal('show');
        $("#DbList_loginContainer_0").hide();
      }

    }
    setInterval(removeWidgetLogin, 100);



} );

function InitialAfterLogin(data){
  GetName();
  GetCorpus();
  GetJson();
}

function uploadProgressFunc(data){
  $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
  .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif"><br>'+$("#UploadDBName").val()+' '+data+'%');
}

function goToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  if($('#DocManage').is(":visible")){
    $('.dataTables_scrollBody').animate({
      scrollTop: $('#DocManageTable tbody tr').eq(0).offset().top
    }, 800);

  }
  if($('#JsonManage').is(":visible")){
    $('.dataTables_scrollBody').animate({
      scrollTop: $('#JsonManageTable tbody tr').eq(3).offset().top
    }, 800);
  }
}

function hideLeftControlPanelHandle(){


  if($('#LeftControlPanel').is(":visible")){
    $('#LeftControlPanel').toggle();
    $('#DocManage').removeClass('col-md-9 col-xl-10');
    $('#DocManage').addClass('col-12');
    $('#JsonManage').removeClass('col-md-9 col-xl-10');
    $('#JsonManage').addClass('col-12');
  }else{
    $('#LeftControlPanel').toggle();
    $('#DocManage').addClass('col-md-9 col-xl-10');
    $('#DocManage').removeClass('col-12');
    $('#JsonManage').addClass('col-md-9 col-xl-10');
    $('#JsonManage').removeClass('col-12');
  }

  GetCorpus();
  GetJson();
  $('#JsonManageTable').DataTable().columns.adjust().draw();
  $('#DocManageTable').DataTable().columns.adjust().draw();


}


function hideUploadTool(){
  if($("#DocManage").is(":visible")){
    $("#DocManageUploadTool").hide(1000);
    $("#DocToolBox").show(1000);
  }

  if($("#JsonManage").is(":visible")){
    $("#JsonManageUploadTool").hide(1000);
    $("#JsonToolBox").show(1000);
  }
}

function showUploadTool(){
  if($("#DocManage").is(":visible")){
    $("#DocManageUploadTool").show(1000);
    $("#DocToolBox").hide(1000);
  }

  if($("#JsonManage").is(":visible")){
    $("#JsonManageUploadTool").show(1000);
    $("#JsonToolBox").hide(1000);
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
        if(CorpusGroup[ DB ][CorpusIndex]==null){
          webpage_search += `文字庫建置中`;
        }else{
          webpage_search += `<a href="https://docusky.org.tw/DocuSky/webApi/webpage-search-3in1.php?target=USER&db=`+DB+`&corpus=`+CorpusGroup[ DB ][CorpusIndex]+`">`+CorpusGroup[ DB ][CorpusIndex]+`</a>`;
        }

      }else{
        webpage_search += `<a href="https://docusky.org.tw/DocuSky/webApi/webpage-search-3in1.php?target=USER&db=`+DB+`&corpus=`+CorpusGroup[ DB ][CorpusIndex]+`">`+CorpusGroup[ DB ][CorpusIndex]+`</a><br>`;
      }

    }

    TablePrefix += `<tr><td>` + DB + `</td><td>`
                + webpage_search + `</td><td>`
                + status[DBStatus[ DB ]] + `</td><td><p>`
                + DBTime[DB].split(" ").join("<br>") + `</p></td>`;
    if(CorpusGroup[ DB ].length==1){
      TablePrefix += `<td> <button type="button" onclick='renameDBDialogContent("`+DB+`")'>重新命名</button> <button type="button" onclick='deleteXML("`+DB+`")'>刪除</button>  <button type="button" onclick='downloadDocuXml("`+DB+`", "`+CorpusGroup[ DB ][CorpusIndex]+`")'>下載</button></td></tr>`;
    }else{
      TablePrefix += `<td> <button type="button" onclick='renameDBDialogContent("`+DB+`")'>重新命名</button> <button type="button" onclick='deleteXML("`+DB+`")'>刪除</button>  <button type="button" onclick='downloadDocuXmlSwitchCorpus("`+DB+`", "`+CorpusGroup[ DB ]+`")'>下載</button></td></tr>`;
    }

  }

  if(PreviousDocManageTablePrefix==TablePrefix){
    return;
  }else{
    PreviousDocManageTablePrefix = TablePrefix;
  }

  $('#DocManageTable').DataTable().destroy();
  $("#DocManageTable").html(TablePrefix + `</tbody>`);
  $('#DocManageTable').DataTable({
      paging:true,
      searching:true,
      info:true,
      scrollY: "340px",
      scrollCollapse: true,
      columnDefs: [{targets: -1,className: 'dt-body-center'}],
      order: [[ DocManageTableOption.orderCol, DocManageTableOption.orderType]],
      pageLength: DocManageTableOption.pageLen
   });
   $('#DocManageTable').dataTable().fnPageChange(DocManageTableOption.pageNum,true);

   $('#DocManageTable').on( 'order.dt', function () {
    let order = $('#DocManageTable').DataTable().order();
    DocManageTableOption.orderCol = order[0][0];
    DocManageTableOption.orderType = order[0][1];
    //alert( order[0][0]+":"+order[0][1]);
   });
   $('#DocManageTable').on( 'page.dt', function () {
     DocManageTableOption.pageNum = $('#DocManageTable').DataTable().page.info().page;
    //console.log(DocManageTableOption.pageNum);
    });
  $('#DocManageTable').on( 'length.dt', function ( e, settings, len ) {
      DocManageTableOption.pageLen = len;
      //console.log( 'New page length: '+len );
  });


}

function downloadDocuXmlSwitchCorpus(db, corpusArr){
  corpusArr = corpusArr.split(",");
  let outputHtml = "";
  for(corpus in corpusArr){
    outputHtml += `<button class="btn btn-light" onclick='downloadDocuXml("`+db+`","`+corpusArr[corpus]+`");$("#downloadDocuXmlSwitchCorpus").modal("hide");'>`+corpusArr[corpus]+`<button>`;
  }
  $('#downloadDocuXmlSwitchCorpus .modal-dialog .modal-content .modal-body .text-center').html(outputHtml);
  $('#downloadDocuXmlSwitchCorpus').modal('show');


}

function GetJson(){
  $.ajax({
     type: 'GET',
     url: `https://docusky.org.tw/DocuSky/webApi/getAllCategoryDataFilenamesJson.php`,
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

     TablePrefix += `<tr><td>` + catgory + `</td><td>` + multipath.split("/").join("/<br>") + `</td><td>` + item[item.length-1] + `</td>` + `<td> <button type='button' onclick='renameJsonDialogContent("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>更名</button>  <button type="button" onclick='deleteJson("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>刪除</button> <button type="button" onclick='retrieveJson("`+catgory+`", "`+multipath+`", "`+item[item.length-1]+`")'>下載</button></td></tr>`;
    });

  }

  if(PreviousJsonManageTablePrefix==TablePrefix){
    return;
  }else{
    PreviousJsonManageTablePrefix = TablePrefix;
  }
  $('#JsonManageTable').DataTable().destroy();
  $("#JsonManageTable").html(TablePrefix + `</tbody>`);
  $('#JsonManageTable').DataTable({
      paging:true,
      searching:true,
      info:true,
      scrollY: "340px",
      scrollCollapse: true,
      columnDefs: [{targets: -1,className: 'dt-body-center'}],
      order: [[ JsonManageTableOption.orderCol, JsonManageTableOption.orderType]],
      pageLength: JsonManageTableOption.pageLen

   });
   $('#JsonManageTable').dataTable().fnPageChange(JsonManageTableOption.pageNum,true);

   $('#JsonManageTable').on( 'order.dt', function () {
    let order = $('#JsonManageTable').DataTable().order();
    JsonManageTableOption.orderCol = order[0][0];
    JsonManageTableOption.orderType = order[0][1];
   });
   $('#JsonManageTable').on( 'page.dt', function () {
     JsonManageTableOption.pageNum = $('#JsonManageTable').DataTable().page.info().page;
    });
  $('#JsonManageTable').on( 'length.dt', function ( e, settings, len ) {
      JsonManageTableOption.pageLen = len;
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
  $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
  .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif"><br>'+$("#UploadDBName").val()+' 建庫中，請稍後');
  $('#LoadingDialog').modal({backdrop: 'static', keyboard: false});
  $("#LoadingDialog").modal('show');
  docuskyDbObj.uploadMultipart(url, formData,
    function(data){
      alert(data.message);
      GetCorpus();
      $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
      .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif">');
      $("#LoadingDialog").modal('hide');
    },
    function(data){
      GetCorpus();
      $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
      .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif">');
      $("#LoadingDialog").modal('hide');
    }
  );
}


function UploadJson(event){
  event.preventDefault();
  let transporter = docuskyJson.jsonTransporter;
  readJsonFile($("#UploadJsonFileId").get(0).files[0]).done(function(fileData){
      transporter.storeJson($("#JsonCatgory").val(), $("#JsondataPath").val(), $("#UploadJsonFileId").get(0).files[0].name, JSON.parse(fileData), storeJsonCallback);

  });

}

function storeJsonCallback() {
   alert("上傳成功");
   GetJson();
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
  let r = confirm("確定要刪除嗎？");
  if(r!=true){
      return;
  }
  let transporter = docuskyJson.jsonTransporter;
  transporter.deleteDataFile(catgory, datapath, filename, function(){
    alert("刪除成功");
    GetJson();
  });


}

function retrieveJson(catgory,datapath,filename){
   window.open('https://docusky.org.tw/DocuSky/webApi/getDataFileBinary.php?catpathfile='+catgory+"/"+datapath+"/"+filename);
   let transporter = docuskyJson.jsonTransporter;
   JsonFilename = filename;
   transporter.retrieveJson(catgory, datapath, filename, retrieveJsonCallback);

}

function retrieveJsonCallback(){

  let json = docuskyJson.jsonTransporter.jsonObj;
  let blob = new Blob([JSON.stringify(json)]);
  saveAs(blob, JsonFilename);

}

function deleteXML(DB){
  let r = confirm("確定要刪除嗎？");
  if(r!=true){
      return;
  }
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
  docuskyDbObj.renameDbTitle($("#oldDBName").html(), $("#newDBName").val(),function(){
    $("#renameDBDialog").modal('hide');
    alert("命名成功");
    GetCorpus();
  });


}

function Logout(){
  var URL = "https://docusky.org.tw/DocuSky/webApi/userLogoutJson.php";
  $.ajax({
     type: 'GET',
     url: URL,
     dataType: 'json',
     success: function (data) {
        console.log("成功登出");
     },
     error: function(response){
          console.log(response.responseText);
        }
  });
}

function Login(){
  docuskyDbObj.login($("#DocuSkyUsername").val(),$("#DocuSkyPassword").val(),loginSuccFunc,loginFailFunc);

}
function loginSuccFunc(){
  alert("登入成功");
  location.reload();

}

function loginFailFunc(){
  alert("帳號或密碼錯誤");
  $("#DocuSkyPassword").val("");
}

/*------------------download DocuXml-------------------*/
var downloadDocuXml = function (dbname,corpus) {
    var documents = {};
    let param = {
        target: 'USER',
        db: dbname,
        corpus: corpus,
        query: '.all',
        page: 1,
        pageSize: 200
    };

    let getDocList = function() {
        let totalFound = docuSkyObj.totalFound;
        let param = {
            target: 'USER',
            db: docuSkyObj.db,
            corpus: docuSkyObj.corpus,
            query: '.all',
            page: docuSkyObj.page, // current page
            pageSize: docuSkyObj.pageSize
        };
        console.log(docuSkyObj);
        for (let i in docuSkyObj.docList) {
            documents[docuSkyObj.docList[i].number] = docuSkyObj.docList[i].docInfo
        }
        $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
        .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif"><br>'+dbname+' '+param.page*param.pageSize + " / " + totalFound);
        if (param.page * param.pageSize <= totalFound) {
            param.page += 1;
            docuSkyObj.getQueryResultDocuments(param, null, getDocList);
        } else {
            $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
            .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif">');
            $("#LoadingDialog").modal('hide');
            let exporter = new DocuSkyExporter();
            let spotlights = docuSkyObj.spotlights;
            let featureAnalysisSettings = docuSkyObj.featureAnalysisSettings;
            let db = param.db;
            let corpus = param.corpus;
            let xmlString = exporter.generateDocuXml(documents, db, corpus, spotlights, featureAnalysisSettings);
            let blob = new Blob([xmlString]);
            let filename =  dbname + '.xml';
            saveAs(blob, filename)
        }
    };

    docuSkyObj.hideLoadingIcon(true);
    $('#LoadingDialog .modal-dialog .modal-content .modal-body .text-center')
    .html('<img src="https://docusky.org.tw/DocuSky/WebApi/images/loading-circle.gif"><br>'+dbname+' 下載中，請稍候');
    $('#LoadingDialog').modal({backdrop: 'static', keyboard: false});
    $("#LoadingDialog").modal('show');
    docuSkyObj.getQueryResultDocuments(param, null, getDocList);

};

/*-----------------------downloader------------------------------------*/
const replaceAngleBrackets = ( node ) => { // 2018-09-29 Escape `Angle Brackets`
      let tmp = node.innerHTML;
      tmp = tmp.replace(new RegExp('>', 'g'), '&gt;');
      tmp = tmp.replace(new RegExp('<', 'g'), '&lt;');
      node.innerHTML = tmp;
      return node;
}

var DocuSkyExporter = function() {
    this.corpus = '';
    this.db = '';
    this.spotlights = '';
    this.userDefinedTag = {};
    this.featureAnalysis = {};
    this.featureAnalysisSettings = '';
}

DocuSkyExporter.prototype.generateDocuXml = function(selectedDocList, db, corpus, spotlights, featureAnalysisSettings) {
    let documentXml = '';
    this.db = db;
    this.corpus = corpus;
    this.spotlights = spotlights;
    this.featureAnalysisSettings = featureAnalysisSettings;
    for (let number of Object.keys(selectedDocList)) {
          let doc = selectedDocList[number];
          //documentXml += this.parseDocument({...document, number})
          let d = doc; d.number = number;
          documentXml += this.parseDocument(d);
    }
    const xmlString = "<ThdlPrototypeExport>"
                      + "<corpus name='*'>"
                      + this.generateFeatureAnalysisInfo()
                      + this.generateMetadataFieldSettings()
                      + "</corpus>"
                      + "<documents>"
                      + documentXml
                      + "</documents></ThdlPrototypeExport>";
    return xmlString;
}
DocuSkyExporter.prototype.generateFeatureAnalysisInfo = function() {
    if (!this.featureAnalysisSettings) return ""; // 2019-04-26 prevent from no feature_analysis situation
    let xmlString = '<feature_analysis>'
    const settings = this.featureAnalysisSettings.split(';')
    console.log(this.featureAnalysisSettings);
    for (let i = 0; i < settings.length; i++) {

          const setting = settings[i]
          console.log(i, setting)
          const token = setting.split(',')
          const key = token[0].split('/')
          const spotlight = token[1].split('/')
          if (key[0].substr(0, 4) == 'Udef') {
                xmlString += "<tag name='" + key[0] + "' default_sub_category='" + key[1] + "' default_category='" + key[0] + "' type='contentTagging'/>"
                xmlString += "<spotlight title='" + spotlight[0] + "' display_order='" + (i+1) + "' sub_category='" + '-' + "' category='" + key[0] + "'/>"
          } else {

          }
    }
    // for (let key of Object.keys(this.featureAnalysis)) {
    //       xmlString += "<tag name='" + key + "' default_sub_category='-' default_category='" + key + "' type='contentTagging'/>"
    // }
    xmlString += '</feature_analysis>'
    return xmlString
}
DocuSkyExporter.prototype.generateDocUserTagging = function() {
    let xmlString = ''
    for (let key of Object.keys(this.userDefinedTag)) {
          xmlString += "<tag default_sub_category='-' default_category='" + key + "' type='contentTagging'>" + key + "</tag>"
    }
    return xmlString
}
DocuSkyExporter.prototype.generateMetadataFieldSettings = function() {
  if (!this.spotlights) return ""; // 2019-04-26 prevent from no metafieldsetting situation
  let xmlString = '<metadata_field_settings>'
  const fields = this.spotlights.split(';')
  for (let field of fields) {
      const token = field.split(',')
      if (token[0].substr(1, 3) == 'ADY') {
          xmlString += '<year_for_grouping show_spotlight="Y">' + token[1] + '</year_for_grouping>'
      } else if (token[0].substr(1, 2) == 'AU') {
          xmlString += '<author show_spotlight="Y">' + token[1] + '</author>'
      } else if (token[0].substr(1, 4) == 'COMP') {
          xmlString += '<compilation_name show_spotlight="Y">' + token[1] + '</compilation_name>'
      } else if (token[0].substr(1, 4) == 'GEO3') {
          xmlString += '<geo show_spotlight="Y">' + token[1] + '</geo>'
      } else if (token[0].substr(1, 3) == 'SRC') {
          xmlString += '<doc_source show_spotlight="Y">' + token[1] + '</doc_source>'
      } else if (token[0].substr(1, 5) == 'CLASS') {
          xmlString += '<docclass show_spotlight="Y">' + token[1] + '</docclass>'
      } else if (token[0].substr(1, 6) == 'AD_YMD') {
          xmlString += '<time_varchar show_spotlight="Y">' + token[1] + '</time_varchar>'
      } else if (token[0].substr(1, 6) == 'GEO_XY') {
          console.log('未定義：' + token[0])
      } else if (token[0].substr(1, 14) == 'GEO1/GEO2/GEO3') {
          console.log('未定義' + token[0])
      } else if (token[0].substr(1, 3) == 'GEO') {
          console.log('未定義' + token[0])
      } else {
          alert("缺少後分類標籤定義：" + token[0])
      }
  }
  xmlString += '</metadata_field_settings>'
  return xmlString
}
DocuSkyExporter.prototype.convertContent = function(docContentXml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docContentXml, "text/xml");
    this.userDefinedTag = {}
    let xmlString = this.parseUserDefinedTag(xmlDoc)
    return xmlString
}
DocuSkyExporter.prototype.convertMetadata = function(docMetadataXml) {
    if (docMetadataXml === undefined) return ''
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(docMetadataXml, "text/xml")
    let xmlString = ''
    if (xmlDoc.firstChild.nodeName === "DocMetadata")
          xmlString = xmlDoc.firstChild.innerHTML
    return xmlString
}
DocuSkyExporter.prototype.convertTitle = function(docTitleXml) {
    if (docTitleXml === undefined) return ''
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(docTitleXml, "text/xml")
    let xmlString = ''
    if (xmlDoc.firstChild.nodeName === 'DocTitle')
          xmlString = xmlDoc.firstChild.innerHTML
    return xmlString
}
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
          + "<timeseq_number>" + timeseqNumber + "</timeseq_number>"
}
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
          + "<geo_latitude>" + geoY + "</geo_latitude>"
}
DocuSkyExporter.prototype.parseUserDefinedTag = function( xmlDoc ) {
    if ( xmlDoc == undefined ) return ''
    let xmlString = ''
    for ( let node of xmlDoc.childNodes) {
          if ( node.nodeName == 'Content' ) {
                xmlString += this.parseUserDefinedTag( node )
          } else if ( node.nodeName == '#text' && node.nodeType == 3 ) {
                xmlString += node.data
          } else if ( node.nodeName == '#text' && node.nodeType == 1) {
                xmlString += replaceAngleBrackets( node ).outerHTML
          } else if ( node.nodeName.substr(0, 4) == 'Udef') {
                this.featureAnalysis[node.nodeName] = node.nodeName
                this.userDefinedTag[node.nodeName] = node.nodeName
                node.innerHTML = this.parseUserDefinedTag( node )
                xmlString += node.outerHTML
          } else {
                node.innerHTML = this.parseUserDefinedTag( node )
                xmlString += node.outerHTML
          }
    }
    return xmlString
}

DocuSkyExporter.prototype.parseDocument = function({
    // 必要資訊
    number,
    corpus,                 // corpus
    corpusOrder,            // corpus: corpus_order attribute
    docContentXml,          // doc_content
    docMetadataXml,         // xml_metadata
    docTitleXml,            // title
    docFilename,            // document: filename attribute
    timeInfo,               // dateOrigStr: time_orig_str, dateDynasty: time_dynasty,
    placeInfo,              // geoLevel1: geo_level1 ... geoLevel3: geo_level3, geoX: geo_longitude, geoY: geo_latitude
    //------------------------------------------------------
    docCompilation='',         // compilation
    docCompilationVol='',      // compilation_vol
    docSource='',              // doc_source
    docSourceOrder=0,        // doc_source: doc_source_order attribute
    docType='',                // doctype
    docXmlFormatSubname='',    // docclass; decrypted?
    docClass='',                // docclass 2019-04-22 Wayne
    docAuthor='',                 // author
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
    const parser = new DOMParser()
    let xmlString = "<document filename='" + docFilename + "' number='" + number + "'>"
          + "<corpus corpus_order='" + corpusOrder + "'>" + this.corpus + "</corpus>" // 這邊的 corpus 與 this.corpus 應該相同
          + "<compilation>" + docCompilation + "</compilation>"
          + "<compilation_vol>" + docCompilationVol + "</compilation_vol>"
          + "<doc_content>" + this.convertContent(docContentXml) + "</doc_content>"
          + "<xml_metadata>" + this.convertMetadata(docMetadataXml) + "</xml_metadata>"
          + "<title>" + this.convertTitle(docTitleXml) + "</title>"
          + "<doc_source doc_source_order='" + docSourceOrder + "'>" + docSource + "</doc_source>"
          + "<doctype>" + docType + "</doctype>"
          + "<docclass>" + docClass + "</docclass>"
          + this.convertTimeInfo(timeInfo)
          + this.convertPlaceInfo(placeInfo)
          + "<author>" + docAuthor + "</author>"
          + "<doc_user_tagging>" + this.generateDocUserTagging() + "</doc_user_tagging>"
          + "<topic topic_order='" + docTopicL1Order + "'>" + docTopicL1 + "</topic>"
          + "<doc_id>" + docId + "</doc_id>"
          + "<doc_time_created>" + docTimeCreated + "</doc_time_created>"
          + "<xml_format_name>" + xmlFormatName + "</xml_format_name>"
          + "<src_filename>" + srcFilename + "</src_filename>"
          + "<db>" + this.db + "</db>"
          // + "<extra_metadata>" + extraMetadata + "</extra_metadata>"
          + "</document>"
    const xmlDoc = parser.parseFromString(xmlString, "text/xml")
    return xmlString
}

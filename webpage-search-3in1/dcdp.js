var docuSkyObj = null;
var allDocList = [];
$( document ).ready(function() {
    docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
    let postfixURL = window.location.search;
    if(postfixURL==""){
        $("#getDocuSkyDocs").show();
        $("#getDocuSkyDocs").click(function(e) {
          //var param = {};
          //docuSkyObj.getQueryResultDocuments(param, e, displayDocList);
          allDocList = [];             // reset
          var target = 'USER';
          var db = '', corpus = '';
          docuSkyObj.getDbCorpusDocuments(target, db, corpus, e, getEntireDbCorpusText);

        });

    }else{

        postfixURL = postfixURL.replace("?target=", "*").replace("&db=", "*").replace("&corpus=","*").split("*");
        alert(postfixURL);
        docuSkyObj.getDbCorpusDocuments(postfixURL[1], postfixURL[2], postfixURL[3], null, getEntireDbCorpusText);
    }



});

function getEntireDbCorpusText(){
      allDocList = allDocList.concat(docuSkyObj.docList);
      let param = { db: docuSkyObj.db,
                    corpus: docuSkyObj.corpus,
                    query: docuSkyObj.query,
                    page: docuSkyObj.page,
                    pageSize: docuSkyObj.pageSize };
      getNextPage(param, processEachDocList);
}
function  getNextPage(param, callback){
      let totalPages = Math.ceil(docuSkyObj.totalFound / docuSkyObj.pageSize);
      if (docuSkyObj.page < totalPages) {
         param.page = docuSkyObj.page + 1;
         docuSkyObj.getQueryResultDocuments(param, null, function() {
            allDocList = allDocList.concat(docuSkyObj.docList);
            getNextPage(param, callback);
         });
      }
      else {
         if (typeof callback === "function") callback();
      }

}
function processEachDocList() {
  /*for (var i=0; i<allDocList.length; i++) {
        var docWithInfo = allDocList[i];
        var doc = docWithInfo.docInfo;
        var t = "<b>" + docWithInfo.number + ". " + doc.docFilename + "</b><br/>" + doc.docContentXml;
        if (i < allDocList.length - 1) t += "\r\n====\r\n";
        s += t;
     }
     $("#textareaUserInput").val(s);*/

    alert(allDocList.length);
    //$("#getDocuSkyDocs").hide();

}

var docuSkyObj = null;
$(document).ready( function () {
    docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
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
          $("#CorpusDoc_dbCorpusListContainer_0").hide()
        }
    });
    $('#DocManageTable').DataTable();
    $('#GISManageTable').DataTable();
    GetCorpus();
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

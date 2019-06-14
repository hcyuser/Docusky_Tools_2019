---
title: 'DocuWidgets Documentation'
disqus: hackmd
---

DocuWidgets Documentation
===
![platform](https://img.shields.io/badge/platform-Microsoft%20Windows%20%7C%20macOS%20%7C%20GNU%2FLinux-9cf.svg)
![web browser](https://img.shields.io/badge/web%20browser-Chrome%20%7C%20Firefox-lightgrey.svg)
![language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![requirement](https://img.shields.io/badge/requirement-jQuery-green.svg)
![requirement](https://img.shields.io/github/forks/hcyuser/2019-Docusky-Tools.svg?label=Fork&style=social)

## Table of Contents

[TOC]

## Before You Begin
DocuWidgets are consisted of several DocuSky widgets in the form of JavaScript packages. It is convenient for developers to access data from DocuSky server. If you want to learn more about theory and concept, please read [this paper](http://www.airitilibrary.com/Publication/alDetailedMesh?DocID=P20180801001-201810-201812040008-201812040008-71-90).

We provide some Web APIs for web tool developers to upload and retrieve data from DocuSky server. The developers could utilize those APIs to control session status of users, database lists, database queries, and to upload as well as to download data. Additionally, we wrap the APIs as DocuSky widgets. Thus, the developers could use those widgets as an interface to access and control data in a more convenient manner, which means developers do not need to cope with the format of Web APIs, and they can get data as objects directly. For these APIs to operate correctly, it is required jQuery library loaded for DocuSky widgets to process layout settings, so remember to include it before using DocuWidgets.

Currently, we provide three DocuSky widgets for developers to use.

1. docusky.ui.manageDbListSimpleUI.js
2. docusky.ui.getDbCorpusDocumentsSimpleUI.js
3. docusky.ui.manageDataFileListSimpleUI.js

```sequence
Title: The Concept of Data Processing in DocuSky
DocuSky Server->API: Data Transfer
API->DocuWidgets: Wrap API as SDK
DocuWidgets -> DocuTools: For Developers to Use
Note right of DocuTools: DocuTools are the web tools for \n general users to analyze their data.
DocuTools --> DocuSky Server: Access data through DocuWidgets
```

### Understand DocuWidgets Structure from Data Format
General users can process their data in the format of DocuXml, JSON, CSV, TXT, etc., and among which, DocuXML is the most important format for DocuSky server for its fruitful information. DocuXML consists of the corpora, documents as well as our enriched metadata. To handle DocuXML's rich information, we designed two widgets for it. One is *docusky.ui.manageDbListSimpleUI.js*, and the other is *docusky.ui.getDbCorpusDocumentsSimpleUI.js*. For other data formats such as JSON, CSV, and TXT, they are accessible through *docusky.ui.manageDataFileListSimpleUI.js*.

#### *docusky.ui.manageDbListSimpleUI.js*
This widget provides the function of uploading DocuXML to a database and database renaming/deletion.
In addition, account information and friendship management are in the widget.

#### *docusky.ui.getDbCorpusDocumentsSimpleUI.js*
The main idea of this widget is to get corpus/documents, post-classification, and tag-analysis from DocuSky.
Users need to specify some parameter before their queries, so we provide some clever functions where developers can choose their scenario. Additionally, we also offer the function of updating document in it.

#### *docusky.ui.manageDataFileListSimpleUI.js*
Except DocuXML, all other formats of files are handled, including the upload/retrieval/renaming/deletion features, through this widget. Other DocuTools such as DocuGIS and GeoPort also utilize this widget to handle tasks like storing GIS positions, lexicon and some information for files other than the DocuXML format.

## Preparing your page
Before writing any code to integrate DocuSky via DocuWidgets, please follow the following steps on your page:

Include jQuery between ``<head></head>`` in HTML

```gherkin=
<script src="https://docusky.org.tw/DocuSky/js/jquery.min.js"></script>
```
If you want to use *docusky.ui.manageDbListSimpleUI.js*, include

```gherkin=
<script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.manageDbListSimpleUI.js"></script>
```
after jQuery library.

If you want to use *docusky.ui.getDbCorpusDocumentsSimpleUI.js*, include

```gherkin=
<script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.getDbCorpusDocumentsSimpleUI.js"></script>
```
after jQuery library.

If you want to use *docusky.ui.manageDataFileListSimpleUI.js*, include

```gherkin=
<script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.manageDataFileListSimpleUI.js"></script>
```
after jQuery library.

## Quick Start
You could activate the widgets UI by the following example.
```gherkin=
<!doctype html>   <!-- note: code written with utf8, not ANSI, encoding -->
<html>
<head>
   <!-- CORS: http://www.html5rocks.com/en/tutorials/cors/ -->
   <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
   <script src="https://docusky.org.tw/DocuSky/js/jquery.min.js"></script>
   <script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.manageDbListSimpleUI.js"></script>
   <script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.getDbCorpusDocumentsSimpleUI.js"></script>
   <script src="https://docusky.org.tw/DocuSky/js.ui/docusky.ui.manageDataFileListSimpleUI.js"></script>
   <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" crossorigin="anonymous"></link>
   <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" crossorigin="anonymous"></script>
   <script>
   var docuSkyDbObj = null;
   var docuSkyGetDocsObj = null;
   var docuSkyDataFilesObj = null;

   $(document).ready(function() {
      docuSkyDbObj = docuskyManageDbListSimpleUI;
      docuSkyGetDocsObj = docuskyGetDbCorpusDocumentsSimpleUI;
      docuSkyDataFilesObj = docuskyManageDataFileListSimpleUI;

      docuSkyDbObj.includeFriendDb = true;       
      docuSkyGetDocsObj.includeFriendDb = true;

      $("#manageDbList").click(function(e) {
         docuSkyDbObj.manageDbList(e);
      });

      $("#getDocuSkyDocs").click(function(e) {

         docuSkyGetDocsObj.getDbCorpusDocuments('', '', '', e);
      });

      $("#manageDataFiles").click(function(e) {
         docuSkyDataFilesObj.manageDataFileList(e);
      });
   });


   </script>
</head>
<body>
      <button class="btn btn-primary" id="manageDbList">管理文獻集</button>
      <button class="btn btn-primary" id="getDocuSkyDocs">點我取得文件內容</button>
      <button class="btn btn-primary" id="manageDataFiles">管理資料檔</button>
</body>

</html>

```
If you want to get all documents in a database, please refer to [this section](#Example-3).

If you want to know the specifications of a document in `docuskyGetDbCorpusDocumentsSimpleUI.docList`, please refer to [this documentation](http://docusky.org.tw/DocuSky/documentation/docs/DocuXml-1.2-Scheme.html#DocuXml-%E5%B0%8D%E6%87%89-%E7%94%B1-DocuSky-Widget-%E5%9B%9E%E5%82%B3%E4%B9%8B-JSON).


*docusky.ui.manageDbListSimpleUI.js*
---
To get user information, user friendship, or to upload DocuXML to a database as well as rename/delete the database, you need to use this widget.

### `docuskyManageDbListSimpleUI.loginSuccFunc`

#### Description:
If the user didn't login, the widget will force the user to login. After logging in, it will execute `docuskyManageDbListSimpleUI.loginSuccFunc`. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.loginSuccFunc = function(){
    console.log("OK");
}
</script>
```

### `docuskyManageDbListSimpleUI.loginFailFunc`
#### Description:
If the user didn't login, the widget will force the user to login. If log in fails, `docuskyManageDbListSimpleUI.loginFailFunc` will be executed. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.loginFailFunc = function(){
    console.log("No");
}
</script>
```

### `docuskyManageDbListSimpleUI.Error`

#### Description:
This is a global property for the developers to set a callback function when functions in this widget occurrs an error. If you invoke a function without setting a `fail(error)` callback function in the argument, `docuskyManageDbListSimpleUI.Error` will be invoked. `docuskyManageDbListSimpleUI.Error` will receive `Connection Error` or `Server Error` when an error occurred. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.Error = function(data){

    if(data=="Connection Error"){
        console.log("This is a connection error.")
    }
    else if("Server Error"){
        console.log("This is a server error.")
    }

}
</script>
```

### `docuskyManageDbListSimpleUI.uploadProgressFunc`

#### Description:
This is a global property for the developers to set a callback function for uploading DocuXML. If `docuskyManageDbListSimpleUI.uploadMultipart` is invoked for uploading DocuXML successfully, `docuskyManageDbListSimpleUI.uploadProgressFunc` will receive the progress percentage of uploading. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.uploadProgressFunc = function(percentage){
    console.log("The percentage is" + percentage);
}
</script>
```

### `docuskyManageDbListSimpleUI.maxResponseTimeout`

#### Description:
This is the value of `maxResponseTimeout` for uploading DocuXML via `docuskyManageDbListSimpleUI.uploadMultipart`.
The default value is `300000` (5 minutes).
For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.maxResponseTimeout = 600000;
// It means maxResponseTimeout is 10 minutes.
</script>
```

### `docuskyManageDbListSimpleUI.maxRetryCount`

#### Description:
If the developers don't set any fail callback function while invoking the functions in this widget, it will retry the invoked function automatically. The number of times of retrial is defined in `docuskyManageDbListSimpleUI.maxRetryCount`, and the default value is `10`. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDbListSimpleUI.maxRetryCount = 20;
// It means maxRetryCount is 20.
</script>
```

### `docuskyManageDbListSimpleUI.login(username, password, succFunc, failFunc)`

#### Description:
It is used for user login.

##### `username`
Type: String
The username is usually an Email.

##### `password`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when login is successful.

##### `failFunc`
Type: Function
The callback function to execute when login is failed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.login("username", "password", function(){ console.log("OK");},
function(){console.log("No");});
</script>
```

### `docuskyManageDbListSimpleUI.hideWidget(is_hidden)`

#### Description:
It is used for hidding this widget display on the web. The widget is displayed on the web as default.

##### `is_hidden`
Type: Boolean
Whether or not the widget is hidden.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.hideWidget(true);
// Hide the widget;

docuskyManageDbListSimpleUI.hideWidget(false);
// Display the widget;
</script>
```

### `docuskyManageDbListSimpleUI.hideLoadingIcon(is_hidden)`

#### Description:
It is used for hidding loading icon display on the web. The loading icon is displayed on the web as default.

##### `is_hidden`
Type: Boolean
Whether or not the widget is hidden.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.hideLoadingIcon(true);
// Hide the loading icon;

docuskyManageDbListSimpleUI.hideLoadingIcon(false);
// Display the loading icon;
</script>
```

### `docuskyManageDbListSimpleUI.includeFriendDb(is_inclusive)`

#### Description:
It is used for showing friend's corpus. The default value is `false`.

##### `is_inclusive`
Type: Boolean
Whether or not the information of friendship is displayed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.includeFriendDb(true);
// show friend's corpus

docuskyManageDbListSimpleUI.includeFriendDb(false);
// hide friend's corpus
</script>
```

### `docuskyManageDbListSimpleUI.enableWidgetEvent(evtKey, callback)`

#### Description:
It is used to set some event callback functions on the widget UI.

##### `evtKey`
Type: String
Current events are `"dbClick"`, `"corpusAttCntClick"`, `"corpusClick"`, `"attCntClick"`.

##### `callback`
Type: Function
A function to execute when the `event(evtKey)` is triggered.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.enableWidgetEvent("dbClick",
function(){
 console.log("dbClick is triggered.");
})
</script>
```

### `docuskyManageDbListSimpleUI.disableWidgetEvent(evtKey)`

#### Description:
It is used to disable some event callback functions on the widget UI.

##### evtKey
Type: String
Current events are `"dbClick"`, `"corpusAttCntClick"`, `"corpusClick"`, `"attCntClick"`.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.disableWidgetEvent("dbClick");
</script>
```

### `docuskyManageDbListSimpleUI.setLoadingIcon(url)`

#### Description:
It is used to set a loading icon by URL.

##### `url`
Type: String
The URL of your icon.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.setLoadingIcon("http://www.loadinfo.net/images/preview/12_cyrle_two_24.gif?1384388177");
</script>
```

### `docuskyManageDbListSimpleUI.deleteDb(DbTitle, succFunc, failFunc)`

#### Description:
Delete user database by the title of database.

##### `DbTitle`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when deleting database is successful.

##### `failFunc`
Type: Function
The callback function to execute when deleting database is failed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.deleteDb("Default", function(){ console.log("OK");},
function(){console.log("No");});
</script>
```
### `docuskyManageDbListSimpleUI.renameDbTitle(oldDbTitle, newDbTitle, succFunc, failFunc)`

#### Description:
Rename user database by the title of database.

##### `oldDbTitle`
Type: String

##### `newDbTitle`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when renaming database is successful.

##### `failFunc`
Type: Function
The callback function to execute when renaming database is failed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.renameDbTitle("Default", "Default2",function(){ console.log("OK");},
function(){console.log("No");});
</script>
```

### `docuskyManageDbListSimpleUI.getUserProfile(evt, succFunc, failFunc)`

#### Description:
Get user profile. The data will be sent to `succFunc`.

##### `evt`
Type: Event
`docuskyManageDbListSimpleUI.getUserProfile` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute when getting user profile is successful. The data will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when getting user profile is failed.

#### Example:
```gherkin=
<script>
$("#getUserProfile").click(function(e) {
    docuskyManageDbListSimpleUI.loginSuccFunc = myFunc;
    /* If the user didn't login, the widget will force the user to login. After logging in, it will execute docuskyManageDbListSimpleUI.loginSuccFunc. */
    docuskyManageDbListSimpleUI.getUserProfile(e, displayProfileJson);
});
function displayProfileJson(data) {
   alert("Profile:\n" + JSON.stringify(data));
}
function myFunc() {
   docuskyManageDbListSimpleUI.getUserProfile(null, displayProfileJson);
}

</script>
```

### `docuskyManageDbListSimpleUI.manageDbList(evt, succFunc, failFunc)`

#### Description:
It is used to open the widget UI and get the list of databases. The list of databases will be in `docuskyManageDbListSimpleUI.dbList`.

##### `evt`
Type: Event
`docuskyManageDbListSimpleUI.manageDbList` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute after putting the list of databases into `docuskyManageDbListSimpleUI.dbList`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example 1:
```gherkin=
<script>
$("#manageDbList").click(function(e) {
    docuskyManageDbListSimpleUI.manageDbList(e);
});
</script>
```

#### Example 2:
```gherkin=
<script>
    docuskyManageDbListSimpleUI.manageDbList(null,
    function(){
        console.log("OK" + docuskyManageDbListSimpleUI.dbList);
    },
    function(){
        console.log("No");
    });
</script>
```

### `docuskyManageDbListSimpleUI.getUserFriendship(param, succFunc, failFunc)`

#### Description:
Get the list of friends of the present user. The data will be passed to `succFunc`.

##### `param`
Type: Object
It is usually ``{}``.

##### `succFunc`
Type: Function
The callback function to execute when getting user friendship is successful. The data will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when getting user friendship is failed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.getUserFriendship({},displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.getUserFriendAccessibleDb(param, succFunc, failFunc)`

#### Description:
Get the database tuple list that the present user's friends can access. The tuple format is `(friend_username, database_title)`. The data will be passed to `succFunc`.

##### `param`
Type: Object
It is usually ``{}``.

##### `succFunc`
Type: Function
The callback function to execute when it is successful. The data will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDbListSimpleUI.getUserFriendAccessibleDb({},displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.replaceUserFriendship(param, succFunc, failFunc)`

#### Description:
Add the other users as friends.

##### `param`
Type: Object
Set the property of param as below.
```
param.friendUsernames = "friend1;friend2;friend3";
```
It will add `friend1`, `friend2` and `friend3` as friends.

##### `succFunc`
Type: Function
The callback function to execute when it is successful. The result of this function will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
let param = {};
param.friendUsernames = "friend1";
docuskyManageDbListSimpleUI.replaceUserFriendship(param,displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.replaceUserFriendAccessibleDb(param, succFunc, failFunc)`

#### Description:
Assign a database for a friend to access.

##### `param`
Type: Object
Set the property of param as below.
```
let accessibleDb = { friendUsername, userDbName };
param.friendAccessibleDb = [ accessibleDb ];
```
It will allow `friendUsername` to access `userDbName`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful. The result will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
let param = {};
let accessibleDb = { friendUsername, userDbName };
param.friendAccessibleDb = [ accessibleDb ];
docuskyManageDbListSimpleUI.replaceUserFriendAccessibleDb(param, displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.deleteUserFriendship(param, succFunc, failFunc)`

#### Description:
It is used to delete friendship between the current user and the assigned user.

##### `param`
Type: Object
Set the property of param as below.
```
param.friendUsernames = "friend1;friend2;friend3";
```
It will delete friendship from `friend1`, `friend2` and `friend3`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful. The outcome will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
let param = {};
param.friendUsernames = "friend1";
docuskyManageDbListSimpleUI.deleteUserFriendship(param, displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.deleteUserFriendAccessibleDb(param, succFunc, failFunc)`

#### Description:
Remove the access of the database from the assigned user .

##### `param`
Type: Object
Set the property of `param` as below.
```
let accessibleDb = { friendUsername, userDbName };
param.friendAccessibleDb = [ accessibleDb ];
```
It will remove the access of `userDbName` from `friendUsername`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful. The outcome will be passed to `succFunc`.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
let param = {};
let accessibleDb = { friendUsername, userDbName };
param.friendAccessibleDb = [ accessibleDb ];
docuskyManageDbListSimpleUI.deleteUserFriendAccessibleDb(param, displayResponseJson);
function displayResponseJson(message) {
    alert(JSON.stringify(message));
}
</script>
```

### `docuskyManageDbListSimpleUI.uploadMultipart(data, succFunc, failFunc, option)`

#### Description:
Upload DocuXML.

##### `data`
Type: Object

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:

### `docuskyManageDbListSimpleUI.utility.setStyle(param)`

#### Description:
It is used to set the style of the widget UI.

##### `param`
Type: Object
Set the property of param as below.
```
param = {
frameColor:"red", // It is used to set font color of the frame.
frameBackgroundColor:"green", // It is used to set background color of the frame.
contentBackgroundColor:"white" // It is used to set background color of the content.
}
```

#### Example:
```gherkin=
<script>
let param = {frameColor:"red",frameBackgroundColor:"green",contentBackgroundColor:"white"}
docuskyManageDbListSimpleUI.utility.setStyle(param);
</script>
```

*docusky.ui.getDbCorpusDocumentsSimpleUI.js*
---
To get database, corpus, metadata and to modify corpus, you need to use this widget.

### `docuskyGetDbCorpusDocumentsSimpleUI.loginInvokeFun`

#### Description:
If the user didn't login, the widget will ask the user to login. After logging in, it will execute `docuskyGetDbCorpusDocumentsSimpleUI.loginInvokeFun`. For example, it could be used as following:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.loginInvokeFun = function(){
    console.log("OK");
}
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.Error`

#### Description:
This is a global property for the developers to set a callback function when functions in this widget occurred an error. If you invoke a function without setting a `fail(error)` callback function in the argument, `docuskyGetDbCorpusDocumentsSimpleUI.Error` will be invoked. `docuskyGetDbCorpusDocumentsSimpleUI.Error` will receive `Connection Error` or `Server Error` when an error occurred. For example, it could be used as following:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.Error = function(data){

    if(data=="Connection Error"){
        console.log("This is a connection error.")
    }
    else if("Server Error"){
        console.log("This is a server error.")
    }

}
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.maxResponseTimeout`

#### Description:
This is the value of `maxResponseTimeout` for getting corpora/documents.
The default value is `300000` (5 minutes).
For example, it could be used as following:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.maxResponseTimeout = 600000;
// It means maxResponseTimeout is 10 minutes.
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.maxRetryCount`

#### Description:
If the developers don't set any fail callback function while invoking the functions in this widget, it will retry the invoked function automatically. The number of times of retrial is defined as `docuskyGetDbCorpusDocumentsSimpleUI.maxRetryCount`, and the default value is `10`. For example, it could be used as following:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.maxRetryCount = 20;
// It means maxRetryCount is 20.
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.setLoadingIcon(url)`

#### Description:
It is used to set a loading icon by URL.

##### `url`
Type: String
The URL of your icon.

#### Example:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.setLoadingIcon("http://www.loadinfo.net/images/preview/12_cyrle_two_24.gif?1384388177");
</script>
```
### `docuskyGetDbCorpusDocumentsSimpleUI.hideLoadingIcon(is_hidden)`

#### Description:
It is used for hidding loading icon display on the web. The loading icon is displayed on the web as default.

##### `is_hidden`
Type: Boolean
Whether or not the icon is hidden.

#### Example:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.hideLoadingIcon(true);
// Hide the loading icon;

docuskyGetDbCorpusDocumentsSimpleUI.hideLoadingIcon(false);
// Display the loading icon;
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.includeFriendDb(is_inclusive)`

#### Description:
It is used for showing friend's corpus. The default value is `false`.

##### `is_inclusive`
Type: Boolean
Whether or not the information of friendship is displayed.

#### Example:
```gherkin=
<script>
docuskyGetDbCorpusDocumentsSimpleUI.includeFriendDb(true);
// show friend's corpus

docuskyGetDbCorpusDocumentsSimpleUI.includeFriendDb(false);
// hide friend's corpus
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.docList`

#### Description:
The result of documents after calling `getDbCorpusDocumentsGivenPageAndSize`, `getDbCorpusDocuments` and `getQueryResultDocuments`.

##### The specifications of `docuskyGetDbCorpusDocumentsSimpleUI.docList`
It is presented in [this documentation](http://docusky.org.tw/DocuSky/documentation/docs/DocuXml-1.2-Scheme.html#DocuXml-%E5%B0%8D%E6%87%89-%E7%94%B1-DocuSky-Widget-%E5%9B%9E%E5%82%B3%E4%B9%8B-JSON).


### `docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments(target, db, corpus, evt, succFunc, failFunc)`

#### Description:
Get documents in the corpus with assigned arguments.  The result will be stored in *docuskyGetDbCorpusDocumentsSimpleUI.docList*.

##### `target`
Type: String
Change the database privacy setting to be public or private (personal). If a database is public, `target` would be set as `"OPEN"`. If the database is private (personal), the target would be set as `"USER"`.

##### `db`
Type: String
The title of the target database.

##### `corpus`
Type: String
The title of the target corpus in the selected database.
Use `"[ALL]"` if there are multiple corpora in this database and you want to select all of them.

##### `evt`
Type: Event
`docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

> Note:
After calling this function, it will return the first 200 documents in `docuskyGetDbCorpusDocumentsSimpleUI.docList`. If you want to get all documents in the corpus/database, you need to use a loop to get them. You may use `docuSkyGetDocsObj.totalFound` could find the number of all documents after invoking `getDbCorpusDocuments`.

#### Example 1:
```gherkin=
<script>
$("#getDocuSkyDocs").click(function(e) {
      var target = 'USER';
      var db = '', corpus = '';             
      // empty string: force the simpleUI to display a menu for user selection
      docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments(target, db, corpus, e, function(){
      console.log(docuskyGetDbCorpusDocumentsSimpleUI.docList);
      });
   });
</script>
```

#### Example 2:
```gherkin=
<script>
// get public database
docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments("OPEN", "本草經集注", "本草經集注", null,
    function(){console.log(docuskyGetDbCorpusDocumentsSimpleUI.docList);
});
</script>
```

#### Example 3:
```gherkin=
<script>
// get entire database through user selection on UI
var docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
var allDocList = [];
docuSkyObj.getDbCorpusDocuments('', '', '', null, getEntireDbCorpusText);
function getEntireDbCorpusText(){
           allDocList = allDocList.concat(docuSkyObj.docList);
           let param = {
                         target: docuSkyObj.target,
                         db: docuSkyObj.db,
                         corpus: docuSkyObj.corpus
                       };
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
     console.log(allDocList);
 }
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocumentsGivenPageAndSize(target, db, corpus, page, pageSize, evt, succFunc, message, failFunc)`

#### Description:
Get documents in the corpus with assigned arguments. The result will be stored in `docuskyGetDbCorpusDocumentsSimpleUI.docList`.

##### `target`
Type: String
Change the database privacy setting to be public or private (personal). If a database is public, `target` would be set as `"OPEN"`. If the database is private (personal), the target would be set as `"USER"`.

##### `db`
Type: String
The title of the target database.

##### `corpus`
Type: String
The title of the target corpus in the selected database.
Use `"[ALL]"` if there are multiple corpora in this database and you want to select all of them.

##### `page`
Type: String
The documents are paginated when fetched as lists. It is used to get the specific page in a query. If the number of all documents in a corpus is 400, `page: "2"` means it will return documents from 201 to 400.

##### `pageSize`
Type: String
It is used to define the number of documents in a page. The default value is 200.

##### `evt`
Type: Event
`docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `message`
Type: String
The string that will display on the loading icon when this function is triggered.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

> Note:
After calling this function, it will return `pageSize` documents in the specific `page` and put them in `docuskyGetDbCorpusDocumentsSimpleUI.docList`. You may find the number of all documents found in `docuSkyGetDocsObj.totalFound` after invoking `getDbCorpusDocumentsGivenPageAndSize`.

### `docuskyGetDbCorpusDocumentsSimpleUI.getQueryResultDocuments(param, evt, succFunc, failFunc)`

#### Description:
Get documents in corpus with detailed arguments. The result will be stored in `docuskyGetDbCorpusDocumentsSimpleUI.docList`.

##### `param`
Type: Object
Set the property of param as below.
target, db, corpus are the required properties in param.

###### target
Type: String
Change the database privacy setting to be public or private (personal). If a database is public, `target` would be set as ``"OPEN"``. If the database is private (personal), the target would be set as ``"USER"``.

###### db
Type: String
The title of the target database.

###### corpus
Type: String
The title of the target corpus in the selected database.
Use ``"[ALL]"`` if there are multiple corpora in this database and you want to select all of them.

###### ownerUsername
Type: String
If the user wants to access a friend's database, it is required to set the friend's username.

###### query
Type: String
It provides full-text search and advanced search.
Examples:
1. A and B is denoted as A +B
2. A not B is denoted as A -B

###### page
Type: String
The documents are paginated when fetched as lists. It is used to get the specific page in query. If the number of all documents in a corpus is 400, `page: "2"` means it will return documents from 201 to 400.

###### pageSize
Type: String
Define the number of documents in a page. The default value is 200.

###### message
Type: String
The string that will display on the loading icon when this function is triggered.

###### fieldsOnly
Type: Boolean
Set `true` if you want to get metadata only.
On the contrary, it would be false. The default value is false.

###### channelKey
Type: String
Set channelKey if you want to get the data into a specific channel. It is used for multiple fetching. If channelKey is assigned, the result isn't in *docuskyGetDbCorpusDocumentsSimpleUI.docList*.
The documents will be stored in *docuskyGetDbCorpusDocumentsSimpleUI.channelBuffer\[channelKey]*.

###### Instance
```gherkin=
var param = {
target: "OPEN", //It is required.
db: "本草經集注", //It is required.
corpus:"本草經集注", //It is required.
query:"陶弘景"
}
```

##### `evt`
Type: Event
`docuskyGetDbCorpusDocumentsSimpleUI.getQueryResultDocuments` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
var param = {
target: "OPEN", //It is required.
db: "本草經集注", //It is required.
corpus:"本草經集注", //It is required.
query:"陶弘景"
};
docuskyGetDbCorpusDocumentsSimpleUI.getQueryResultDocuments(param, null);
</script>
```

> Note:
*docuskyGetDbCorpusDocumentsSimpleUI.getQueryResultDocuments* is complicated. For beginners, we recommand you to use *docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocuments* or *docuskyGetDbCorpusDocumentsSimpleUI.getDbCorpusDocumentsGivenPageAndSize*. The above two functions are based on this function. If there are troubles, please use our examples and develop your web tools based on them.

### `docuskyGetDbCorpusDocumentsSimpleUI.getQueryPostClassification(param, evt, succFunc, failFunc)`

#### Description:
Get post-classification in corpus with assigned arguments. The result will be stored in *docuskyGetDbCorpusDocumentsSimpleUI.postClassification*.

##### `param`
Type: Object
The specifications are the same as the param of getQueryResultDocuments.

##### `evt`
Type: Event
`docuskyGetDbCorpusDocumentsSimpleUI.getQueryPostClassification` will be triggered by an event. If there is no event, it could be null.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
var param = {
target: "OPEN", //It is required.
db: "本草經集注", //It is required.
corpus:"本草經集注", //It is required.
};
docuskyGetDbCorpusDocumentsSimpleUI.getQueryPostClassification(param, null);
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.getQueryTagAnalysis(param, evt, succFunc, failFunc)`

#### Description:
Get tag-analysis in corpus with assigned arguments. The result will be stored in *docuskyGetDbCorpusDocumentsSimpleUI.tagAnalysis*.

##### `param`
Type: Object
The specifications are the same as the param of getQueryResultDocuments.

##### `evt`
Type: Event
`docuskyGetDbCorpusDocumentsSimpleUI.getQueryTagAnalysis` will be triggered by an event. If there is no event, it could be null.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
var param = {
target: "OPEN", //It is required.
db: "本草經集注", //It is required.
corpus:"本草經集注", //It is required.
};
docuskyGetDbCorpusDocumentsSimpleUI.getQueryTagAnalysis(param, null);
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.updateDocument(ownerUsername, db, corpus, docInfo, succFunc, failFunc)`

#### Description:
Update document.

##### `ownerUsername`
Type: String
The owner user name of the database.

##### `db`
Type: String
The title of the target database.

##### `corpus`
Type: String
The title of the target corpus in the selected database.
Use ``"[ALL]"`` if there are multiple corpora in this database and you want to select all of them.

##### `docInfo`
Type: Object
It contains the same as the item of *docuskyGetDbCorpusDocumentsSimpleUI.docList*.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

### `docuskyGetDbCorpusDocumentsSimpleUI.replaceDocument(ownerUsername, db, corpus, docInfo, succFunc, failFunc)`

#### Description:
Replace document.

##### `ownerUsername`
Type: String
The owner user name of the database.

##### `db`
Type: String
The title of the target database.

##### `corpus`
Type: String
The title of the target corpus in the selected database.
Use ``"[ALL]"`` if there are multiple corpora in this database and you want to select all of them.

##### `docInfo`
Type: Object
It contains the same as the item of *docuskyGetDbCorpusDocumentsSimpleUI.docList*.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

### `docuskyGetDbCorpusDocumentsSimpleUI.setDbListOption(param)`

#### Description:
Set some options. There is only includeFriendDb for setting now.

##### `param`
Type: Object
Set the property of param as below.

###### includeFriendDb
Set `true` if we want the users to view and manipulate friend's database. On the contrary, it would be false. The default value is false.

#### Example:
```gherkin=
<script>
var param = {
includeFriendDb: true
};
docuskyGetDbCorpusDocumentsSimpleUI.setDbListOption(param);
</script>
```

### `docuskyGetDbCorpusDocumentsSimpleUI.utility.setStyle(param)`

#### Description:
It is used to set the style of the widget UI.

##### `param`
Type: Object
Set the property of param as below.
```
param = {
frameColor:"red", // It is used to set font color of the frame.
frameBackgroundColor:"green", // It is used to set background color of the frame.
contentBackgroundColor:"white" // It is used to set background color of the content.
}
```

#### Example:
```gherkin=
<script>
let param = {frameColor:"red",frameBackgroundColor:"green",contentBackgroundColor:"white"}
docuskyGetDbCorpusDocumentsSimpleUI.utility.setStyle(param);
</script>
```

*docusky.ui.manageDataFileListSimpleUI.js*
---
To upload, retrieve, rename and delete data except DocuXML, you need to use this widget.

### `docuskyManageDataFileListSimpleUI.Error`

#### Description:
This is a global property for the developers to set a callback function when functions in this widget occurrs an error. If you invoke a function without setting a `fail(error)` callback function in the argument, `docuskyManageDataFileListSimpleUI.Error` will be invoked. `docuskyManageDataFileListSimpleUI.Error` will receive `Connection Error` or `Server Error` when an error occurred. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.Error = function(data){

    if(data=="Connection Error"){
        console.log("This is a connection error.")
    }
    else if("Server Error"){
        console.log("This is a server error.")
    }

}
</script>
```

### `docuskyManageDataFileListSimpleUI.maxResponseTimeout`

#### Description:
This is the value of `maxResponseTimeout` for uploading data via `docuskyManageDataFileListSimpleUI.jsonTransporter.storeJson`.
The default value is `300000` (5 minutes).
For example, it could be used as following:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.maxResponseTimeout = 600000;
// It means maxResponseTimeout is 10 minutes.
</script>
```

### `docuskyManageDbListSimpleUI.maxRetryCount`

#### Description:
If the developers don't set any fail callback function while invoking the functions in this widget, it will retry the invoked function automatically. The number of times of retrial is defined in `docuskyManageDataFileListSimpleUI.maxRetryCount`, and the default value is `10`. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.maxRetryCount = 20;
// It means maxRetryCount is 20.
</script>
```

### `docuskyManageDataFileListSimpleUI.uploadProgressFunc`

#### Description:
This is a global property for the developers to set a callback function for uploading data. If `docuskyManageDataFileListSimpleUI.jsonTransporter.storeJson` is invoked for uploading data successfully, `docuskyManageDataFileListSimpleUI.uploadProgressFunc` will receive the progress percentage of uploading. For example, it could be used as following:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.uploadProgressFunc = function(percentage){
    console.log("The percentage is" + percentage);
}
</script>
```

### `docuskyManageDataFileListSimpleUI.jsonTransporter.storeJson(category, datapath, filename, jsonObj, succFunc, failFunc)`

#### Description:
Store JSON, CSV, or TXT.

##### `category`
Type: String

##### `datapath`
Type: String

##### `filename`
Type: String

##### `jsonObj`
Type: Object
The object wiil be stored.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.jsonTransporter.storeJson("gis", "web","1.json", "I love it", function(){
 console.log("OK");
})
</script>
```

### `docuskyManageDataFileListSimpleUI.jsonTransporter.retrieveJson(category, datapath, filename, succFunc, failFunc)`

#### Description:
Retrieve JSON, CSV, or TXT.
The data will be stroed in `docuskyManageDataFileListSimpleUI.jsonTransporter.jsonObj`.
##### `category`
Type: String

##### `datapath`
Type: String

##### `filename`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.jsonTransporter.retrieveJson("gis", "web","1.json",
    function(){
     console.log("OK");}
 )
</script>
```

### `docuskyManageDataFileListSimpleUI.jsonTransporter.deleteDataFile(category, datapath, filename, succFunc, failFunc)`

#### Description:
Delete JSON, CSV, or TXT in the widget.

##### `category`
Type: String

##### `datapath`
Type: String

##### `filename`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.jsonTransporter.deleteDataFile("gis", "web","1.json",
    function(){
     console.log("OK");}
 )
</script>
```

### `docuskyManageDataFileListSimpleUI.jsonTransporter.listCategoryDataFiles(category, datapath, succFunc, failFunc)`

#### Description:
Get list of data files in the specific category and datapath. The list will be stroed in `docuskyManageDataFileListSimpleUI.jsonTransporter.jsonObj`.

##### `category`
Type: String

##### `datapath`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.jsonTransporter.listCategoryDataFiles("gis", "web",
    function(){
     console.log("OK");}
 )
</script>
```

### `docuskyManageDataFileListSimpleUI.jsonTransporter.renameDataFile(category, datapath, fromFilename, toFilename, succFunc, failFunc)`

#### Description:
Rename a file.

##### `category`
Type: String

##### `datapath`
Type: String

##### `fromFilename`
Type: String

##### `toFilename`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.jsonTransporter.renameDataFile("gis", "web","1.json","2.json",
    function(){
     console.log("OK");}
 )
</script>
```

### `docuskyManageDataFileListSimpleUI.login(username, password, succFunc, failFunc)`

#### Description:
It is used for user login.

##### `username`
Type: String
The username is usually an Email.

##### `password`
Type: String

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.login("username", "password", function(){ console.log("OK");},
function(){console.log("No");});
</script>
```

### `docuskyManageDataFileListSimpleUI.hideWidget(is_hidden)`

#### Description:
It is used for hidding this widget display on the web. The widget is displayed on the web as default.

##### `is_hidden`
Type: Boolean
Whether or not the widget is hidden.

#### Example:
```gherkin=
<script>
docuskyManageDataFileListSimpleUI.hideWidget(true);
// Hide the widget;

docuskyManageDataFileListSimpleUI.hideWidget(false);
// Display the widget;
</script>
```

### `docuskyManageDataFileListSimpleUI.manageDataFileList(evt, succFunc, failFunc)`

#### Description:
It is used to open the widget UI and get list of data files. The list of data files will be stored in `docuskyManageDataFileListSimpleUI.categoryFilenameList`.

##### `evt`
Type: Event
`docuskyManageDataFileListSimpleUI.manageDataFileList` will be triggered by an event. If there is no event, it could be `null`.

##### `succFunc`
Type: Function
The callback function to execute when it is successful.

##### `failFunc`
Type: Function
The callback function to execute when it is failed.

### `docuskyManageDataFileListSimpleUI.utility.setStyle(param)`

#### Description:
It is used to set the style of the widget UI.

##### `param`
Type: Object
Set the property of param as below.
```
param = {
frameColor:"red", // It is used to set font color of the frame.
frameBackgroundColor:"green", // It is used to set background color of the frame.
contentBackgroundColor:"white" // It is used to set background color of the content.
}
```

#### Example:
```gherkin=
<script>
let param = {frameColor:"red",frameBackgroundColor:"green",contentBackgroundColor:"white"}
docuskyManageDataFileListSimpleUI.utility.setStyle(param);
</script>
```

/*
 * docusky.ui.utility.js
 * (URL)
 *
 * (Description)
 * 這是給 DocuWidgets 使用的 utility
 * Note: - this component is only tested in Firefox and Chrome
 *       - requires jquery
 *
 * @version
 * 0.01 (May 13 2019)
 *
 * @copyright
 * Copyright (C) 2019 Hsieh-Chang Tu
 *
 * @license
 *
 */


 if (window.navigator.userAgent.indexOf("MSIE ") > 0) {
    alert("抱歉，DocuSky 工具目前只支援 Firefox 與 Chrome");
 }

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

    basename: function(path) {
       return path.replace(/.*[/]/, "");
    },

    dirname: function(path) {
       return path.match(/(.*)[/]/)[1];
    },

    uniqueId: (function() {
       var counter = 0;
       return function() {
          //console.log(counter);
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

    displayJson: function(jsonObj) {
       //var jsonStr = $("pre").text();
       //var jsonObj = JSON.parse(jsonStr);
       var jsonPretty = JSON.stringify(jsonObj, null, '\t');
       alert(jsonPretty);
    },

    //2019-05-06
    setStyle: function(param){
      if (typeof(param) !== 'object') param = {};
      if('frameBackgroundColor' in param){
        $("div.dsw-container").css('border', param.frameBackgroundColor+' solid 3px');
        $("div.dsw-titleBar").css('background-color', param.frameBackgroundColor);
      }
      if('frameColor' in param){
        $("div.dsw-titleBar").css('color', param.frameColor);
      }
      if('contentBackgroundColor' in param){
        $("div.dsw-container").css('background-color', param.contentBackgroundColor);
      }
    },
    //20190515
    setLoadingIcon: function(url){
      let loadingSignId = null;

      loadingSignId = docuskyManageDbListSimpleUI.idPrefix + "loadingSign" + docuskyManageDbListSimpleUI.uniqueId;
      $("#"+loadingSignId+" img").attr("src", url);

      loadingSignId = docuskyGetDbCorpusDocumentsSimpleUI.idPrefix + "loadingSign" + docuskyGetDbCorpusDocumentsSimpleUI.uniqueId;
      $("#"+loadingSignId+" img").attr("src", url);
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

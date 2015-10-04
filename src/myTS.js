// ==UserScript==
// @name        Lyrics163
// @namespace   Lyrics163
// @description Lyrics163
// @include     http://music.163.com/*
// @version     1
// @grant       none
// ==/UserScript==

"use strict";

var SITE_6PARK = 1;
var SITE_PTT = 2;
var SITE_YAHOO = 3;
var SITE_EYNY = 4;
var SITE_CMSHY = 5;

var gbStop = false;
var giNowTabId = 0;
var gaData = [];
var gaasDataUrl = [];
var gaasExtension = [];

var gbTextDone = false;
var gbImageDone = false;

var gChecked = {
        word: true,
        phoneticSymbol: true,
        sound: false,
        lexical: true,
        explanation: true,
        example: true
    };

//window.onload = init;

init();

function init()
{
    console.log("[YD]INIT");

    //setLayout();  

    updateSetting();

    addListener();
}

function updateSetting()
{
    setNowTabId();
}

function addListener()
{
    //var eDiv = document.getElementById("BUTTON_ID");
    //eDiv.addEventListener("click", clickSearchButton);
    
    chrome.extension.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.greeting == "OutputText")
            {
                log("OutputText");
                var eDiv = document.getElementById("OUTPUT_TEXT_ID");
                if (eDiv)
                {
                    eDiv.click();
                }
                
                var eImageZipDiv = document.getElementById("OUTPUT_IMAGE_ZIP_ID");
                if (eImageZipDiv)
                {
                    eImageZipDiv.click();
                }
            }
            else if (request.greeting == "GetTabIdBack")
            {
                giNowTabId = request.tabId;
                log("GetTabIdBack:" + request.tabId);
                
                createText(); // start this extension after the tab is set
            }
            else if (request.greeting == "StopExecution")
            {
                log("StopExecution");
                gbStop = true;
            }
    });
}

function createText()
{
    gaData = [];
    
    var sFirstUrl = window.location.href;
    
    if ((sFirstUrl.indexOf("/forum") > 0 && sFirstUrl.indexOf("&tid=") < 0) ||
        (sFirstUrl.indexOf("/search.php") > 0))
    {
        return;
    }
    
    // OLD: http://www.eyny.com/forum.php?mod=viewthread&tid=8268832&highlight=%E8%87%B4%E5%91%BD%E6%AD%A6%E5%8A%9B
    // NEW: http://www.eyny.com/thread-8268832-1-1.html
    if (sFirstUrl.indexOf("http://www.eyny.com/") == 0 && 
        sFirstUrl.indexOf("&tid=") > 0)
    {
        var sTid = sFirstUrl.split("&tid=")[1].split("&")[0];
        sFirstUrl = "http://www.eyny.com/thread-" + sTid + "-1-1.html";
        
        window.location.href = sFirstUrl;
        
        log("EYNY new url:" + sFirstUrl);
    }
    
    var eBody = document.getElementsByTagName("body")[0];
    var eTitle = document.getElementsByTagName("title")[0];
    var ePre = document.getElementsByTagName("pre")[0];
    var ePtt = document.getElementById("main-content");
    var eYahoo = document.getElementById("mediaarticlebody");
    var aeEyny = document.getElementsByClassName("t_fsz");
    var aePage = document.getElementsByClassName("pg");
    var aeCmshy = document.getElementsByClassName("dccss"); // main page
    var eCmshy = document.getElementById("content"); // single page
    
    var sTitle, sText
    var sHtml, sUrl;
    var iBegin, iEnd;
    var sOriginalTitle = "";
    var iTotalCount, sMainTitle;
    var i;
    
    gbImageDone = gbTextDone = true; // purpose there are no images and no multiple pages.
    
    if (eTitle)
    {
        sOriginalTitle = eTitle.innerHTML.trim();
        
        sTitle = removeUnallowedWordInFileName(getRegularText(sOriginalTitle));
        log("Exist <title> : " + sTitle);
    }
    
    if (ePre)
    {
        log("Exist <pre>");

        sText = sTitle + "\r\n\r\n" + getRegularText(ePre.innerHTML, true);
    }
    else if (aePage && aePage.length > 0)
    {
        gbImageDone = gbTextDone = false;
        
        log("Exist multile pages");
        
        sMainTitle = sTitle;
        
        sHtml = aePage[0].innerHTML;
        
        sHtml = sHtml.split("\"nxt\"")[0];
        
        var asHtml = sHtml.split(" href=");
        sHtml = asHtml[asHtml.length - 2]; // get the html of last page
        asHtml = sHtml.split("\"");
        sHtml = asHtml[1]; // get the url of last page
        asHtml = sHtml.split("/");
        sHtml = asHtml[asHtml.length - 1]; // get the html file name of last page
        var iLastPageNum = parseInt(sHtml.split("-")[2], 10);
        
        if (isNaN(iLastPageNum))
        {
            log("Cannot get last page : " + sHtml);
            return;
        }
        
        log("Total " + iLastPageNum + " pages");
        
        
        
        for (i = 1; i <= iLastPageNum; i++)
        {
            gaasExtension[i - 1] = [];
            gaasDataUrl[i - 1] = [];

            sUrl = sFirstUrl.replace("-1-", "-" + i + "-");
            sTitle = "" + i;
            sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_EYNY, iLastPageNum, i - 1);
            
            log("Request " + i + ":" + sTitle + ":" + sUrl);
        }
    }
    else if (aeEyny && aeEyny.length > 0) // only single EYNY page
    {
        gbImageDone = gbTextDone = false;
        
        sMainTitle = sTitle;

        /*
        sText = sTitle + "\r\n\r\n";
        
        for (i = 0; i < aeEyny.length; i++)
        {
            sText += "<br><br>" + aeEyny[i].innerHTML;
        }
        
        sText = getRegularText(sText);
        
        log("IMAGE Exist:" + getImageUrls(eBody.innerHTML, SITE_EYNY));
        */
        
        gaasExtension[0] = [];
        gaasDataUrl[0] = [];
        
        sendHttpRequest(sFirstUrl, handleSingle, sMainTitle, "", SITE_EYNY, 1, 0);
        
        
    }
    else if (ePtt || eYahoo)
    {
        var eTempDiv = ePtt || eYahoo;
        sText = getRegularText(eTempDiv.innerHTML, true);
    }
    else if (aeCmshy && aeCmshy.length > 1)
    {
        log("Exist aeCmshy");
        
        var abExisted = [];
        iTotalCount = 0;
        sMainTitle = sTitle;
        
        for (i = 0; i < aeCmshy.length; i++)
        {
            if (aeCmshy[i].innerHTML.indexOf("/chapter") > 0)
            {
                abExisted[i] = true;
                iTotalCount++;
            }
            else
            {
                abExisted[i] = false;
            }
        }
        
        for (i = 0; i < aeCmshy.length; i++)
        {
            if (!abExisted[i])
            {
                continue;
            }
            
            sHtml = aeCmshy[i].innerHTML;
            iBegin = sHtml.indexOf("/chapter");
            iEnd = sHtml.indexOf("\"", iBegin);
            sUrl = "http://www.cmshy.com" + sHtml.substring(iBegin, iEnd);
            
            iBegin = sHtml.indexOf(">", iEnd) + 1;
            iEnd = sHtml.indexOf("<", iBegin);
            sTitle = sHtml.substring(iBegin, iEnd).trim();
            
            log("Request " + i + ":" + sTitle + ":" + sUrl);
            
            sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_CMSHY, iTotalCount, i);
            //break;
        }
    }
    else if (eCmshy)
    {
        log("Exist eCmshy");
        sText = sTitle + "\r\n\r\n" + getRegularText(eCmshy.innerHTML);
    }
    else // common case
    {
        log("common case");
        
        var aeDiv = document.getElementsByTagName("div");
        var iLength = 0;
        var sTempText = "";
        
        for (i = 0; i < aeDiv.length; i++)
        {
            sHtml = aeDiv[i].innerHTML;
            if (sHtml.indexOf("</script>") > 0 ||
                sHtml.indexOf("</style>") > 0)
            {
                continue;
            }
            
            sTempText = getRegularText(sHtml);
            if (iLength < sTempText.length)
            {
                iLength = sTempText.length;
                sText = sTempText;
            }
        }
        
        // parse the whole body if the parsed text is too short
        if (sText.length < 1000)
        {
            sText = getRegularText(eBody.innerHTML);            
        }
    }
    
    
    if (sText)
    {
        sText += getInformation(sOriginalTitle);
    }
    
    if (sText && sTitle && gbImageDone)
    {
        setDownloadButton(sTitle, sText);
        
        log("Text complete parsed : " + sText.length);
        
        setIconText("OK!");
    }
}

function getImageUrls(sHtml, iSite)
{
    var asUrl = [];
    var asTemp, asTemp2, sUrl;
    
    if (iSite == SITE_EYNY)
    {
        asTemp = sHtml.split(" id=\"aimg");

        for (var i = 1; i < asTemp.length; i++)
        {
            asTemp2 = asTemp[i].split(" file=\"");
            
            if (asTemp2.length < 2)
            {
                continue;
            }
            
            sUrl = asTemp2[1].split("\"")[0];
            
            if (sUrl.indexOf("http") == 0)
            {
                asUrl[asUrl.length] = decodeHTMLEntities(sUrl);
            }
        }
    }
    return asUrl;
}

function decodeHTMLEntities(str) 
{
    if(str && typeof str === 'string') 
    {
        var element = document.createElement('div');
        
        // strip script/html tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
        element.innerHTML = str;
        str = element.textContent;
    }

    return str;
}

function setNowTabId()
{
    chrome.extension.sendMessage({
        msg: "GetTabId"
    }, function(response) {
        /* not work...
        console.log("GetTabId OK:" + response.tabId);
        
        giNowTabId = response.tabId;
        */
    });
}

function setIconText(sText)
{   
    chrome.extension.sendMessage({
        msg: "SetIconText",
        text: sText,
        tabId: giNowTabId
    }, function(response) {
        //console.log("SetIconTextDone");
    });
}

function setDownloadButton(sTitle, sText)
{
    var blob = new Blob([sText], {type: "text/plain;charset=utf-8"});
    var sUrl = URL.createObjectURL(blob);
    
    var eDiv = document.createElement("a");
    //eDiv = document.getElementById("OUTPUT_TEXT_ID");
    eDiv.id = "OUTPUT_TEXT_ID";
    eDiv.href = sUrl;
    eDiv.download = sTitle + ".txt";

    var eBody = document.getElementsByTagName("body")[0];
    eBody.appendChild(eDiv);
}

function setImageDownloadButton(sTitle)
{
    var bNoImage = true;
    var zipImage = new JSZip();
    var zipDir = zipImage.folder(sTitle);
    
    for (var i = 0; i < gaasDataUrl.length; i++)
    {
        for (var j = 0; j < gaasDataUrl[i].length; j++)
        {
            var sFileName = "" + i + "" + (j + 1) + gaasExtension[i][j];
            zipDir.file(sFileName, dataUrlToBase64(gaasDataUrl[i][j]), {base64: true});
            
            bNoImage = false;
        }
    }
    
    if (bNoImage)
    {
        return;
    }
    
    var blob = zipImage.generate({type:"blob"});
    var blobUrl = URL.createObjectURL(blob);
    
    var eDiv = document.createElement("a");
    eDiv.id = "OUTPUT_IMAGE_ZIP_ID";
    eDiv.href = blobUrl;
    eDiv.download = sTitle + ".cbz";
    
    log("Image zip file is created");
    
    var eBody = document.getElementsByTagName("body")[0];
    eBody.appendChild(eDiv);
}

function dataUrlToBase64(sDataUrl)
{
    var iBegin = sDataUrl.indexOf( "," ) + 1;
    return sDataUrl.substring( iBegin, sDataUrl.length );
}

function removeTag(sText)
{
    return sText.replace(/(<([^>]+)>)/ig, "").trim();
}

function getNowTime() 
{
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    
    return year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
}



function getInformation(sTitle)
{
    var sText = "\r\n\r\n\r\n===================================================";
    
    sText += "\r\n建立文件時間 : " + getNowTime();
    sText += "\r\n原始文章標題 : " + sTitle;
    sText += "\r\n原始網路位址 : " + window.location.href;
    
    return sText;
}

function _arrayBufferToBase64( buffer ) 
{
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function handleSingleImage()
{
    if (this.readyState == 4)
    {
        var arr = new Uint8Array(this.response);

        /*
        // Convert the int array to a binary string
        // We have to use apply() as we are converting an *array*
        // and String.fromCharCode() takes one or more single values, not
        // an array.
        var raw = String.fromCharCode.apply(null, arr);

        // This works!!!
        var b64 = btoa(raw);
        */
        var b64 = _arrayBufferToBase64(arr);
        var sBefore = gaasExtension[this.nowPage][this.index].indexOf("jpg") > 0 ? "data:image/jpeg;base64," : "data:image/png;base64,";
        var dataUrl = sBefore + b64;
        
        gaasDataUrl[this.nowPage][this.index] = dataUrl;
        
        if (!checkImageAllDone(this.mainTitle, this.total))
        {
            // set icon for image ??
        }

        log("Image " + this.nowPage + "-" + this.index + " is received:" + dataUrl.length);
    }
}

function handleSingle()
{
    if (this.readyState == 4)
    {
        if (gaData[this.index])
        {
            return;
        }

        console.log("-------------" + this.index + "----------------");
        
        var sHtml = this.responseText;
        var index = this.index;
        var sTitle = this.title;
        var iTotal = this.total;
        var sMainTitle = this.mainTitle;
        
        var iBegin, iEnd;
        var i, j;
        var sText, sTemp;
        

        if (this.site == SITE_CMSHY)
        {
            iBegin = sHtml.indexOf("id=\"content\"");
            iBegin = sHtml.indexOf(">", iBegin) + 1;
            iEnd = sHtml.indexOf("</div>", iBegin);
            sText = sHtml.substring(iBegin, iEnd).trim();
            
            /* // 1. synchronous method
            sText = getRegularText(sText, true);
            
            gaData[this.index] = this.title + "\r\n\r\n" + sText;
            
            setIconText("" + parseInt((getDoneCount() * 100 / this.total), 10) + "%");
            */
            
            // 2. asynchronous method
            async(function() {
                sTitle = getRegularText(sTitle);
                sText = getRegularText(sText);
            }, function() {
                gaData[index] = sTitle + "\r\n\r\n" + sText;
                setIconText("" + parseInt((getDoneCount() * 100 / iTotal), 10) + "%");
                log(" " + index + " parse done: LEN:" + sText.length);
                
                checkAllDone(sMainTitle, iTotal);
            });
        }
        else if (this.site == SITE_EYNY)
        {
            sText = "";
            
            //log("IMAGE Exist:" + getImageUrls(sHtml, SITE_EYNY));
            
            var asImageUrl = getImageUrls(sHtml, SITE_EYNY);
            var iFileType;
            
            for (i = 0; i < asImageUrl.length; i ++)
            {
                gaasExtension[index][i] = asImageUrl[i].toLowerCase().indexOf(".png") > 0 ? ".png" : ".jpg";
                sendImageHttpRequest(asImageUrl[i], handleSingleImage, sMainTitle, SITE_EYNY, index, asImageUrl.length, i);
                
                log("Request Image " + i + ":" + asImageUrl[i]);
            }
            
            var bNoImage = true;
            for (i = 0; i < iTotal; i++)
            {
                if (gaasExtension[i] && gaasExtension[i].length > 0)
                {
                    bNoImage = false;
                    break;
                }
            }
            
            if (iTotal == index + 1 && bNoImage)
            {
                gbImageDone = true; // there are no images
            }
            
            var eDiv = document.createElement("div");
            
            eDiv.innerHTML = sHtml;
            var aeEyny = eDiv.getElementsByClassName("t_fsz");

            for (i = 0; i < aeEyny.length; i++)
            {
                sText += "<br><br>" + aeEyny[i].innerHTML;
            }
            
            async(function() {
                sTitle = getRegularText(sTitle);
                sText = getRegularText(sText);
            }, function() {
                gaData[index] = sTitle + "\r\n\r\n" + sText;
                
                if (!checkAllDone(sMainTitle, iTotal))
                {
                    setIconText("" + parseInt((getDoneCount() * 100 / iTotal), 10) + "%");
                }
                log(" " + index + " parse done: LEN:" + sText.length);
            });
        }
        
        log("Orignial " + index + " LEN:" + sText.length);
    }
}

function checkAllDone(sMainTitle, iTotal)
{
    if (isAllDone(iTotal))
    {
        gbTextDone = true;
        
        var sText = dataToText() + getInformation(sMainTitle);
        setDownloadButton(sMainTitle, sText);

        if (gbImageDone)
        {
            setIconText("OK-");
        }
        
        log("Total " + iTotal + " volumes are all done !");
        
        return true;
    }
    
    return false;
}

function checkImageAllDone(sMainTitle, iTotal)
{
    if (isImageAllDone(iTotal))
    {
        gbImageDone = true;
        
        setImageDownloadButton(sMainTitle);
        
        if (gbTextDone)
        {
            setIconText("OK+");
        }
        
        log("Total " + iTotal + " images are all done !");
        
        return true;
    }
    
    return false;
}

function getDoneCount()
{
    var iCount = 0;
    
    for (var i = 0; i < gaData.length; i++)
    {
        if (gaData[i])
        {
            iCount++;
        }
    }
    
    return iCount;
}

function dataToText()
{
    var sText = "";
    
    for (var i = 0; i < gaData.length; i++)
    {
        sText += gaData[i] + "\r\n\r\n";
        
        if ((i + 1) != gaData.length)
        {
            sText += "======================== " + (i + 1);
            sText += " ========================\r\n\r\n";
        }
    }
    
    return sText;
}

function isAllDone(iTotalCount)
{
    for (var i = 0; i < iTotalCount; i++)
    {
        if (gaData.length < i || !gaData[i])
        {
            return false;
        }
    }
    
    return true;
}

function isImageAllDone(iTotalCount)
{
    for (var i = 0; i < gaasExtension.length; i++)
    {
        if (gaasDataUrl[i].length < gaasExtension[i].length)
        {
            return false;
        }
        
        for (var j = 0; j < gaasDataUrl[i].length; j++)
        {
            if (!gaasDataUrl[i][j])
            {
                return false;
            }
        }
    }
    
    return true;
}

function sendHttpRequest(sUrl, onReadyFunction, sMainTitle, sTitle, iSite, iTotal, i)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReadyFunction;
    xhr.open("GET", sUrl, true);
    xhr.send();
    xhr.index = i;
    xhr.total = iTotal;
    xhr.title = sTitle;
    xhr.mainTitle = sMainTitle;
    xhr.site = iSite;
}

function sendImageHttpRequest(sUrl, onloadFunction, sMainTitle, iSite, iNowPage, iTotal, i)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = onloadFunction;
    xhr.open("GET", sUrl, true);
    xhr.send();
    xhr.index = i;
    xhr.total = iTotal;
    xhr.mainTitle = sMainTitle;
    xhr.site = iSite;
    xhr.nowPage = iNowPage;
}

function async(fFunction, callback) 
{
    setTimeout(function() {
        fFunction();
        if (callback) {callback();}
    }, 0);
}

function removeUnallowedWordInFileName(sFileName)
{
    // ex. OLD : [1\2/3:4*5?6"7<8>9|]
    //     NEW : [1 2 3 4 5 6 7 8 9 ]
    return sFileName.replace(/\\|\/|:|\*|\?|"|<|>|\|/g, " ");
}

function getRegularText(sText, bPre)
{
    sText = sText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""); // remove the js
    sText = sText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ""); // remove the css
    
    if (!bPre)
    {
        sText = sText.replace(/\r/g, "");
        sText = sText.replace(/\n/g, "");
        sText = sText.replace(/	/g, "");
        sText = sText.replace(/>\s+</g, "><");
        sText = sText.replace(/<span/g, "\r\n<span");
    }
    
    sText = sText.replace(/<\/div><div class=\"article/g, "\r\n</div><div class=\"article");
    sText = sText.replace(/<br/g, "\r\n<br");
    sText = sText.replace(/<\/p><p>/g, "\r\n</p><p>");
    sText = sText.replace(/<p align/g, "\r\n<p align");
    sText = removeTag(sText);
    sText = sText.replace(/ -6park.com|留园网-|www.6park.com/g, "");
    
    sText = sText.replace(/&nbsp;/g, " ");
    sText = sText.replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    sText = sText.replace(/&quot;/g, "\"").replace(/&amp;/g,'&');
    
    var asTemp = sText.split(" - ");
    if (sText.length < 100 && asTemp.length >= 3)
    {
        sText = asTemp[0].trim();
    }
    
    /*
    if (!bSC2TC)
    {
        return sText; // no need to Simplified Chinese -> Traditional Chinese
    }
    
    var sOutput = "";
    var sWord = "";
    var iTextLength = sText.length;
    var iDataLength = SC2TC_DATA.length;
    
    
    for (var i = 0; i < iTextLength; i++)
    {
        sWord = sText[i];
        for (var j = 0; j < iDataLength; j++)
        {
            if (sText[i] == SC2TC_DATA[j][0])
            {
                //console.log("" + SC2TC_DATA[j][0] + "->" + SC2TC_DATA[j][1]);
                sWord = SC2TC_DATA[j][1];
                break;
            }
        }
        
        sOutput += sWord;
    }
    
    return sOutput;
    */
    
    for (var i = 0; i < SC2TC_DATA.length; i++)
    {
        sText = sText.replace(new RegExp(SC2TC_DATA[i][0], "g"), SC2TC_DATA[i][1]);
    }
    
    return sText;
}

function log(sText)
{
    console.log("[TS]" + sText);
}

/*

TODO :
    1. http://www.cmshy.com/book/504.html
    

*/
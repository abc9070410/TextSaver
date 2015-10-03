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
                console.log("[TS]OutputText");
                var eDiv = document.getElementById("OUTPUT_TEXT_ID");
                eDiv.click();
            }
            else if (request.greeting == "GetTabIdBack")
            {
                giNowTabId = request.tabId;
                console.log("[TS]GetTabIdBack:" + request.tabId);
                
                createText(); // start this extension after the tab is set
            }
            else if (request.greeting == "StopExecution")
            {
                console.log("[TS]StopExecution");
                gbStop = true;
            }
    });
}

function createText()
{
    gaData = [];
    
    var eTitle = document.getElementsByTagName("title")[0];
    var ePre = document.getElementsByTagName("pre")[0];
    var ePtt = document.getElementById("main-content");
    var eYahoo = document.getElementById("mediaarticlebody");
    var aeEyny = document.getElementsByClassName("t_fsz");
    var aeCmshy = document.getElementsByClassName("dccss"); // main page
    var eCmshy = document.getElementById("content"); // single page
    
    var sTitle, sText
    var sHtml, sUrl;
    var iBegin, iEnd;
    var sOriginalTitle = "";
    var iTotalCount, sMainTitle;
    var i;
    
    if (eTitle)
    {
        sOriginalTitle = eTitle.innerHTML.trim();
        
        sTitle = getRegularText(sOriginalTitle, true);
        console.log("[TS]Exist <title> : " + sTitle);
    }
    
    if (ePre)
    {
        console.log("[TS]Exist <pre>");

        sText = sTitle + "\r\n\r\n" + getRegularText(ePre.innerHTML, true, true);
    }
    else if (aeEyny && aeEyny.length > 0)
    {
        sText = sTitle + "\r\n\r\n";
        
        for (i = 0; i < aeEyny.length; i++)
        {
            sText += "\r\n\r\n" + getRegularText(aeEyny[i].innerHTML, false);
        }
    }
    else if (ePtt || eYahoo)
    {
        var eTempDiv = ePtt || eYahoo;
        sText = getRegularText(eTempDiv.innerHTML, false, true);
    }
    else if (aeCmshy && aeCmshy.length > 1)
    {
        console.log("[TS]Exist aeCmshy");
        
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
            
            console.log("[TS]Request " + i + ":" + sTitle + ":" + sUrl);
            
            sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_CMSHY, iTotalCount, i);
            //break;
        }
    }
    else if (eCmshy)
    {
        console.log("[TS]Exist eCmshy");
        sText = sTitle + "\r\n\r\n" + getRegularText(eCmshy.innerHTML, true);
    }
    else // common case
    {
        console.log("[TS]common case");
        
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
            
            sTempText = getRegularText(sHtml, false);
            if (iLength < sTempText.length)
            {
                iLength = sTempText.length;
                sText = sTempText;
            }
        }
    }
    
    
    if (sText)
    {
        sText += getInformation(sOriginalTitle);
    }
    
    if (sText && sTitle)
    {
        setDownloadButton(sTitle, sText);
        
        console.log("[TS]Text complete parsed : " + sText.length);
        
        setIconText("OK");
    }
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

function removeTag(sText)
{
    return sText.replace(/(<([^>]+)>)/ig, "").trim();
}

function getRegularText(sText, bSC2TC, bPre)
{
    if (!bPre)
    {
        sText = sText.replace(/\r/g, "");
        sText = sText.replace(/\n/g, "");
    }
    
    sText = sText.replace(/<\/div><div class=\"article/g, "\r\n</div><div class=\"article");
    sText = sText.replace(/<br/g, "\r\n<br");
    sText = sText.replace(/<\/p><p>/g, "\r\n</p><p>");
    sText = removeTag(sText);
    sText = sText.replace(/ -6park.com|留园网-/g, "");
    sText = sText.replace(/&nbsp;/g, " ");
    
    var asTemp = sText.split(" - ");
    if (sText.length < 100 && asTemp.length == 3)
    {
        sText = asTemp[0].trim();
    }
    
    if (!bSC2TC)
    {
        return sText; // no need to Simplified Chinese -> Traditional Chinese
    }
    
    var sOutput = "";
    var sWord = "";
    var iTextLength = sText.length;
    var iDataLength = uft8Data.length;
    
    for (var i = 0; i < iTextLength; i++)
    {
        sWord = sText[i];
        for (var j = 0; j < iDataLength; j++)
        {
            if (sText[i] == uft8Data[j][0])
            {
                //console.log("" + uft8Data[j][0] + "->" + uft8Data[j][1]);
                sWord = uft8Data[j][1];
                break;
            }
        }
        
        sOutput += sWord;
    }
    
    return sOutput;
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

function outputData()
{
    var sOutput = "var uft8Data = [";
    
    for (var i = 0; i < uft8Data.length; i++)
    {
        if (uft8Data[i][0] != uft8Data[i][1])
        {
            sOutput += "\"" + uft8Data[i][0] + uft8Data[i][1] + "\", ";
        }
    }
    
    sOutput += "\r\n];";
    
    return sOutput;
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
        var iBegin, iEnd;
        var i, j, index, iTotal;
        var sText, sTitle, sMainTitle;

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
            index = this.index;
            sTitle = this.title;
            iTotal = this.total;
            sMainTitle = this.mainTitle;
            async(function() {
                sText = getRegularText(sText, true);
            }, function() {
                gaData[index] = sTitle + "\r\n\r\n" + sText;
                setIconText("" + parseInt((getDoneCount() * 100 / iTotal), 10) + "%");
                console.log("[TS] " + index + " parse done: LEN:" + sText.length);
                
                
                if (isAllDone(iTotal))
                {
                    sText = dataToText() + getInformation(sMainTitle);
                    setDownloadButton(sMainTitle, sText);
                    
                    setIconText("OK!");
                    
                    console.log("[TS]Total " + iTotal + " volumes are all done !");
                }
            });
            
            console.log("[TS]Orignial " + this.index + " LEN:" + sText.length);
        }
    }
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
        sText += "============================" + (i + 1);
        sText += "============================\r\n\r\n";
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

function async(fFunction, callback) 
{
    setTimeout(function() {
        fFunction();
        if (callback) {callback();}
    }, 0);
}

/*

TODO :
    1. http://www.cmshy.com/book/504.html
    

*/
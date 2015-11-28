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
var SITE_LKNOVEL = 6;
var SITE_LINOVEL = 7;
var SITE_MOJIM = 8;

var END_SYMBOL = "≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡";

var gbStop = false;
var giNowTabId = 0;
var gaData = [];
var gaasImageDataUrl = [];
var gaasImageFileName = [];

// The information for Epub
var gasChapterContent = [];
var gasChapterTitle = [];
var gsBookAuthor;
var gsBookTitle;
var gbTitleAndAuthorParsed = false;


var gbTextDone = false;
var gbImageDone = false;

var gEpub;

var gbNeedDownloadText = true;
var gbNeedDownloadImage = true;
var gbNeedDownloadEpub = true;

//window.onload = init;

init();

function init()
{
    log("INIT");
    
    //setLayout();  

    updateSetting();

    addListener();
}

function updateSetting()
{
    setNowTabId();
    
    chrome.extension.sendMessage({
        msg: "GetDownloadOption",
    }, function(response) {
        log("GetDownloadOption Done : " + response.checked);
        
        gbNeedDownloadText = response.checked[0];
        gbNeedDownloadImage = response.checked[1];
        gbNeedDownloadEpub = response.checked[2];
    });
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
                
                var eEpubDiv = document.getElementById("OUTPUT_EPUB_ID");
                if (eEpubDiv)
                {
                    eEpubDiv.click();
                }
            }
            else if (request.greeting == "GetTabIdBack")
            {
                giNowTabId = request.tabId;
                log("GetTabIdBack:" + request.tabId);
                
                setIconText(""); // init icon
                
                createText(); // start this extension after the tab is set
            }
            else if (request.greeting == "StopExecution")
            {
                log("StopExecution");
                gbStop = true;
            }
    });
}


function downloadText(sFileName, sText)
{
    var blob = new Blob([sText], {type: "text/plain;charset=utf-8"});
    var sUrl = URL.createObjectURL(blob);

    var eDiv = document.createElement("a");
    eDiv.id = "DOWNLOAD_TEXT_FILE_ID";
    eDiv.href = sUrl;
    eDiv.download = sFileName + ".txt";
    eDiv.target = "_blank";
    
    document.getElementsByTagName("body")[0].appendChild(eDiv);
    
    eDiv.click();
}

function createText()
{
    gaData = [];
    
    var sFirstUrl = window.location.href;
    
    if ((sFirstUrl.indexOf("/forum") > 0 && sFirstUrl.indexOf("&tid=") < 0 && sFirstUrl.indexOf("?tid") < 0) ||
        (sFirstUrl.indexOf("/search.php") > 0))
    {
        log("Not Parse : " + sFirstUrl);
        return;
    }
    
    checkNowUrl(sFirstUrl); // relocate url if necessary
    
    var eBody = document.getElementsByTagName("body")[0];
    var eTitle = document.getElementsByTagName("title")[0];
    var ePre = document.getElementsByTagName("pre")[0];
    var ePtt = document.getElementById("main-content");
    var eYahoo = document.getElementById("mediaarticlebody");
    var eLKnovel = document.getElementById("tongyong2");
    var aeLInovel = document.getElementsByClassName("linovel-book-list");
    var eLInovel = document.getElementById("J_content");
    var eMojim = document.getElementById("fsZ");

    
    var aeEyny = document.getElementsByClassName("t_fsz");
    var aePage = document.getElementsByClassName("pg");
    var aeCmshy = document.getElementsByClassName("dccss"); // main page
    var eCmshy = document.getElementById("content"); // single page
    
    
    
    var sTitle, sText
    var sHtml, sUrl;
    var iBegin, iEnd;
    var sOriginalTitle = "";
    var iTotalCount = 0, iNowCount = 0, sMainTitle;
    var i, j;
    
    sHtml = eBody.innerHTML;
    iEnd = sHtml.indexOf(".mp3");
    iEnd = sHtml.indexOf(".mp3", iEnd + 1);
    
    //downloadText("page.html", sHtml);=
    
    if (iEnd > 0)
    {
        // http://broadcast.ivy.com.tw/broadcast/BoardData/Enjoy/mp3/5025_1.mp3
        iEnd += 4;
        //var sToken = sHtml.substring(iEnd, iEnd + 1);
       
        iBegin = sHtml.lastIndexOf("\"", iEnd - 1) + 1;
        var sMp3Url = "http://broadcast.ivy.com.tw/broadcast/" + sHtml.substring(iBegin, iEnd);
        log("Exist MP3 : " + sMp3Url);
        
        var sSubDate = document.getElementById("ctl00_ContentPlaceHolder1_lblDate").innerHTML.replace("/", ".");
        var eSubTitle = document.getElementById("ctl00_ContentPlaceHolder1_lblSubTitle");
         
        sTitle = sSubDate + "_" + document.getElementById("ctl00_ContentPlaceHolder1_lblTitle").innerHTML;
        sTitle += "_" + eSubTitle.innerHTML;
        
        sTitle = sTitle.trim();
        
        var eDiv = document.createElement("a");
        eDiv.id = "LINK_MP3_ID";
        eDiv.href = sMp3Url;
        eDiv.innerHTML = sTitle + ".mp3";
        eDiv.download = sTitle + ".mp3";
        eSubTitle.appendChild(eDiv);
        //log("Exist Mp3 : " + iEnd);
    }
    
    
    
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
    else if (aePage && aePage.length > 0) // multiple EYNY pages
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
            sUrl = sFirstUrl.replace("-1-", "-" + i + "-");
            sTitle = "";// + i;
            sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_EYNY, iLastPageNum, i - 1);
            
            log("Request " + i + ":" + sTitle + ":" + sUrl);
        }
    }
    else if (aeEyny && aeEyny.length > 0) // only single EYNY page
    {
        gbImageDone = gbTextDone = false;
        
        sMainTitle = sTitle;
        
        sendHttpRequest(sFirstUrl, handleSingle, sMainTitle, "", SITE_EYNY, 1, 0);
    }
    else if (ePtt || eYahoo)
    {
        var eTempDiv = ePtt || eYahoo;
        sText = getRegularText(eTempDiv.innerHTML, true);
    }
    else if (aeCmshy && aeCmshy.length > 1)
    {
        gbImageDone = true;
        gbTextDone = false;
        
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
    else if (eLKnovel)
    {
        gbImageDone = gbTextDone = false;
        
        var aeTable = document.getElementsByTagName("table");
        
        sMainTitle = aeTable[0].getElementsByTagName("p")[0].innerHTML;
        sMainTitle += " " + aeTable[0].getElementsByTagName("p")[1].innerHTML.split("     ")[0];

        for (i = 2; i < aeTable.length; i++)
        {
            iTotalCount += aeTable[i].getElementsByTagName("a").length - 1;
        }
        
        log("Exist eLKnovel:" + sMainTitle + ":" + iTotalCount);
        
        for (i = 2; i < aeTable.length; i++)
        {
            var aeA = aeTable[i].getElementsByTagName("a");
            var sVolumeTitle = aeTable[i].getElementsByTagName("p")[0].innerHTML;
            
            log("" + i + ":" + sVolumeTitle);
            
            for (j = 1; j < aeA.length; j++)
            {
                sTitle = sVolumeTitle + " - " + aeA[j].innerHTML;
                sUrl = aeA[j].href;
                
                sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_LKNOVEL, iTotalCount, iNowCount++);
                
                log("" + iNowCount + "_" + i + "." + j + ":" + sTitle + ":" + sUrl);
                //break;
            }
        }
        
    }
    else if (aeLInovel && aeLInovel.length > 0)
    {
        gbImageDone = gbTextDone = false;
        
        var asTemp = eTitle.innerHTML.split("\|");
        
        sMainTitle = removeUnallowedWordInFileName(getRegularText(asTemp[0] + " - " + asTemp[2]));
        
        var aeList = aeLInovel[0].getElementsByClassName("linovel-book-item");
        
        for (i = 0; i < aeList.length; i++)
        {
            iTotalCount += aeList[i].getElementsByTagName("a").length - 2;
        }

        log("Exist eLInovel:" + sMainTitle + ":" + iTotalCount);

        for (i = 0; i < aeList.length; i++)
        {
            var aeA = aeList[i].getElementsByTagName("a");
            var sVolumeTitle = aeA[1].innerHTML.trim();
            
            log("" + i + ":" + sVolumeTitle);

            for (j = 2; j < aeA.length; j++)
            {
                sTitle = sVolumeTitle + " - " + aeA[j].innerHTML;
                sUrl = aeA[j].href;
                
                sendHttpRequest(sUrl, handleSingle, sMainTitle, sTitle, SITE_LINOVEL, iTotalCount, iNowCount++);
                
                log("" + iNowCount + "_" + i + "." + j + ":" + sTitle + ":" + sUrl);
                //break;
            }
        }
        
        
    }
    else if (eLInovel)
    {
        gbImageDone = gbTextDone = false;
        
        var asTemp = eTitle.innerHTML.split("\|");

        sMainTitle = removeUnallowedWordInFileName(getRegularText(asTemp[0] + " - " + asTemp[1] + " - " + asTemp[2]));
        
        sTitle = sMainTitle;

        sendHttpRequest(sFirstUrl, handleSingle, sMainTitle, sTitle, SITE_LINOVEL, 1, 0);
    }
    else if (eMojim)
    {
        sTitle = "";
        
        var aeX3 = document.getElementsByClassName("X3");
        
        if (aeX3.length >= 5)
        {
            sTitle = getRegularText(aeX3[2].innerHTML + "_" + aeX3[4].innerHTML);
        }

        sText = getRegularText(eMojim.innerHTML);
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
        if (sText && sText.length < 1000)
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
        
        
        //downloadEpub(); //for test 20151011
    }
}

function parseTitleAndAuthor(sTitle, sHtml, iSite)
{
    if (gbTitleAndAuthorParsed)
    {
        return;
    }
    
    gbTitleAndAuthorParsed = true;
    
    if (iSite == SITE_EYNY)
    {
        sTitle = sTitle.replace(/(【|】|《連載中》|《全文完》)/g, "");
        var asTemp = sTitle.split("-"); 
        
        if (asTemp.length > 1)
        {
            gsBookAuthor = asTemp[0];
            gsBookTitle = asTemp[1];
        }
        else
        {
            gsBookAuthor = "";
            gsBookTitle = sTitle;
        }
    }
    else
    {
        gsBookTitle = sTitle;
        gsBookAuthor = "";
    }
    
    log("Book Title : " + gsBookTitle);
    log("Book Author: " + gsBookAuthor);
    
    gEpub = new JSTxt2epub.newEpubFile(gsBookTitle, gsBookAuthor);
}

function checkNowUrl(sFirstUrl)
{
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
    
    // OLD: http://www.linovel.com/mobile/vollist/624.html
    // NEW: http://www.linovel.com/n/vollist/624.html
    else if (sFirstUrl.indexOf("http://www.linovel.com/mobile/vollist/") == 0)
    {
        
        sFirstUrl = sFirstUrl.replace("/mobile/", "/n/");
        
        window.location.href = sFirstUrl;
        
        log("LInovel new url:" + sFirstUrl);
    }
}

function getImageUrls(sHtml, eDiv, iSite)
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
                
                //log("IMG>> " + asUrl.length + ":" + asUrl[asUrl.length - 1]);
            }
        }
    }
    else if (iSite == SITE_LKNOVEL)
    {
        var aeImg = eDiv.getElementsByTagName("img");
        for (i = 0; i < aeImg.length; i++)
        {
            asUrl[asUrl.length] = aeImg[i].src;
        }
    } 
    else if (iSite == SITE_LINOVEL)
    { // http://www.linovel.com/illustration/image/20120815/20120815164812_47225.jpg
        var asImg = sHtml.split("\"[img]");
        var sBaseUrl = window.location.href.split("/n/")[0];
        
        for (i = 1; i < asImg.length; i++)
        {
            asUrl[asUrl.length] = sBaseUrl + asImg[i].split("[")[0];
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
    if (!gbNeedDownloadText)
    {
        return;
    }
    
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

function setEpubDownloadButton(sTitle)
{
    if (!gbNeedDownloadEpub)
    {
        return;
    }
    
    if (gEpub)
    {
        for (var i = 0; i < gasChapterTitle.length; i++)
        {
            for (var j = 0; j < gasChapterTitle[i].length; j++)
            {
                gEpub.addChapter(gasChapterTitle[i][j], gasChapterContent[i][j]);
            }
        }
        
        if (gaasImageDataUrl[0][0])
        {
            gEpub.addCoverImage(gaasImageDataUrl[0][0]);
        }
    }

    var eDiv = document.createElement("a");
    eDiv.id = "OUTPUT_EPUB_ID";
    
    eDiv.href = gEpub.generateBlobUrl();
    eDiv.download = sTitle + ".epub";
    
    //eDiv.click();
    var eBody = document.getElementsByTagName("body")[0];
    eBody.appendChild(eDiv);
}

function setImageDownloadButton(sTitle)
{
    if (!gbNeedDownloadImage)
    {
        return;
    }
    
    var zipImage = new JSZip();
    var zipDir = zipImage.folder(sTitle);
    
    var iImageCount = 0;
    var sFileName = "";
    var sImageDataUrl = "";
    
    for (var i = 0; i < gaasImageDataUrl.length; i++)
    {
        for (var j = 0; j < gaasImageDataUrl[i].length; j++)
        {
            sFileName = gaasImageFileName[i][j];
            sImageDataUrl = gaasImageDataUrl[i][j];
            zipDir.file(sFileName, dataUrlToBase64(sImageDataUrl), {base64: true});
            
            iImageCount++;
        }
    }
    
    if (iImageCount == 0)
    {
        return;
    }
    
    var eDiv = document.createElement("a");
    eDiv.id = "OUTPUT_IMAGE_ZIP_ID";
    
    if (iImageCount > 1)
    {
        var blob = zipImage.generate({type:"blob"});
        var blobUrl = URL.createObjectURL(blob);
        eDiv.href = blobUrl;
        eDiv.download = sTitle + ".cbz";
        
        log("Image zip file is created");
    }
    else // only one image file
    {
        var asTemp = sFileName.split("\.");
        
        eDiv.href = sImageDataUrl;
        eDiv.download = sTitle + "." + asTemp[asTemp.length - 1];
        
        log("Image file is created");
    }
    
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
        var sBefore = gaasImageFileName[this.nowPage][this.index].indexOf("jpg") > 0 ? "data:image/jpeg;base64," : "data:image/png;base64,";
        var dataUrl = sBefore + b64;
        
        gaasImageDataUrl[this.nowPage][this.index] = dataUrl;
        
        if (!checkImageAllDone(this.mainTitle) && gbTextDone)
        {
            // set icon for image ??
            setIconText("" + parseInt((getImageDoneCount() * 100 / getTotalImageCount()), 10) + "%");
        }
        
        log("Image " + this.nowPage + "-" + this.index + "/" + this.total + " is received:" + dataUrl.length);
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

        log("------- " + this.index + " -------");
        
        var sHtml = this.responseText;
        var index = this.index;
        var sTitle = this.title;
        var iTotal = this.total;
        var sMainTitle = this.mainTitle;
        
        var iBegin, iEnd;
        var i, j;
        var sText = "", sTemp = "";
        var asImageUrl = [];
        var sChapterTitle, sChapterContent;
        
        parseTitleAndAuthor(sMainTitle, sHtml, this.site);

        if (this.site == SITE_CMSHY)
        {
            iBegin = sHtml.indexOf("id=\"content\"");
            iBegin = sHtml.indexOf(">", iBegin) + 1;
            iEnd = sHtml.indexOf("</div>", iBegin);
            sText = sHtml.substring(iBegin, iEnd).trim();

            setAndGetTextProcess(index, iTotal, sText, sMainTitle, sTitle, false);
        }
        else if (this.site == SITE_EYNY)
        {
            sText = "";
            
            //log("IMAGE Exist:" + getImageUrls(sHtml, SITE_EYNY));
            
            asImageUrl = getImageUrls(sHtml, null, SITE_EYNY);

            var sNo;
            
            for (i = 0; i < asImageUrl.length; i ++)
            {
                sNo = i < 9 ? "" + index + "-0" + (i + 1) : "" + index + "-" + (i + 1);
                gaasImageFileName[index][i] = sNo + getExtension(asImageUrl[i]);
                sendImageHttpRequest(asImageUrl[i], handleSingleImage, sMainTitle, "", SITE_EYNY, index, asImageUrl.length, i);
                
                log("Request Image " + i + ":" + asImageUrl[i]);
            }
            
            var bNoImage = true;
            for (i = 0; i < iTotal; i++)
            {
                if (gaasImageFileName[i] && gaasImageFileName[i].length > 0)
                {
                    bNoImage = false;
                    break;
                }
            }
            
            if (iTotal == index + 1 && bNoImage)
            {
                gbImageDone = true; // there are no images waitting for download
            }
            
            var eDiv = document.createElement("div");
            
            eDiv.innerHTML = sHtml;
            var aeEyny = eDiv.getElementsByClassName("t_fsz");
            var asTemp2;
            for (i = 0; i < aeEyny.length; i++)
            {
                /*
                sChapterContent = aeEyny[i].innerHTML;
                asTemp2 = sChapterContent.split(/\n<br/);
                
                if (asTemp2.length > 1)
                {
                    sChapterTitle = asTemp2[1];
                    log(i + " >> " + asTemp2[1]);
                }
                */
                sText += "<br/>" + END_SYMBOL + "<br/>" + aeEyny[i].innerHTML;
            }
            
            setAndGetTextProcess(index, iTotal, sText, sMainTitle, "", true);
        }
        else if (this.site == SITE_LKNOVEL)
        {
            var eDiv = document.createElement("div");
            
            eDiv.innerHTML = sHtml;
            var eText = eDiv.getElementsByClassName("text")[0];
            sText = "<br/><br/>" + eText.innerHTML;

            asImageUrl = getImageUrls(sHtml, eText, SITE_LKNOVEL);
            
            sTitle = getRegularText(sTitle);
            
            var sNo;
            for (i = 0; i < asImageUrl.length; i++)
            {
                sNo = i < 9 ? sTitle + "_0" + (i + 1) : sTitle + "_" + (i + 1);
                gaasImageFileName[index][i] = sNo + getExtension(asImageUrl[i]);
                sendImageHttpRequest(asImageUrl[i], handleSingleImage, sMainTitle, sTitle, SITE_LKNOVEL, index, asImageUrl.length, i);
            }
                
            setAndGetTextProcess(index, iTotal, sText, sMainTitle, sTitle, true);
        }
        else if (this.site == SITE_LINOVEL)
        {

            var asTemp = sHtml.split("\"content\":\"");
            
            sText = "";
            
            for (i = 1; i < asTemp.length; i++)
            {
                if (asTemp[i].indexOf("[img]") == 0)
                {
                    continue;
                }
                
                sText += "<br/><br/>" + asTemp[i].split("\",\"")[0];
            }

            asImageUrl = getImageUrls(sHtml, eText, SITE_LINOVEL);
            
            sTitle = getRegularText(sTitle);
            
            var sNo;
            for (i = 0; i < asImageUrl.length; i++)
            {
                sNo = i < 9 ? sTitle + "_0" + (i + 1) : sTitle + "_" + (i + 1);
                gaasImageFileName[index][i] = sNo + getExtension(asImageUrl[i]);
                sendImageHttpRequest(asImageUrl[i], handleSingleImage, sMainTitle, sTitle, SITE_LINOVEL, index, asImageUrl.length, i);
            }
            
            setAndGetTextProcess(index, iTotal, sText, sMainTitle, sTitle, true);
        }
        
        log("Orignial " + index + " LEN:" + sText.length);
    }
}

function setAndGetTextProcess(index, iTotal, sText, sMainTitle, sTitle, bCheckAllDone)
{
    async(function() {
        sText = getRegularText(sText);
        //sTitle = getRegularText(sTitle);

    }, function() {
        parseChapter(sText, index);
        gaData[index] = "\r\n\r\n" + sText;
        
        var bAllDone = checkAllDone(sMainTitle, iTotal);
        
        if (!bCheckAllDone || !bAllDone)
        {
            setIconText("" + parseInt((getDoneCount() * 100 / iTotal), 10) + "%");
        }
        log(" " + index + " parse done: LEN:" + sText.length);
    });
}

function parseChapter(sText, iPageIndex)
{
    var asTemp = sText.split(END_SYMBOL);
    var asTemp2 = [];
    var sTemp = "";
    var iBegin, iEnd;
    
    if (!gasChapterTitle[iPageIndex])
    {
        gasChapterTitle[iPageIndex] = [];
        gasChapterContent[iPageIndex] = [];
    }
    
    
    for (var i = 0; i < asTemp.length; i++)
    {
        var iChapterIndex = gasChapterTitle[iPageIndex].length;

        sTemp = asTemp[i].trim();
        asTemp2 = sTemp.split(/(\r|\n)+/);//.match(/\S+/g);
        
        log("+" + asTemp2.length + ":" + asTemp2[0]);
        
        gasChapterTitle[iPageIndex][iChapterIndex] = asTemp2[0];
        
        if (!asTemp2[i] || asTemp2[i].length < 2)
        {
            log(i + " ERR: asTemp2[i].length");
            gasChapterContent[iPageIndex][iChapterIndex] = sTemp;
            continue;
        }
        
        iBegin = sTemp.indexOf(asTemp2[1]);
        
        if (iBegin < 0)
        {
            log(i + " ERR: iBegin < 0:[" + asTemp2[1] + "]");
            gasChapterContent[iPageIndex][iChapterIndex] = sTemp;
            continue;
        }
        
        gasChapterContent[iPageIndex][iChapterIndex] = sTemp.substring(iBegin, sTemp.length);

        /*
        for (var j = 0; j < asTemp2.length; j++)
        {
            if (asTemp2[j].trim())
            {
                log(j + " > " + asTemp2[j]);
                break;
            }
        }
        */
    }
}

function getExtension(sImageUrl)
{
    return sImageUrl.toLowerCase().indexOf(".png") > 0 ? ".png" : ".jpg";
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
            setEpubDownloadButton(sMainTitle);
        }
        
        log("Total " + iTotal + " volumes are all done !");
        
        return true;
    }
    
    return false;
}

function checkImageAllDone(sMainTitle)
{
    if (isImageAllDone())
    {
        gbImageDone = true;
        
        setImageDownloadButton(sMainTitle);

        if (gbTextDone)
        {
            setIconText("OK+");
            setEpubDownloadButton(sMainTitle);
        }
        
        log("Total " + getTotalImageCount() + " images are all done !");
        
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

function getImageDoneCount()
{
    var iCount = 0;
    
    for (var i = 0; i < gaasImageDataUrl.length; i++)
    {
        for (var j = 0; j < gaasImageDataUrl[i].length; j++)
        {
            if (gaasImageDataUrl[i][j])
            {
                iCount++;
            }
        }
    }
    
    return iCount;
}


function getTotalImageCount()
{
    var iCount = 0;
    
    for (var i = 0; i < gaasImageFileName.length; i++)
    {
        iCount += gaasImageFileName[i].length;
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

function isImageAllDone()
{
    for (var i = 0; i < gaasImageFileName.length; i++)
    {
        if (gaasImageDataUrl[i].length < gaasImageFileName[i].length)
        {
            return false;
        }
        
        for (var j = 0; j < gaasImageDataUrl[i].length; j++)
        {
            if (!gaasImageDataUrl[i][j])
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
    
    gaasImageFileName[i] = [];
    gaasImageDataUrl[i] = [];
}

function sendImageHttpRequest(sUrl, onloadFunction, sMainTitle, sTitle, iSite, iNowPage, iTotal, i)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = onloadFunction;
    xhr.open("GET", sUrl, true);
    xhr.send();
    xhr.index = i;
    xhr.total = iTotal;
    xhr.mainTitle = sMainTitle;
    xhr.title = sTitle;
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
    sText = sText.replace(/(本帖最後由.+編輯)/g, ""); // for EYNY
     
    
    sText = sText.replace(/&nbsp;/g, " ");
    sText = sText.replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    sText = sText.replace(/&quot;/g, "\"").replace(/&amp;/g,'&');
    
    var asTemp = sText.split(" - ");
    if (sText.length < 100 && asTemp.length >= 3)
    {
        sText = asTemp[0].trim();
    }
    
    /*
    // simplified chinese -> traditional chinese
    for (var i = 0; i < SC2TC_DATA.length; i++)
    {
        sText = sText.replace(new RegExp(SC2TC_DATA[i][0], "g"), SC2TC_DATA[i][1]);
    }
    */
    sText = jscc.toTC(sText);
    
    //var myA = new namespace.b("x");
    //myA.hi();
    
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

var STATUS_NOTHING = 0;
var STATUS_PARSING = 1;
var STATUS_DONE = 2;

var gbSetIconDone = false;
var gabTabStatus = [];
var gasTabBackupIcon = [];

var gabNeedDownload = [];

init();

function init()
{
    chrome.browserAction.onClicked.addListener(onClickButton);
    chrome.extension.onMessage.addListener(onMyMessage);
    restoreData();
}

chrome.tabs.onActiveChanged.addListener(function(tabId, changeInfo, tab) {
    console.log("onActiveChanged");
    
    if (gabTabStatus[tabId] == STATUS_DONE)
    {
        chrome.browserAction.setBadgeText({text: "OK"}); // set the done icon
    }
    else if (gabTabStatus[tabId] == STATUS_PARSING)
    {
        chrome.browserAction.setBadgeText({text: gasTabBackupIcon[tabId]}); // restore the icon
    }
    else
    {
        chrome.browserAction.setBadgeText({text: ""}); // init the icon
    }
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log("onUpdated");
    
    if (gbSetIconDone)
    {
        console.log("no set ''");
        gbSetIconDone = false;
        return;
    }
    
    stopExecution(); // test.... not work ??
    
    if (gabTabStatus[tabId] != STATUS_DONE)
    {
        //chrome.browserAction.setBadgeText({text: ""}); // init icon
    }
});

function onClickButton()
{
    console.log("onClick");
    
    //window.open("http://tw.dictionary.search.yahoo.com/search?p=BatchDict", "_blank");

    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        //console.log("ID:" + arrayOfTabs[0].id);
        chrome.tabs.sendMessage(arrayOfTabs[0].id, {greeting: "OutputText"}, 
      
        function(response) {
        });
    });
}

function onMyMessage(details, sender, callback)
{
    if (details.msg == "SetIconText") 
    {
        var iTabId = details.tabId;
        
        console.log("[TS]BG: SetIconText:" + iTabId + ":" + details.text);
        
        chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        
            if (!arrayOfTabs[0])
            {
                return;
            }
            
            
            
            gbSetIconDone = true;
            
            if (details.text.indexOf("OK") >= 0) // all done 
            {
                gabTabStatus[iTabId] = STATUS_DONE;
                console.log("[TS]Tab " + iTabId + " is done");
            }
            else // still parsing
            {
                gabTabStatus[iTabId] = STATUS_PARSING;
                gasTabBackupIcon[iTabId] = details.text;
            }
            
            if (iTabId == arrayOfTabs[0].id)
            {
                setIconText(details.text);
            }
        
        });
    }
    else if (details.msg == "GetTabId")
    {
        chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        
            if (!arrayOfTabs[0])
            {
                return;
            }

            var iTabId = arrayOfTabs[0].id;

            console.log("[TS]GetTabId:" + iTabId);
            
            chrome.tabs.sendMessage(iTabId, {
                greeting: "GetTabIdBack",
                tabId: iTabId }, 
      
            function(response) {
            });
            
            /*
            if (callback) {
                callback({
                    tabId: iTabId
                });
                
                console.log("--->");
                
                return true;
            }
            */
        });
    }
    else if (details.msg == "SetDownloadOption")
    {
        console.log("SetDownloadOption[" + details.index + "] set " + details.checked);
        
        gabNeedDownload[details.index] = details.checked;
    }
    else if (details.msg == "GetDownloadOption")
    {
        if (callback) {
            callback({
                checked: gabNeedDownload
            });

            return true;
        }
    }
}

function setIconText(sText)
{
    chrome.browserAction.setBadgeBackgroundColor({ color: "#8000FF" /*"#04B431"*/ });
    chrome.browserAction.setBadgeText({text: sText});   
}

function setIconDone()
{
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        //console.log("ID:" + arrayOfTabs[0].id);
        chrome.tabs.sendMessage(arrayOfTabs[0].id, {greeting: "SetIconTextDone"}, 
      
        function(response) {
            console.log(response.farewell);
        });
    });
}

function stopExecution()
{
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        //console.log("ID:" + arrayOfTabs[0].id);
        
        if (!arrayOfTabs[0])
            return;
        
        chrome.tabs.sendMessage(arrayOfTabs[0].id, {greeting: "StopExecution"}, 
      
        function(response) {
            
        });
    });
}


function storeData(asData)
{
    console.log("StoreData : " + asData);
    chrome.storage.local.set({'downloadData':asData});
}


function restoreData()
{
    chrome.storage.local.get('downloadData', function(items) {
        var asData = items.urlData;

        // stored the data before
        if (asData)
        {
            gabNeedDownload = asData;
        }
        else // store the initial setting
        {
            gabNeedDownload = [true, true, true];
            storeData(gabNeedDownload); 
        }
    });
}


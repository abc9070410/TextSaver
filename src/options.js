init();

function init()
{
    log("init");
    
    var aeDiv = document.getElementsByName("DOWNLOAD_CHECKBOX_OPTION");
    
    var i;
    for (i = 0; i < aeDiv.length; i++)
    {
        aeDiv[i].addEventListener("click", clickCheckboxDownloadOption);
        aeDiv[i].index = i;
    }
    
    chrome.extension.sendMessage({
        msg: "GetDownloadOption",
    }, function(response) {
        log("GetDownloadOption Done : " + response.checked);
        for (i = 0; i < response.checked.length; i++)
        {
            aeDiv[i].checked = response.checked[i];
            
            log("check[" + i + "] is " + aeDiv[i].checked);
        }
    });
}


function clickCheckboxDownloadOption()
{
    log("click Checkbox:" + this.index + " is " + this.checked);
    
    chrome.extension.sendMessage({
        msg: "SetDownloadOption",
        index: this.index,
        checked: this.checked
    }, function(response) {
    });
}


function log(sText)
{
    console.log(sText);
}


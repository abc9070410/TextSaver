var EPUB_FILE_NAMES = ["mimetype"];
var EPUB_DIR_NAMES = ["META-INF", "images", "OEBPS"];
var EPUB_FILE_NAMES_IN_DIR = [];
EPUB_FILE_NAMES_IN_DIR[0] = ["container.xml"];
EPUB_FILE_NAMES_IN_DIR[1] = ["cover.jpg"];
EPUB_FILE_NAMES_IN_DIR[2] = ["stylesheet.css", "catalog.xhtml", "copyright.xhtml", "cover.xhtml", "toc.ncx", "content.opf"];

var CONTENT_mimetype = "application/epub+zip";

var EPUB_FILE_CONTENTS = [CONTENT_mimetype];

var CONTENT_containerxml = "<?xml version='1.0'?><container version='1.0' xmlns='urn:oasis:names:tc:opendocument:xmlns:container'><rootfiles><rootfile full-path='OEBPS/content.opf' media-type='application/oebps-package+xml'/></rootfiles></container>";

var CONTENT_stylesHeet = "h1{text-align:right; margin-right:2em; page-break-before: always; font-size:1.6em; font-weight:bold;} h3 { text-align: center;}p.center{text-align:center;}p.catalog{margin:20px 10px;padding:0;}";

var EPUB_FILE_CONTENT_IN_DIR = [];
EPUB_FILE_CONTENT_IN_DIR[0] = [CONTENT_containerxml];
EPUB_FILE_CONTENT_IN_DIR[1] = [null];
EPUB_FILE_CONTENT_IN_DIR[2] = [CONTENT_stylesHeet];

function getHtml(iDirIndex, iFileIndex, epubFile)
{
    if (iDirIndex == 0)
    {
        if (iFileIndex == 0)
        {
            return CONTENT_containerxml;
        }
    }
    else if (iDirIndex == 1)
    {
        
    }
    else if (iDirIndex == 2)
    {
        if (iFileIndex == 0)
        {
            return CONTENT_stylesHeet;
        }
        else if (iFileIndex == 1)
        {
            
        }
    }
    
    return null;
}

function downloadEpub()
{
    console.log("downloadEpub");
    
    eDiv = document.createElement("a");
    eDiv.id = "OUTPUT_EPUB_ID";
    
    var sBookTitle = "BOOK TITLE";
    var sAuthor = "Randy";
    var epubFile = newEpubFile(sBookTitle, sAuthor, "目錄");
    
    addChapter("1", "1 C", epubFile);
    addChapter("2", "2 C", epubFile);
    addChapter("3", "3 C", epubFile);
    
    eDiv.href = generateBlobUrl(epubFile);;
    eDiv.download = sAuthor + "_" + sBookTitle + ".epub";
    
    eDiv.click();
}

function generateBlobUrl(epubFile)
{
    var sBookTitle = epubFile.bookTitle;
    var sAuthor = epubFile.author;
    var sCatalogTitle = epubFile.catalogTitle;
    var asChapterTitle = epubFile.chapterTitles;
    var asChapterContent = epubFile.chapterContents;
    var bCoverPic = epubFile.coverPic;
    var bCopyrightPic = epubFile.copyrightPic;

    epubFile.epubOebpsDirs.file("content.opf", getHtmlOfOpf(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle));
    epubFile.epubOebpsDirs.file("toc.ncx", getHtmlOfNcx(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle));
    epubFile.epubOebpsDirs.file("copyright.xhtml", getHtmlOfCopyrightPage(sBookTitle, ""));
    epubFile.epubOebpsDirs.file("cover.xhtml", getHtmlOfCoverPage(sBookTitle));
    epubFile.epubOebpsDirs.file("catalog.xhtml", getHtmlOfCatalogPage(sCatalogTitle, asChapterTitle));
    
    for (var i = 0; i < asChapterTitle.length; i++)
    {
        epubFile.epubOebpsDirs.file("chap" + i + ".xhtml", getHtmlOfContentPage(asChapterTitle[i], asChapterContent[i]));
    }
    
    var blob = epubFile.epub.generate({type:"blob"});
    var blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
}

function addChapter(sChapterTitle, sChapterContent, epubFile)
{
    var index = epubFile.chapterTitles.length;
    
    epubFile.chapterTitles[index] = sChapterTitle;
    epubFile.chapterContents[index] = sChapterContent;
}

function newEpubFile(sBookTitle, sAuthor, sCatalogTitle)
{
    var i;
    var zipEpub = new JSZip();
    var zipEpubDirs = [];
    
    var EPUB_DIR_NAMES = ["META-INF", "images", "OEBPS"];
    
    var zipEpubMetaDirs = zipEpub.folder("META-INF");
    var zipEpubImageDirs = zipEpub.folder("images");
    var zipEpubOebpsDirs = zipEpub.folder("OEBPS");
    
    zipEpub.file("mimetype", CONTENT_mimetype);
    
    zipEpubMetaDirs.file("container.xml", CONTENT_containerxml);
    zipEpubOebpsDirs.file("stylesheet.css", CONTENT_stylesHeet);
    
    return {
        epub: zipEpub,
        epubMetaDirs: zipEpubMetaDirs,
        epubImageDirs: zipEpubImageDirs,
        epubOebpsDirs: zipEpubOebpsDirs,
        
        bookTitle: sBookTitle,
        author: sAuthor,
        catalogTitle: sCatalogTitle,
        chapterTitles: [],
        chapterContents: [],
        coverPic: true,
        copyrightPic: true
    };
}

function text2html(sText)
{
    sText = sText.replace(/\\r|\\n/ig, "<br>");
    sText = sText.replace(/\\s/g, "&nbsp;");
    sText = sText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    sText = sText.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
    
    return sText;
}


function getHtmlOfOpf(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle)
{    
    var sBehind = "<?xml version='1.0' encoding='utf-8'?><package xmlns='http://www.idpf.org/2007/opf' version='2.0' unique-identifier='uuid_id'><metadata xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:opf='http://www.idpf.org/2007/opf' xmlns:dcterms='http://purl.org/dc/terms/' xmlns:calibre='http://calibre.kovidgoyal.net/2009/metadata' xmlns:dc='http://purl.org/dc/elements/1.1/'><dc:title>" + sBookTitle + "</dc:title><dc:creator>" + sAuthor + "</dc:creator><dc:subject>ibook.178.com</dc:subject><dc:language>zh_TW</dc:language><dc:date>2010-11-17</dc:date><dc:contributor>ibook.178.com [http://ibook.178.com]</dc:contributor><dc:type>普通圖書</dc:type><dc:format>Text/html(.xhtml,.html)</dc:format><meta name='cover' content='cover-image'/></metadata><manifest><item id='ncx' href='toc.ncx' media-type='application/x-dtbncx+xml' /><item href='cover.xhtml' id='cover' media-type='application/xhtml+xml'/><item href='copyright.xhtml' id='copyright' media-type='application/xhtml+xml'/><item href='catalog.xhtml' id='catalog' media-type='application/xhtml+xml'/>";

    var sMiddle = "";

    for (var i = 0; i < asChapterTitle.length; i++)
    {
        sMiddle += "<item href='chap" + i + ".xhtml' id='chap" + i + "' media-type='application/xhtml+xml'/>";
    }
    
    sMiddle += "<item href='images/cover.jpg' id='cover-image' media-type='image/jpeg' />";
    
    sMiddle += "</manifest>\r\n<spine toc='ncx'>\r\n<itemref idref='cover' />\r\n<itemref idref='copyright' />\r\n<itemref idref='catalog'/>";
    
    for (var i = 0; i < asChapterTitle.length; i++)
    {
        sMiddle += "<itemref idref='chap" + i + "' />";
    }
    
    var sAfter = "<itemref idref='copyright' />\r\n</spine>\r\n<guide>\r\n<reference href='cover.xhtml' type='text' title='Cover'/>\r\n<reference href='catalog.xhtml' type='text' title='Catalog'/>\r\n</guide>\r\n</package>";
    
    return sBehind + sMiddle + sAfter;
}

function getHtmlOfNcx(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle)
{
    var sBehind = "<?xml version='1.0' encoding='utf-8'?>\r\n<ncx xmlns='http://www.daisy.org/z3986/2005/ncx/' version='2005-1'>\r\n<head>\r\n<meta content='178_0' name='dtb:uid'/>\r\n<meta content='2' name='dtb:depth'/>\r\n<meta content='0' name='dtb:totalPageCount'/>\r\n<meta content='0' name='dtb:maxPageNumber'/>\r\n</head>\r\n<docTitle>\r\n<text>" + sBookTitle + "</text>\r\n</docTitle>\r\n<docAuthor>\r\n<text>" + sAuthor + "</text>\r\n</docAuthor>\r\n<navMap>\r\n<navPoint id='catalog' playOrder='0'>\r\n<navLabel>\r\n<text>" + sCatalogTitle + "</text>\r\n</navLabel>\r\n<content src='catalog.xhtml'/>\r\n</navPoint>";

    var sMiddle = "";

    for (var i = 0; i < asChapterTitle.length; i++)
    {
        sMiddle += "<navPoint id='chap0' playOrder='1'>\r\n<navLabel>\r\n<text>" + asChapterTitle[i] + "</text>\r\n</navLabel>\r\n<content src='chap" + i + ".xhtml'/>\r\n</navPoint>";
    }
    
    var sAfter = "</navMap>\r\n</ncx>";
    
    return sBehind + sMiddle + sAfter;
}

function getHtmlOfContentPage(sTitle, sContent)
{
    return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-CN'>\r\n<head>\r\n<title>" + sTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<h3>" + sTitle + "</h3>\r\n<div class='center'>" + sContent + "</div>\r\n</body>\r\n</html>";
}

function getHtmlOfCopyrightPage(sTitle, sContent)
{
    return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-CN'>\r\n<head>\r\n<title>" + sTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<p class='center'>\r\n<img src='images/178.png'/>\r\n</p>\r\n<br>\r\n<div class='center'>" + text2html(sContent) + "</div>\r\n</body>\r\n</html>";
}

function getHtmlOfCoverPage(sTitle)
{
    return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-CN'>\r\n<head>\r\n<title>" + sTitle +"</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<p class='center'>\r\n<img src='../images/cover.jpg'/>\r\n</p>\r\n</body>\r\n</html>";
}

function getHtmlOfCatalogPage(sCatalogTitle, asChapterTitle)
{
    var sBehind = "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-CN'>\r\n<head>\r\n<title>" + sCatalogTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<h1>" + sCatalogTitle + "</h1>";

    var sMiddle = "";

    for (var i = 0; i < asChapterTitle.length; i++)
    {
        sMiddle += "<p class='catalog'>\r\n<a href='chap" + i + ".xhtml'>" + asChapterTitle[i] + "</a>\r\n</p>";
    }
    
    var sAfter = "</body>\r\n</html>";
    
    return sBehind + sMiddle + sAfter;
}


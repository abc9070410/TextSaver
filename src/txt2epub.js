

var JSTxt2epub = JSTxt2epub || {};

JSTxt2epub = (function() {
    var COVER_FILE_NAME = "cover.jpg";
    
    this.epubFile = {};
    function all() {};
    function newEpubFile(sBookTitle, sAuthor)
    {    
        var i;
        var zipEpub = new JSZip();
        var zipEpubMetaDirs = zipEpub.folder("META-INF");
        var zipEpubImageDirs = zipEpub.folder("images");
        var zipEpubOebpsDirs = zipEpub.folder("OEBPS");
        
        var sCopyright = "This epub file is made by JSTxt2epub<br/>(<a src='https://github.com/abc9070410/JSTxt2epub'>https://github.com/abc9070410/JSTxt2epub</a>)";
        
        zipEpub.file("mimetype", "application/epub+zip");
        
        zipEpubMetaDirs.file("container.xml", "<?xml version='1.0'?>\r\n<container version='1.0' xmlns='urn:oasis:names:tc:opendocument:xmlns:container'>\r\n<rootfiles>\r\n<rootfile full-path='OEBPS/content.opf' media-type='application/oebps-package+xml'/>\r\n</rootfiles>\r\n</container>");
        zipEpubOebpsDirs.file("stylesheet.css", "h1{text-align:right;\r\n margin-right:2em;\r\n page-break-before: always;\r\n font-size:1.6em;\r\n font-weight:bold;}\r\n h3 { text-align: center;\r\n}.center{text-align:center;}\r\n.bottom{position:fixed;bottom:0%;height:10%;width:100%;//background:#999;}\r\n.catalog{margin:20px 10px;\r\npadding:0;\r\n}");
        
        this.epubFile = {
            epub: zipEpub,
            epubMetaDirs: zipEpubMetaDirs,
            epubImageDirs: zipEpubImageDirs,
            epubOebpsDirs: zipEpubOebpsDirs,
            
            bookTitle: sBookTitle,
            author: sAuthor,
            copyright: sCopyright,
            chapterTitles: [],
            chapterContents: [],
            imageDataUrl: null
        };
    }
    
    newEpubFile.prototype.generateBlobUrl = function()
    {
        var epubFile = this.epubFile;
        var sBookTitle = epubFile.bookTitle;
        var sAuthor = epubFile.author;
        var sCatalogTitle = "Content";
        var asChapterTitle = epubFile.chapterTitles;
        var asChapterContent = epubFile.chapterContents;
        var sCopyright = epubFile.copyright;
        var sImageDataUrl = epubFile.imageDataUrl;
        var bImageExisted = sImageDataUrl ? true : false;

        epubFile.epubOebpsDirs.file("content.opf", getHtmlOfOpf(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle));
        epubFile.epubOebpsDirs.file("toc.ncx", getHtmlOfNcx(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle));
        epubFile.epubOebpsDirs.file("copyright.xhtml", getHtmlOfCopyrightPage(sBookTitle, sCopyright));
        epubFile.epubOebpsDirs.file("cover.xhtml", getHtmlOfCoverPage(sBookTitle, bImageExisted));
        epubFile.epubOebpsDirs.file("catalog.xhtml", getHtmlOfCatalogPage(sCatalogTitle, asChapterTitle));
        
        if (bImageExisted)
        {
            epubFile.epubImageDirs.file(COVER_FILE_NAME, dataUrlToBase64(sImageDataUrl), {base64: true});
        }
        
        for (var i = 0; i < asChapterTitle.length; i++)
        {
            epubFile.epubOebpsDirs.file("chap" + i + ".xhtml", getHtmlOfContentPage(asChapterTitle[i], asChapterContent[i]));
        }
        

        
        var blob = epubFile.epub.generate({type:"blob"});
        var blobUrl = URL.createObjectURL(blob);
        
        return blobUrl;
    }

    newEpubFile.prototype.addChapter = function(sChapterTitle, sChapterContent)
    {
        var index = this.epubFile.chapterTitles.length;
        
        this.epubFile.chapterTitles[index] = sChapterTitle;
        this.epubFile.chapterContents[index] = sChapterContent;
    }
    
    newEpubFile.prototype.addCoverImage = function(sImageDataUrl)
    {
        this.epubFile.imageDataUrl = sImageDataUrl;
    }
    
    newEpubFile.prototype.addCopyright = function(sCopyright)
    {
        this.epubFile.copyright = sCopyright;
    }

    text2html = function(sText)
    {
        sText = sText.replace(/\r\n/g, "<br/>");
        sText = sText.replace(/\n/g, "<br/>");
        sText = sText.replace(/\r/g, "<br/>");
        //sText = sText.replace(/\s/g, "&nbsp;");
        //sText = sText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        //sText = sText.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
        
        return sText;
    }


    getHtmlOfOpf = function(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle)
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

    getHtmlOfNcx = function(sBookTitle, sAuthor, sCatalogTitle, asChapterTitle)
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

    getHtmlOfContentPage = function(sTitle, sContent)
    {
        return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-TW'>\r\n<head>\r\n<title>" + sTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<h3>" + sTitle + "</h3>\r\n<div class='center'>" + text2html(sContent) + "</div>\r\n</body>\r\n</html>";
    }

    getHtmlOfCopyrightPage = function(sTitle, sContent)
    {
        return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-TW'>\r\n<head>\r\n<title>" + sTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<br/>\r\n<div class='center bottom'>" + text2html(sContent) + "</div>\r\n</body>\r\n</html>";
    }

    getHtmlOfCoverPage = function(sTitle, bCoverExisted)
    {
        var sBodyHtml = "<h3>" + sTitle + "</h3>";
        if (bCoverExisted)
        {
            sBodyHtml = "<img src='../images/cover.jpg'/>";
        }
        
        return "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-TW'>\r\n<head>\r\n<title>" + sTitle +"</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<p class='center'>\r\n" + sBodyHtml + "\r\n</p>\r\n</body>\r\n</html>";
    }

    getHtmlOfCatalogPage = function(sCatalogTitle, asChapterTitle)
    {
        var sBehind = "<?xml version='1.0' encoding='utf-8'?>\r\n<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>\r\n<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='zh-TW'>\r\n<head>\r\n<title>" + sCatalogTitle + "</title>\r\n<link href='stylesheet.css' type='text/css' rel='stylesheet' />\r\n<link rel='stylesheet' type='application/vnd.adobe-page-template+xml' href='page-template.xpgt'/>\r\n</head>\r\n<body>\r\n<h1>" + sCatalogTitle + "</h1>";

        var sMiddle = "";

        for (var i = 0; i < asChapterTitle.length; i++)
        {
            sMiddle += "<p class='catalog'>\r\n<a href='chap" + i + ".xhtml'>" + asChapterTitle[i] + "</a>\r\n</p>";
        }
        
        var sAfter = "</body>\r\n</html>";
        
        return sBehind + sMiddle + sAfter;
    }

    return {
        all: all,
        newEpubFile: newEpubFile
    }
})();


downloadEpub = function()
{
    console.log("downloadEpub");
    
    eDiv = document.createElement("a");
    eDiv.id = "OUTPUT_EPUB_ID";
    
    var sBookTitle = "BOOK TITLE1";
    var sAuthor = "Randy1";
    var epub = new JSTxt2epub.newEpubFile(sBookTitle, sAuthor);
    
    epub.addChapter("1", "1 C");
    epub.addChapter("2", "2 C");
    epub.addChapter("3", "3 C");
    
    eDiv.href = epub.generateBlobUrl();
    eDiv.download = sAuthor + "_" + sBookTitle + ".epub";
    
    eDiv.click();
}
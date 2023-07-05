function(properties, context) {
    
    // Backport to support headless service
    var pdfutil = require("pdfjs-dist/legacy/build/pdf");
    
    // Store the PDF bytes
    var pdfbuffer = Buffer.from(properties.sourcepdf, "base64");
    
    // Load the task
    var pdftask = pdfutil.getDocument(
        { 
            data: pdfbuffer,
            standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/"
        }
    );
    
    // Instantiate the document
    var promisepdf = pdftask.promise;
    var pdfdoc = context.async(
    	callback => promisepdf
        .then(loadedpdf => callback(null, loadedpdf))
        .catch(reason => callback(reason))
    );
    
    // Load the page
    var promisepage = pdfdoc.getPage(properties.pagenumber);
    var pdfpage = context.async(
    	callback => promisepage
        .then(extractedpage => callback(null, extractedpage))
        .catch(reason => callback(reason))
    );
    
    // Load the content
    var promisetext = pdfpage.getTextContent();
    var pagecontent = context.async(
    	callback => promisetext
        .then(extractedtext => callback(null, extractedtext))
        .catch(reason => callback(reason))
    );

    // Test for empty page
    var n = pagecontent.items.length;
    if (n < 1) {
        return { pagetext: "" };
    }
    
    // First token
    var pagetext = pagecontent.items[0].str;

    // Line dimensions
    var lineheight = pagecontent.items[0].height;
    var linetop = pagecontent.items[0].transform[5] + pagecontent.items[0].height;
    var linebottom = pagecontent.items[0].transform[5];
    var lineend = pagecontent.items[0].transform[4] + pagecontent.items[0].width;
    var tokenstart = pagecontent.items[0].transform[4];

    // Loop through the tokens
    for (var i = 1; i < n; i++) {

        // Token dimensions
        var nextheight = pagecontent.items[i].height || lineheight;
        var nexttop = pagecontent.items[i].transform[5] + nextheight;
        var nextbottom = pagecontent.items[i].transform[5];
        var nextend = pagecontent.items[i].transform[4] + pagecontent.items[i].width;
        var nextstart = pagecontent.items[i].transform[4];
        
        // Accommodate whitespace bleed
        var spacebleed = (-1 < pagetext.search(/\s$/g)) || (-1 < pagecontent.items[i].str.search(/^\s/g));
        
        // Same line
        if ((linebottom <= nexttop) && (nextbottom <= linetop) && (tokenstart <= nextstart) && (lineend <= nextend || spacebleed)) {

            // Append token
            pagetext += pagecontent.items[i].str;

            // Line dimensions
            linetop = Math.max(linetop, nexttop);
            linebottom = Math.min(linebottom, nextbottom);
            lineheight = linetop - linebottom;
            lineend = nextend;
            tokenstart = nextstart;
        }

        // New line
        else {

            // Append line
            pagetext += "\n" + pagecontent.items[i].str;

            // Reset dimensions
            linetop = nexttop;
            linebottom = nextbottom;
            lineheight = linetop - linebottom;
            lineend = nextend;
            tokenstart = nextstart;
        }
    }
    
    // Send
    return { pagetext: pagetext };
}
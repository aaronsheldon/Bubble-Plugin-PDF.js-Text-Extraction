async function(properties, context) {
    
    // Backport to support headless service
    const pdfutil = require("pdfjs-dist/legacy/build/pdf");
    
    // Store the PDF bytes
    const pdfbuffer = Buffer.from(properties.sourcepdf, "base64");
    
    // Load the task
    const pdftask = pdfutil.getDocument(
        { 
            data: pdfbuffer,
            standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/"
        }
    );
    
    // Instantiate the document
    const pdfdoc = await pdftask.promise;
    
    // Load the page
    const pdfpage = await pdfdoc.getPage(properties.pagenumber);
    
    // Load the content
    const pagecontent = await pdfpage.getTextContent();

    // Test for empty page
    const n = pagecontent.items.length;
    if (n < 1) {
        return { pagetext: "" };
    }
    
    // First token
    let pagetext = pagecontent.items[0].str;

    // Line dimensions
    let lineheight = pagecontent.items[0].height;
    let linetop = pagecontent.items[0].transform[5] + pagecontent.items[0].height;
    let linebottom = pagecontent.items[0].transform[5];
    let lineend = pagecontent.items[0].transform[4] + pagecontent.items[0].width;
    let tokenstart = pagecontent.items[0].transform[4];

    // Loop through the tokens
    for (let i = 1; i < n; i++) {

        // Token dimensions
        let nextheight = pagecontent.items[i].height || lineheight;
        let nexttop = pagecontent.items[i].transform[5] + nextheight;
        let nextbottom = pagecontent.items[i].transform[5];
        let nextend = pagecontent.items[i].transform[4] + pagecontent.items[i].width;
        let nextstart = pagecontent.items[i].transform[4];
        
        // Accommodate whitespace bleed
        let spacebleed = (-1 < pagetext.search(/\s$/g)) || (-1 < pagecontent.items[i].str.search(/^\s/g));
        
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
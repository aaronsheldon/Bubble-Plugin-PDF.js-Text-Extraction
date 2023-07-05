function(properties, context) {
    
    // Backport to support headless service
    var pdfutil = require("pdfjs-dist/legacy/build/pdf");
    
    // Store the PDF bytes
    var pdfbuffer = Buffer.from(properties.sourcepdf, "base64");
    
    // Open the task
    var pdftask = pdfutil.getDocument(pdfbuffer);
    
    // Instantiate the document
    var promisepdf = pdftask.promise;
    var pdfdoc = context.async(
    	callback => promisepdf
        .then(loadedpdf => callback(null, loadedpdf))
        .catch(reason => callback(reason))
    );
    
    // Send
    return {
        pagecount: pdfdoc.numPages,
        info: JSON.stringify(pdfdoc.info, null, 2),
        metadata: JSON.stringify(pdfdoc.metadata.getAll(), null, 2)
    };
}
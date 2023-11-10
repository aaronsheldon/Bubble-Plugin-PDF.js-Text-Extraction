async function(properties, context) {
    
    // Backport to support headless service
    const pdfutil = require("pdfjs-dist/legacy/build/pdf");
    
    // Store the PDF bytes
    const pdfbuffer = Buffer.from(properties.sourcepdf, "base64");
    
    // Open the task
    const pdftask = pdfutil.getDocument(pdfbuffer);
    
    // Instantiate the document
    const pdfdoc = await pdftask.promise;
    
    // Send
    return {
        pagecount: pdfdoc.numPages,
        info: JSON.stringify(pdfdoc.info, null, 2),
        metadata: JSON.stringify(pdfdoc.metadata.getAll(), null, 2)
    };
}
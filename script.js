document.getElementById("processBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("Please select a .docx or .txt file.");
        return;
    }

    const reader = new FileReader();
    const fileName = fileInput.name.toLowerCase();

    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;

        if (fileName.endsWith(".docx")) {
            // Convert .docx to text
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    processExtractedText(result.value);
                })
                .catch(err => console.error("Error reading .docx file:", err));
        } else if (fileName.endsWith(".txt")) {
            // Process .txt file
            const extractedText = new TextDecoder().decode(arrayBuffer);
            processExtractedText(extractedText);
        } else {
            alert("Unsupported file format! Please upload a .docx or .txt file.");
        }
    };

    reader.readAsArrayBuffer(fileInput);
});

function processExtractedText(text) {
    const inputs = extractInputs(text);
    document.getElementById("output").textContent = inputs.join("\n");

    // Create a new downloadable file
    createDownloadableFile(inputs);
}

function extractInputs(text) {
    let inputs = [];
    let isInputSection = false;
    let tempInput = [];

    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith(">>>>INPUT")) {
            isInputSection = true;
            continue;
        }
        if (line.startsWith("<<<<OUTPUT")) {
            isInputSection = false;
            if (tempInput.length > 0) {
                inputs.push(tempInput.join(" ")); // Merge continuous input lines
                tempInput = [];
            }
            continue;
        }
        if (isInputSection) {
            if (line === "") {
                if (tempInput.length > 0) {
                    inputs.push(tempInput.join(" ")); // Merge and store
                    tempInput = [];
                }
                continue;
            }
            let cleanedLine = line.replace(/^[-•] /, "").replace(/[<]/g, "").trim();
            tempInput.push(cleanedLine);
        }
    }

    if (tempInput.length > 0) {
        inputs.push(tempInput.join(" ")); // Add last collected input
    }

    return inputs;
}

function createDownloadableFile(inputs) {
    const outputText = "\nExtracted Inputs:\n" + inputs.join("\n");
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.style.display = "block";
    downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "extracted_inputs.txt";
        a.click();
    };
}

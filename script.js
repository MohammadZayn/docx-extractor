document.getElementById("processBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("Please select a .docx or .txt file.");
        return;
    }

    const fileType = fileInput.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async function (event) {
        const fileContent = event.target.result;

        if (fileType === "txt") {
            // Process plain text file
            processText(fileContent);
        } else if (fileType === "docx") {
            // Process .docx file using Mammoth
            mammoth.extractRawText({ arrayBuffer: fileContent })
                .then(result => processText(result.value))
                .catch(err => console.error("Error reading .docx file:", err));
        } else {
            alert("Unsupported file type! Please upload a .docx or .txt file.");
        }
    };

    if (fileType === "txt") {
        reader.readAsText(fileInput);
    } else {
        reader.readAsArrayBuffer(fileInput);
    }
});

function processText(text) {
    const inputs = extractInputs(text);
    document.getElementById("output").textContent = inputs.join("\n");

    // Create a downloadable file
    createDownloadableFile(inputs);
}

function extractInputs(text) {
    let inputs = [];
    let isInputSection = false;
    let currentInputBlock = [];
    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();

        // Start collecting inputs
        if (line.startsWith(">>>>INPUT")) {
            isInputSection = true;
            continue;
        }
        // Stop collecting when OUTPUT section starts
        if (line.startsWith("<<<<OUTPUT")) {
            isInputSection = false;
            if (currentInputBlock.length > 0) {
                inputs.push(currentInputBlock.join(" ")); // Merge multiline input
                currentInputBlock = [];
            }
            continue;
        }

        // Process inputs while inside INPUT section
        if (isInputSection) {
            if (line === "") {
                // If empty line appears, store the collected block and reset
                if (currentInputBlock.length > 0) {
                    inputs.push(currentInputBlock.join(" "));
                    currentInputBlock = [];
                }
            } else {
                // Remove unnecessary characters ("-", "<") and store
                let cleanedLine = line.replace(/^- /, "").replace(/[<]/g, "").trim();
                currentInputBlock.push(cleanedLine);
            }
        }
    }

    // Ensure last collected input block is added
    if (currentInputBlock.length > 0) {
        inputs.push(currentInputBlock.join(" "));
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

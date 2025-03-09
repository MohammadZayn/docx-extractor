document.getElementById("processBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("Please select a .docx file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;

        // Convert .docx to text
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(result => {
                const extractedText = result.value;
                const inputs = extractInputs(extractedText);
                document.getElementById("output").textContent = inputs.join("\n");

                // Create a new downloadable file
                createDownloadableFile(inputs);
            })
            .catch(err => console.error("Error reading file:", err));
    };
    reader.readAsArrayBuffer(fileInput);
});

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

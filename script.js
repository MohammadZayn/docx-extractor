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
    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith(">>>>INPUT")) {
            isInputSection = true;
            continue;
        }
        if (line.startsWith("<<<<OUTPUT")) {
            isInputSection = false;
            continue;
        }
        if (isInputSection && line.startsWith("1 >")) {
            // Remove "- ", "<", and trim the result
            let cleanedLine = line.substring(3).replace(/^- /, "").replace(/[<]/g, "").trim();
            inputs.push(cleanedLine);
        }
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

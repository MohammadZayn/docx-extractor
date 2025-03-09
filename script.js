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
                const groupedInputs = extractInputsByScenario(extractedText);
                
                // Display formatted output
                document.getElementById("output").innerHTML = formatExtractedData(groupedInputs);

                // Create downloadable file
                createDownloadableFile(groupedInputs);
            })
            .catch(err => console.error("Error reading file:", err));
    };
    reader.readAsArrayBuffer(fileInput);
});

function extractInputsByScenario(text) {
    let scenarios = {};
    let currentScenario = "General";
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

        // Detect scenario name if present
        if (isInputSection && line.startsWith("Scenario:")) {
            currentScenario = line.replace("Scenario:", "").trim();
            scenarios[currentScenario] = [];
            continue;
        }

        if (isInputSection && line.startsWith("1 >")) {
            let cleanedInput = line.substring(3).trim(); // Remove "1 >" marker
            if (!scenarios[currentScenario]) {
                scenarios[currentScenario] = [];
            }
            scenarios[currentScenario].push(cleanedInput);
        }
    }

    return scenarios;
}

function formatExtractedData(groupedInputs) {
    let outputHTML = "";
    for (let scenario in groupedInputs) {
        outputHTML += `<strong>${scenario}</strong><br>`;
        groupedInputs[scenario].forEach(input => {
            outputHTML += `• ${input}<br>`;
        });
        outputHTML += "<br>";
    }
    return outputHTML;
}

function createDownloadableFile(groupedInputs) {
    let outputText = "";
    for (let scenario in groupedInputs) {
        outputText += `${scenario}\n`;
        groupedInputs[scenario].forEach(input => {
            outputText += `- ${input}\n`;
        });
        outputText += "\n";
    }

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

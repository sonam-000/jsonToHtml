import fs from 'fs';
import axios from 'axios';
import { fixFields, createBlockContent, createSectionMetaDataContent } from './utils.js';

const SECTION_TYPE = "core/franklin/components/section/v1/section";

class JsonToHtmlConverter {
    constructor(inputFile, outputHtmlFile) {
        // TO DO: Get the JSON file from Genesis 
        this.inputFile = inputFile;
        this.outputHtmlFile = outputHtmlFile;
    }

    convertJsonToHtml(jsonObject) {
        const jsonData = jsonObject;
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>JSON to HTML</title>
                </head>
                <body>`;

        Object.entries(jsonData["jcr:content"]["root"]).forEach(([key, value]) => {
            if (typeof value === "object" && value["sling:resourceType"] === SECTION_TYPE) {
                htmlContent += `<div>\n`;
                const section = value;
                Object.entries(section).forEach(([blockName, blockJson]) => {
                    htmlContent = createBlockContent(blockJson, htmlContent);  
                });
                if(section["style"]) {
                    htmlContent = createSectionMetaDataContent(section, htmlContent);
                }
                htmlContent += `\n</div>\n`;
            }
        });

        htmlContent += `
            </body>
            </html>`;

        fs.writeFile(this.outputHtmlFile, htmlContent, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('HTML file created successfully!');
            // TO DO: Upload output file to github.io
            this.postHtmlContent();
        });
       
    }

    fixAndSaveJson() {
        try {
            const data = fs.readFileSync(this.inputFile, 'utf8');
            const fixedData = fixFields(data, ['message', 'text']);
            const jsonObject = JSON.parse(fixedData);
            return jsonObject;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    postHtmlContent = () => {
        fs.readFile(this.outputHtmlFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading HTML file:', err);
                return;
            }
            // TO DO: Add code for handling page path
            axios.post('https://admin.hlx.page/preview/sonam-000/ue-eds/main/helpx-test', data, {
                headers: {
                    'Content-Type': 'text/html'
                }
            })
            .then(response => {
                console.debug('POST request successful:', response.data);
            })
            .catch(error => {
                console.error('Error making POST request:', error);
            });
        });
    }
}

const converter = new JsonToHtmlConverter('eds.json', 'output.html');
const cleanedJson = converter.fixAndSaveJson();
converter.convertJsonToHtml(cleanedJson);

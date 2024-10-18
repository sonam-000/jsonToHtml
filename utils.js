import { load } from 'cheerio';

const TEXT_TYPE = "core/franklin/components/text/v1/text";
const BLOCK_TYPE = "core/franklin/components/block/v1/block";
const ITEM_TYPE = "core/franklin/components/block/v1/block/item";
const IMAGE_TYPE = "core/franklin/components/image/v1/image";

export const fixFields = (input, fields) => {
    let fixedData = input.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    fields.forEach(field => {
        const regex = new RegExp(`("${field}":\\s*)'([^']*?)'`, 'g');
        fixedData = fixedData.replace(regex, (match, prefix, content) => {
            const sanitizedContent = `"${content.slice(1, -1).replace(/"/g, "'")}"`;
            return `${prefix}${sanitizedContent}`;
        });
    });
    return fixedData;
};

// Method to add id attribute to h2 tags based on their content
export const addIdToH2Tags = (htmlContent) => {
    const $ = load(htmlContent);
    $('h2').each(function() {
        const textContent = $(this).text().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        $(this).attr('id', textContent);
    });
    return $('body').html();
};

export const createBlockContent = (blockJson, htmlContent) => {
    const { 'sling:resourceType': type, text, name, model, message, filter, fileReference } = blockJson;
    switch (type) {
        case TEXT_TYPE:
            let textProperty = text;
            if (textProperty.includes('<h2')) {
                textProperty = addIdToH2Tags(textProperty);

            }
            if (textProperty.includes('<div')) {
                const $ = load(textProperty);

                // Remove all <div> tags
                let divs = $('div');
                while (divs.length) {
                    divs.each(function() {
                        $(this).replaceWith($(this).html());
                    });
                    divs = $('div');
                }

                // Get the cleaned text without outer HTML tags
                const cleanedText = $('body').html() || $.html();
                htmlContent += cleanedText;
            } else {
                htmlContent += textProperty;
            }
            break;
        case BLOCK_TYPE:
            const cleanMessage = message ? message.replace(/<p>/g, '').replace(/<\/p>/g, '') : '';
            const updatedModel = name && name.split(/\s+/).length >= 2 ? name.toLowerCase().replace(/\s+/g, '-') : model;
            
            if (filter === undefined) {
                htmlContent += `
                    <div class="${updatedModel}">
                        <div>
                            <div>${cleanMessage || ''}</div>
                        </div>
                    </div>`;
            } else {
                htmlContent += `
                    <div class="${filter}">`;
                        Object.entries(blockJson)
                            .filter(([, item]) => item["sling:resourceType"] === ITEM_TYPE)
                            .forEach(([, item]) => {
                                // Process each item as needed
                                htmlContent += `
                                    <div>
                                        <div>${item["summary"]}</div>
                                        <div>${item["text"]}</div>
                                    </div>
                                    `;
                        });
                    htmlContent += "</div>";
            }
            break;
        case IMAGE_TYPE:
            htmlContent += `
                <p>
                    <picture>
                        <img src="${fileReference}" /> 
                    </picture>
                </p>`;
            break;
    }
    return htmlContent;
}

export const createSectionMetaDataContent = (section, htmlContent) => {
    // Process section metadata as needed
    htmlContent += `
    <div class="section-metadata">
        <div>
            <div>style</div>
            <div>${section["style"]}</div>
        </div>
    </div>`;
    return htmlContent;
}
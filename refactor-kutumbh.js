const fs = require('fs');
const path = require('path');

const targetDirs = ['src'];
const additionalFiles = ['package.json', 'index.html', 'README.md'];

const replacements = [
    { regex: /Nabha Sihata/g, replace: 'Kutumbh Care' },
    { regex: /NabhaSihata/g, replace: 'KutumbhCare' },
    { regex: /nabhasihata/g, replace: 'kutumbhcare' },
    { regex: /Nabha/g, replace: 'City' },
    { regex: /nabha/g, replace: 'city' },
    { regex: /Punjab/g, replace: 'State' },
    { regex: /Swasthya Rakshak/gi, replace: 'Kutumbh Care Team' },
    { regex: /Swasthya/g, replace: 'Kutumbh' }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.md') || fullPath.endsWith('.json') || fullPath.endsWith('.html')) {
            processFile(fullPath);
        }
    }
}

targetDirs.forEach(walkDir);
additionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        processFile(file);
    }
});

console.log("Refactor complete.");

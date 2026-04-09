const fs = require('fs');
const path = 'g:/Sunny Work/projects/Efootball-stats-tracker/client/src/components/PlayerDetailsModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// The pattern is className={`... ${...} `}>
// We want to add the missing backtick and closing brace: className={`... ${...} `}>

// Let's identify the lines by their content.
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // If it has className={` and doesn't have the closing `} at the end of the tag
    if (line.includes('className={`') && line.endsWith('}>')) {
        // Double check if it's already fixed
        if (!line.includes('`}>')) {
            // It might be like `... ${...}`}> or `... ${...} `}>
            // If it ends with `}>` it already has a backtick? No, let's see.
            // If it's broken, it likely looks like ${...}}>
            
            // Let's just target the specific broken lines I saw.
            if (line.includes('animate-fade-in') || line.includes('animate-slide-up') || line.includes('animate-slide-up')) {
                 // Try to fix common patterns
                 lines[i] = line.replace(/(\${[^}]+}\s*)>/, '$1`}>');
            }
        }
    }
}

// Special case for line 665 which ends in alt=""
// lines[664] = lines[664].replace(/('blur-\[60px\]'}\s*) alt/, "$1`} alt");

// Re-evaluate: Let's do a more robust search and replace for the known patterns.

content = content.replace(/animate-fade-in'}\s*>/g, "animate-fade-in'} `}>");
content = content.replace(/animate-slide-up'}\s*\${isEditing \? 'h-auto overflow-y-auto' : ''}\s*>/g, "animate-slide-up'} ${isEditing ? 'h-auto overflow-y-auto' : ''} `}>");
content = content.replace(/blur-\[60px\]'}\s* /g, "blur-[60px]'} `} ");
content = content.replace(/getCardStyles\(formData.cardType\).glow}\s*>/g, "getCardStyles(formData.cardType).glow} `}>");
content = content.replace(/getCardStyles\(formData.cardType\).leak} blur-3xl opacity-60>/g, "getCardStyles(formData.cardType).leak} blur-3xl opacity-60`}>");
content = content.replace(/getCardStyles\(formData.cardType\).leak} blur-3xl opacity-40>/g, "getCardStyles(formData.cardType).leak} blur-3xl opacity-40`}>");
content = content.replace(/getCardStyles\(formData.cardType\).flare} blur-\[80px\] opacity-30>/g, "getCardStyles(formData.cardType).flare} blur-[80px] opacity-30`}>");
content = content.replace(/formData.cardType\).bg} no-scrollbar md:border-r border-white\/5 relative overflow-hidden h-fit md:h-full shrink-0>/g, "formData.cardType).bg} no-scrollbar md:border-r border-white/5 relative overflow-hidden h-fit md:h-full shrink-0`}>");


fs.writeFileSync(path, content);
console.log('Finished fixing brackets.');

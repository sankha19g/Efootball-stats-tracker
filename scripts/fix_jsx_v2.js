const fs = require('fs');
const path = 'g:/Sunny Work/projects/Efootball-stats-tracker/client/src/components/PlayerDetailsModal.jsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('className={`') && line.trim().endsWith('>')) {
        // Check if it's already closed with `}>
        if (!line.includes('`}>')) {
            // It's broken. It likely ends in ...${...}}> or ...${...} >
            // or even ...'fixed'}>
            
            // We want to insert `} before the >
            lines[i] = line.replace(/(\s*)>$/, '`}>');
            // Wait, that might be too simple. Let's be safer.
        }
    }
}

// Manual fixes for specific lines to be absolutely sure
content = lines.join('\n');

// 635
content = content.replace(/animate-fade-in'}\s*>/g, "animate-fade-in'} `}>");
// 647
content = content.replace(/animate-slide-up'}\s*\${isEditing \? 'h-auto overflow-y-auto' : ''}\s*>/g, "animate-slide-up'} ${isEditing ? 'h-auto overflow-y-auto' : ''} `}>");
// 659
content = content.replace(/formData.cardType\).bg}\s*no-scrollbar\s*md:border-r\s*border-white\/5\s*relative\s*overflow-hidden\s*h-fit\s*md:h-full\s*shrink-0\s*>/g, "formData.cardType).bg} no-scrollbar md:border-r border-white/5 relative overflow-hidden h-fit md:h-full shrink-0`}>");
// 666
content = content.replace(/getCardStyles\(formData.cardType\).glow}\s*>\s*<\/div>/g, "getCardStyles(formData.cardType).glow} `}></div>");
// 670
content = content.replace(/getCardStyles\(formData.cardType\).glow}\s*`\s*>/g, "getCardStyles(formData.cardType).glow} `}>");
// 675, 676, 679
content = content.replace(/leak}\s*blur-3xl\s*opacity-60\s*>\s*<\/div>/g, "leak} blur-3xl opacity-60`}></div>");
content = content.replace(/leak}\s*blur-3xl\s*opacity-40\s*>\s*<\/div>/g, "leak} blur-3xl opacity-40`}></div>");
content = content.replace(/flare}\s*blur-\[80px\]\s*opacity-30\s*>\s*<\/div>/g, "flare} blur-[80px] opacity-30`}></div>");

fs.writeFileSync(path, content);
console.log('Fixed JSX attributes.');

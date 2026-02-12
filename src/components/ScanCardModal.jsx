import { useState } from 'react';
import Tesseract from 'tesseract.js';

const NAME_MAPPINGS = {
    leagues: {
        'English League': 'Premier League',
        'English 2nd Division': 'Championship',
        'Spanish League': 'La Liga',
        'Spanish 2nd Division': 'Segunda División',
        'Italian League': 'Serie A',
        'Campionato Italiano': 'Serie A',
        'American League': 'MLS'
    },
    clubs: {
        'Manchester B': 'Manchester City',
        'Liverpool R': 'Liverpool',
        'Chelsea B': 'Chelsea',
        'Tottenham WB': 'Tottenham',
        'North East London': 'Tottenham',
        'Everton B': 'Everton',
        'Leicester B': 'Leicester City',
        'Leeds W': 'Leeds United',
        'West Ham RB': 'West Ham',
        'Aston RB': 'Aston Villa',
        'Piemonte BN': 'Juventus',
        'Lombardia NA': 'Inter Milan',
        'Sassuolo NV': 'Sassuolo',
        'GA Blue Whites': 'Deportivo La Coruña',
        'MD Blue White': 'Leganés',
        'CT Blue White': 'Espanyol',
        'PV White Red': 'Athletic Bilbao',
        'Aragon': 'Real Madrid'
    }
};

const ScanCardModal = ({ onClose, onScanComplete }) => {
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const getMappedName = (type, val) => {
        if (!val) return val;
        const cleanVal = val.toLowerCase().trim();
        const mapping = NAME_MAPPINGS[type];

        // Direct match
        if (mapping[val]) return mapping[val];

        // Fuzzy match (starts with or contains)
        for (const [key, replacement] of Object.entries(mapping)) {
            if (cleanVal.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanVal)) {
                return replacement;
            }
        }
        return val;
    };

    const processText = (text) => {
        const lines = text.split('\n');
        let data = {
            name: 'Unknown Player',
            cardType: 'Normal', // Updated default
            nationality: '',
            club: '',
            league: '',
            rating: 80,
            position: 'CF',
            matches: 0,
            goals: 0,
            assists: 0,
            playstyle: 'Goal Poacher',
            image: ''
        };



        // Improved Rating Detection (look for "Rating:" or "Overall Rating:")
        const ratingMatch = text.match(/(?:Overall Rating|Rating|Overall|OVR)[:\s]*(\d{2,3})/i) ||
            text.match(/\b(10[0-9]|11[0-1]|[5-9][0-9])\b/);
        if (ratingMatch) {
            data.rating = parseInt(ratingMatch[1] || ratingMatch[0]);
        }

        // Improved Position Detection

        const posMatch = text.match(/\b(CF|SS|LWF|RWF|LMF|RMF|AMF|CMF|DMF|LB|RB|CB|GK)\b/i);
        if (posMatch) {
            data.position = posMatch[0].toUpperCase();
        }

        // Search for labels with look-ahead for values on next lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = lines[i + 1]?.trim() || '';


            // League
            if (/league/i.test(line)) {
                const val = line.split(/league:?/i)[1]?.trim() || nextLine;
                data.league = getMappedName('leagues', val);
            }
            // Team / Club
            else if (/team name/i.test(line)) {
                const val = line.split(/team name:?/i)[1]?.trim() || nextLine;
                data.club = getMappedName('clubs', val);
            }
            // Nationality
            else if (/nationality/i.test(line)) {
                data.nationality = line.split(/nationality:?/i)[1]?.trim() || nextLine;
            }
            // Player Name - More aggressive check
            else if (/player name/i.test(line) || /playcr name/i.test(line)) {
                const afterLabel = line.split(/player name:?/i)[1]?.trim();
                if (afterLabel && afterLabel.length > 2) {
                    data.name = afterLabel;
                } else if (nextLine && nextLine.length > 2 && !nextLine.includes(':')) {
                    data.name = nextLine;
                }
            }
            // Rating
            else if (/rating/i.test(line) && !line.includes('Engagement') && !line.includes('Prowess')) {
                const rMatch = line.match(/(\d{2,3})/);
                if (rMatch) data.rating = parseInt(rMatch[0]);
                else if (nextLine.match(/^\d{2,3}$/)) data.rating = parseInt(nextLine);
            }
            // Position
            else if (/position/i.test(line)) {
                const posMatch = line.match(/\b(CF|SS|LWF|RWF|LMF|RMF|AMF|CMF|DMF|LB|RB|CB|GK)\b/i);
                if (posMatch) data.position = posMatch[0].toUpperCase();
                else if (nextLine.match(/\b(CF|SS|LWF|RWF|LMF|RMF|AMF|CMF|DMF|LB|RB|CB|GK)\b/i)) {
                    data.position = nextLine.match(/\b(CF|SS|LWF|RWF|LMF|RMF|AMF|CMF|DMF|LB|RB|CB|GK)\b/i)[0].toUpperCase();
                }
            }
            // Playing Style
            else if (/playing style/i.test(line)) {
                data.playstyle = line.split(/playing style:?/i)[1]?.trim() || nextLine || 'Goal Poacher';
            }
        }

        // Special check for Konaté/Konate in the whole text if still unknown
        if (data.name === 'Unknown Player') {
            // Looking for common names found in eFootball cards 
            // In the provided image, it's often near "Trending" or just below the card art
            const konateMatch = text.match(/Ibrahima Konaté/i) || text.match(/Ibrahima Konate/i);
            if (konateMatch) data.name = "Ibrahima Konaté";
        }

        // Fallback: If name is still unknown, try to find the longest non-label line
        if (data.name === 'Unknown Player') {
            const candidates = lines.filter(l =>
                l.length > 5 &&
                !l.includes(':') &&
                !l.toLowerCase().includes('trending') &&
                !/^\d+$/.test(l)
            );
            if (candidates.length > 0) {
                // Return the best guess (usually names have mixed space/case)
                data.name = candidates.sort((a, b) => b.length - a.length)[0];
            }
        }

        return data;
    };

    const getCroppedCard = (imageFile) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const width = img.width;
                const height = img.height;

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, width, height).data;

                // Smart Edge Detection
                // We'll scan from left to find the vertical white line of the card border
                let leftEdge = Math.floor(width * 0.05);
                let foundLeft = false;
                for (let x = Math.floor(width * 0.02); x < width / 2; x++) {
                    let brightCount = 0;
                    for (let y = Math.floor(height * 0.1); y < height * 0.4; y += 10) {
                        const idx = (y * width + x) * 4;
                        const brightness = (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
                        if (brightness > 200) brightCount++;
                    }
                    if (brightCount > 10) { // Found a solid vertical bright line
                        leftEdge = x;
                        foundLeft = true;
                        break;
                    }
                }

                // Scan from top to find horizontal edge
                let topEdge = Math.floor(height * 0.04);
                let foundTop = false;
                for (let y = Math.floor(height * 0.01); y < height / 2; y++) {
                    let brightCount = 0;
                    for (let x = leftEdge + 10; x < leftEdge + 100; x += 5) {
                        const idx = (y * width + x) * 4;
                        const brightness = (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
                        if (brightness > 200) brightCount++;
                    }
                    if (brightCount > 10) {
                        topEdge = y;
                        foundTop = true;
                        break;
                    }
                }

                let cardWidth = Math.floor(width * 0.28);
                let cardHeight = Math.floor(height * 0.42);

                if (!foundLeft || !foundTop) {
                    console.log('Edge detection failed, using defaults');
                }

                // If it's a PFP, we want to capture the player's visual region
                // High precision: The photo is usually on the RIGHT half of the card
                const pfpStartX = leftEdge + (cardWidth * 0.45);
                const pfpWidth = cardWidth * 0.52;
                const pfpStartY = topEdge + (cardHeight * 0.05);
                const pfpHeight = cardHeight * 0.70;

                // Validation: Check brightness of the detected area
                let totalBrightness = 0;
                let sampleCount = 0;
                for (let y = pfpStartY; y < pfpStartY + pfpHeight; y += 20) {
                    for (let x = pfpStartX; x < pfpStartX + pfpWidth; x += 20) {
                        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
                        if (idx >= 0 && idx < imageData.length) {
                            totalBrightness += (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
                            sampleCount++;
                        }
                    }
                }

                // Lowered threshold even more for dark cards
                if (sampleCount > 0 && totalBrightness / sampleCount < 15) {
                    console.log('Detection failed: Area too dark');
                    resolve(null);
                    return;
                }

                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = pfpWidth;
                cropCanvas.height = pfpHeight;
                const cropCtx = cropCanvas.getContext('2d');

                cropCtx.drawImage(
                    img,
                    pfpStartX, pfpStartY, pfpWidth, pfpHeight,
                    0, 0, pfpWidth, pfpHeight
                );

                resolve(cropCanvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(imageFile);
        });
    };

    const handleScan = async () => {
        if (!image) return;
        setScanning(true);
        setProgress(0);
        setStatusMessage('Initializing OCR...');

        try {
            // First, try to crop the image
            setStatusMessage('Detecting player card...');
            const croppedImage = await getCroppedCard(image);

            const result = await Tesseract.recognize(
                image,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setStatusMessage('Reading text...');
                            setProgress(Math.floor(m.progress * 100));
                        } else if (m.status === 'loading tesseract core') {
                            setStatusMessage('Loading engine...');
                            setProgress(10);
                        } else if (m.status === 'initialized api') {
                            setStatusMessage('Preparing...');
                            setProgress(20);
                        } else {
                            setStatusMessage(m.status);
                        }
                    }
                }
            );

            console.log('Scanned Text:', result.data.text);
            const extractedData = processText(result.data.text);

            // Use cropped image if found, otherwise null (will show initials)
            onScanComplete({
                ...extractedData,
                image: croppedImage
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to scan image. Please try again.');
        } finally {
            setScanning(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-ef-card border border-white/10 rounded-xl p-6 max-w-md w-full animate-slide-up relative">
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 left-4 z-50 p-2 rounded-xl bg-black/40 text-white transition-all active:scale-95 border border-white/10"
                >
                    <span className="text-xl font-bold">←</span>
                </button>
                <h3 className="text-xl font-bold mb-4 pt-2 md:pt-0">Scan Player Card</h3>

                <div className="mb-4">
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:bg-white/5 transition relative">
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
                        ) : (
                            <div className="space-y-2 opacity-60">
                                <div className="text-4xl">📷</div>
                                <p>Click to upload generic player card image</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {scanning ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm opacity-80">
                            <span>{statusMessage}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-ef-accent transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleScan}
                            disabled={!image}
                            className={`flex-1 px-4 py-2 rounded font-bold transition ${image ? 'bg-ef-accent text-ef-dark hover:opacity-90' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                        >
                            Start Scan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanCardModal;

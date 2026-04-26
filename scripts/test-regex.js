const unitPriceStr = "0,98€/l";
const ppuMatch = unitPriceStr.match(/(\d+[.,]\d*)\s*€?\s*\/\s*(l|kg|g|ml|pcs?)/i);
console.log(ppuMatch);

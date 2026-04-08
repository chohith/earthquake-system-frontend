const fs = require('fs');
async function scrape() {
    try {
        const response = await fetch("https://riseq.seismo.gov.in/riseq/earthquake", {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();
        fs.writeFileSync("test.html", html);
        console.log("Wrote test.html");
    } catch(e) {
        console.error(e);
    }
}
scrape();

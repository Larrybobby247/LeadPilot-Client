export function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') {
                cur += '"';
                i++;
            }
            else if (c === '"')
                q = false;
            else
                cur += c;
        }
        else if (c === '"')
            q = true;
        else if (c === ',') {
            row.push(cur);
            cur = '';
        }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n')
                i++;
            row.push(cur);
            cur = '';
            if (row.some((x) => x.trim()))
                rows.push(row);
            row = [];
        }
        else
            cur += c;
    }
    row.push(cur);
    if (row.some((x) => x.trim()))
        rows.push(row);
    return rows;
}
export const CSV_TEMPLATE = 'name,category,phone,email,website,city\nExample Business,Restaurants,08031234567,hello@example.com,https://example.com,Ibadan\n';

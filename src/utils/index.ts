


export function createPageUrl(pageName: string) {
    // Split page name and query parameters
    const [page, ...queryParts] = pageName.split('?');
    const queryString = queryParts.join('?');
    
    // Only convert page name to lowercase, preserve query parameters case
    const lowercasePage = page.toLowerCase().replace(/ /g, '-');
    
    return '/' + lowercasePage + (queryString ? '?' + queryString : '');
}
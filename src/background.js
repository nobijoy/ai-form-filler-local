// This service worker is required by Manifest V3.
// Handle NER requests from content scripts

chrome.runtime.onInstalled.addListener(() => {
  console.log('[background.js] AI Form Filler extension installed.');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'performNER') {
    console.log('[background.js] Received NER request:', message.text);
    
    // For now, return a simple fallback response
    // In a real implementation, we'd need to load the AI model here
    // or communicate with the popup (which is complex)
    
    // Enhanced entity detection based on keywords and field types
    const text = message.text.toLowerCase();
    const entities = [];
    
    // Check for specific field types first
    if (text.includes('email')) {
      entities.push({ entity: 'EMAIL', score: 0.9, word: 'email' });
    } else if (text.includes('password')) {
      entities.push({ entity: 'PASSWORD', score: 0.9, word: 'password' });
    } else if (text.includes('phone') || text.includes('mobile') || text.includes('tel')) {
      entities.push({ entity: 'PHONE', score: 0.9, word: 'phone' });
    } else if (text.includes('date') || text.includes('birth')) {
      entities.push({ entity: 'DATE', score: 0.9, word: 'date' });
    } else if (text.includes('country')) {
      entities.push({ entity: 'LOCATION', score: 0.9, word: 'country' });
    } else if (text.includes('quantity') || text.includes('number') || text.includes('amount') || text.includes('range')) {
      entities.push({ entity: 'NUMBER', score: 0.9, word: 'number' });
    } else if (text.includes('comment') || text.includes('description') || text.includes('note') || text.includes('text')) {
      entities.push({ entity: 'TEXT', score: 0.9, word: 'text' });
    } else if (text.includes('search')) {
      entities.push({ entity: 'SEARCH', score: 0.9, word: 'search' });
    } else if (text.includes('url') || text.includes('website') || text.includes('link')) {
      entities.push({ entity: 'URL', score: 0.9, word: 'url' });
    } else if (text.includes('color') || text.includes('colour')) {
      entities.push({ entity: 'COLOR', score: 0.9, word: 'color' });
    } else if (text.includes('time')) {
      entities.push({ entity: 'TIME', score: 0.9, word: 'time' });
    } else if (text.includes('datetime') || text.includes('date time')) {
      entities.push({ entity: 'DATETIME', score: 0.9, word: 'datetime' });
    } else if (text.includes('month')) {
      entities.push({ entity: 'MONTH', score: 0.9, word: 'month' });
    } else if (text.includes('week')) {
      entities.push({ entity: 'WEEK', score: 0.9, word: 'week' });
    } else if (text.includes('priority') || text.includes('importance') || text.includes('level')) {
      entities.push({ entity: 'TEXT', score: 0.9, word: 'priority' });
    } else if (text.includes('name') && !text.includes('file')) {
      entities.push({ entity: 'PERSON', score: 0.9, word: 'name' });
    }
    // Person-related keywords
    else if (text.includes('manager') || text.includes('boss') || text.includes('supervisor') || 
        text.includes('colleague') || text.includes('coworker') || text.includes('contact') ||
        text.includes('person') || text.includes('who') || text.includes('director') ||
        text.includes('head') || text.includes('physician') || text.includes('doctor') ||
        text.includes('answer to') || text.includes('report to') || text.includes('point person') ||
        text.includes('emergency') || text.includes('kin')) {
      entities.push({ entity: 'PERSON', score: 0.8, word: 'person' });
    }
    // Organization-related keywords  
    else if (text.includes('organization') || text.includes('company') || text.includes('work') ||
        text.includes('client') || text.includes('business') || text.includes('vendor') ||
        text.includes('supplier') || text.includes('employer') || text.includes('school') ||
        text.includes('university') || text.includes('institution') || text.includes('affiliated') ||
        text.includes('account')) {
      entities.push({ entity: 'ORG', score: 0.8, word: 'organization' });
    }
    // Location-related keywords
    else if (text.includes('city') || text.includes('born') || text.includes('place') ||
        text.includes('location') || text.includes('where') || text.includes('based') ||
        text.includes('office') || text.includes('branch') || text.includes('grow up') ||
        text.includes('grew up') || text.includes('hail') || text.includes('from')) {
      entities.push({ entity: 'LOC', score: 0.8, word: 'location' });
    }
    
    console.log('[background.js] Returning entities:', entities);
    sendResponse({ success: true, entities: entities });
    return true;
  }
});

console.log('[background.js] Service worker started.');

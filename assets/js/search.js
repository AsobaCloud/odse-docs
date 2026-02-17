// Search functionality - loads from auto-generated search-index.json

async function loadSearchIndex() {
  try {
    const response = await fetch('/docs/search-index.json');
    if (!response.ok) {
      throw new Error('Failed to load search index');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading search index:', error);
    return [];
  }
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function performSearch(query, searchData) {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length === 0) {
    return [];
  }
  
  const results = [];
  
  searchData.forEach(item => {
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const hierarchyLower = item.hierarchy ? item.hierarchy.toLowerCase() : '';
    
    // Calculate relevance score
    let relevanceScore = 0;
    
    queryWords.forEach(word => {
      // Title match (highest weight)
      if (titleLower.includes(word)) {
        relevanceScore += 10;
      }
      // Hierarchy match (medium weight)
      if (hierarchyLower.includes(word)) {
        relevanceScore += 5;
      }
      // Content match (lowest weight)
      if (contentLower.includes(word)) {
        relevanceScore += 1;
      }
    });
    
    // Only include if there's a match
    if (relevanceScore > 0) {
      // Find best content snippet
      let preview = item.content.substring(0, 150);
      const firstMatchIndex = contentLower.indexOf(queryWords[0]);
      if (firstMatchIndex !== -1) {
        const start = Math.max(0, firstMatchIndex - 30);
        const end = Math.min(contentLower.length, firstMatchIndex + queryWords[0].length + 120);
        preview = '...' + item.content.substring(start, end) + '...';
      }
      
      results.push({
        title: item.title,
        url: item.url,
        hierarchy: item.hierarchy,
        preview: preview,
        relevance: relevanceScore
      });
    }
  });
  
  // Sort by relevance (highest first)
  results.sort((a, b) => b.relevance - a.relevance);
  
  // Limit to top 10 results
  return results.slice(0, 10);
}

function displayResults(results, query) {
  const searchResults = document.getElementById('search-results');
  
  if (!searchResults) {
    return;
  }
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No results found</div>';
    searchResults.style.display = 'block';
    return;
  }
  
  const html = results.map(item => {
    const titleHighlight = highlightMatch(item.title, query);
    const hierarchy = item.hierarchy ? `<span class="search-hierarchy">${item.hierarchy}</span>` : '';
    const previewHighlight = highlightMatch(item.preview, query);
    
    return `
      <div class="search-result-item">
        <a href="${item.url}">
          <div class="search-result-title">${titleHighlight}</div>
          ${hierarchy}
          <div class="search-result-preview">${previewHighlight}</div>
        </a>
      </div>
    `;
  }).join('');
  
  searchResults.innerHTML = html;
  searchResults.style.display = 'block';
}

async function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) {
    return;
  }
  
  // Load search index
  const searchData = await loadSearchIndex();
  
  if (searchData.length === 0) {
    console.warn('Search index is empty or failed to load');
  }
  
  // Handle search input
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }
    
    const results = performSearch(query, searchData);
    displayResults(results, query);
  });
  
  // Close search results when clicking elsewhere
  document.addEventListener('click', function(event) {
    if (!searchResults.contains(event.target) && event.target !== searchInput) {
      searchResults.style.display = 'none';
    }
  });
  
  // Handle keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchResults.style.display = 'none';
      searchInput.blur();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
  initializeSearch();
}

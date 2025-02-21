// utils/getTurnNumber.js
export function getTurnNumber(article) {
    const dataTestId = article.getAttribute('data-testid');
    const match = dataTestId ? dataTestId.match(/conversation-turn-(\d+)/) : null;
    return match ? parseInt(match[1], 10) : null;
  }


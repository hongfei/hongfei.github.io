(function stockToolsFactory(global) {
  function formatDate(time) {
    return new Date(time).toISOString().slice(0, 10);
  }

  function parseDate(dateText) {
    const [year, month, day] = dateText.split('-').map(Number);
    return Date.UTC(year, month - 1, day, 12);
  }

  function addYears(time, years) {
    const date = new Date(time);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.getTime();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function yahooChartParams(range) {
    return `range=${encodeURIComponent(range)}&interval=1d&events=history&includeAdjustedClose=true`;
  }

  function yahooChartUrl(ticker, range) {
    return `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${yahooChartParams(range)}`;
  }

  function yahooProxyChartUrl(ticker, range) {
    return `https://r.jina.ai/http://r.jina.ai/http://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${yahooChartParams(range)}`;
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 80)}`);
    }
    return text;
  }

  function parseYahooPayload(text, ticker) {
    const jsonStart = text.indexOf('{"chart"');
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart).trim() : text.trim();
    const payload = JSON.parse(jsonText);
    const result = payload.chart?.result?.[0];
    const error = payload.chart?.error;
    if (error) throw new Error(error.description || error.code || 'Yahoo returned an error');
    if (!result?.timestamp?.length) throw new Error(`No Yahoo history found for ${ticker}`);

    const timestamps = result.timestamp;
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose;
    const close = result.indicators?.quote?.[0]?.close;
    const series = adjclose || close;
    if (!series?.length) throw new Error(`No adjusted close history found for ${ticker}`);

    const prices = timestamps.map((timestamp, index) => {
      const date = formatDate(timestamp * 1000);
      return {
        date,
        time: parseDate(date),
        price: Number(series[index])
      };
    }).filter((point) => Number.isFinite(point.price) && point.price > 0);

    if (prices.length < 2) throw new Error(`Not enough Yahoo history found for ${ticker}`);
    prices.sort((a, b) => a.time - b.time);
    return prices;
  }

  function findOnOrAfter(prices, time) {
    let low = 0;
    let high = prices.length - 1;
    let answer = null;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (prices[mid].time >= time) {
        answer = prices[mid];
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return answer;
  }

  function findOnOrBefore(prices, time) {
    let low = 0;
    let high = prices.length - 1;
    let answer = null;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (prices[mid].time <= time) {
        answer = prices[mid];
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return answer;
  }

  global.StockTools = {
    addYears,
    escapeHtml,
    fetchText,
    findOnOrAfter,
    findOnOrBefore,
    formatDate,
    parseDate,
    parseYahooPayload,
    yahooChartUrl,
    yahooProxyChartUrl
  };
})(window);

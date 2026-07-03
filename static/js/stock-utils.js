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

  function yahooOptionsUrl(ticker, expirationUnix = null) {
    const dateParam = Number.isFinite(Number(expirationUnix)) ? `?date=${encodeURIComponent(String(expirationUnix))}` : '';
    return `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}${dateParam}`;
  }

  function yahooProxyOptionsUrl(ticker, expirationUnix = null) {
    return `https://r.jina.ai/http://r.jina.ai/http://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}${Number.isFinite(Number(expirationUnix)) ? `?date=${encodeURIComponent(String(expirationUnix))}` : ''}`;
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

  function parseYahooOptionsPayload(text, ticker) {
    const optionJsonStart = text.indexOf('{"optionChain"');
    const financeJsonStart = text.indexOf('{"finance"');
    const jsonStart = optionJsonStart >= 0 ? optionJsonStart : financeJsonStart;
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart).trim() : text.trim();
    const payload = JSON.parse(jsonText);
    const financeError = payload.finance?.error;
    if (financeError) throw new Error(financeError.description || financeError.code || 'Yahoo returned an options error');
    const result = payload.optionChain?.result?.[0];
    const error = payload.optionChain?.error;
    if (error) throw new Error(error.description || error.code || 'Yahoo returned an options error');
    if (!result) throw new Error(`No Yahoo option chain found for ${ticker}`);

    const expirationDates = Array.isArray(result.expirationDates) ? result.expirationDates : [];
    const chain = result.options?.[0] || {};
    const normalizeContract = (contract, type) => {
      const bid = Number(contract.bid);
      const ask = Number(contract.ask);
      const last = Number(contract.lastPrice);
      const mid = Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0
        ? (bid + ask) / 2
        : last;
      return {
        id: String(contract.contractSymbol || `${type}-${contract.strike}`),
        contractSymbol: String(contract.contractSymbol || ''),
        type,
        strike: Number(contract.strike),
        premium: Number(mid),
        bid,
        ask,
        lastPrice: last,
        impliedVolatility: Number(contract.impliedVolatility),
        expiration: Number(contract.expiration),
        source: 'yahoo'
      };
    };

    const contracts = [
      ...(Array.isArray(chain.calls) ? chain.calls.map((contract) => normalizeContract(contract, 'call')) : []),
      ...(Array.isArray(chain.puts) ? chain.puts.map((contract) => normalizeContract(contract, 'put')) : [])
    ].filter((contract) => (
      Number.isFinite(contract.strike) &&
      contract.strike > 0 &&
      Number.isFinite(contract.premium) &&
      contract.premium >= 0
    ));

    contracts.sort((a, b) => a.strike - b.strike || a.type.localeCompare(b.type));
    return {
      expirationDates,
      expiration: Number(chain.expirationDate || contracts[0]?.expiration),
      quote: result.quote || {},
      contracts
    };
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
    parseYahooOptionsPayload,
    parseYahooPayload,
    yahooOptionsUrl,
    yahooChartUrl,
    yahooProxyOptionsUrl,
    yahooProxyChartUrl
  };
})(window);

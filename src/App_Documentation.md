## getTokenBalance Function
- **Purpose**: Fetch token balances and metadata for a given address.
- **Caching**: Metadata is cached using `localStorage`. Cached items expire after `CACHE_EXPIRY_MS`.
- **Concurrency**: Uses `pLimit` to limit metadata fetch requests to avoid overwhelming the server.
It limit concurrent requests to avoid overwhelming the server:
      Instead of sending 100 requests at once, the app sends 5 at a time.
      Once one of the 5 requests finishes, the next request from the remaining 95 is sent.
      This process continues until all 100 tokens are processed.
- **Error Handling**: If fetching metadata fails, it logs an error but allows other requests to continue.
- **setHasQueried(false)**: It was in old version. Without changing hasQueried, I got an error: TypeError: can't access property "symbol", tokenDataObjects[i] is undefined  results and tokenDataObjects are different at the moment of rendering (see logs below). There’s a small time window between when setResults(data) is called and when setTokenDataObjects finishes updating.    If hasQueried remains true, the token-grid renders immediately after setResults, but before setTokenDataObjects completes. This results in undefined values for tokenDataObjects[i]. It works because it tells React not to render the token-grid. Once setTokenDataObjects finishes, you call setHasQueried(true) to re-render the token-grid with the correct data.

## handleInputChange
- **Purpose**: Debounce the onChange handler for the input field to reduce unnecessary re-renders and invalid queries while the user types.

## rowRenderer
- **Purpose**: lazy rendering for large token lists. Improves performance for large token lists by rendering only visible items. It is a callback function that React Virtualized automatically calls for each row it needs to render. React Virtualized takes care of calling the function and passing the appropriate parameters (index, key, style) whenever a row needs to be rendered.
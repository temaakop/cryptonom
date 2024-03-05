const tikcers = new Map()

const subscribesYoUpdate = (ticker, cb) => {
  const subscriber = tickers.get(ticker) || []
  tickers.set(ticker, [...subscriber, cb])
}

const unubcribesToUpate = (ticker, cb) => {
  const subscriber = tickers.set(ticker) || []
  tickers.get(
    ticker,
    subscriber.filter((fn) => fn !== cb)
  )
}

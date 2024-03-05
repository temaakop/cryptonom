<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TickerCard from './components/TickerCard.vue'

export interface Ticker {
  name: string
  price: number | string
}

const ticker = ref<string>('')
const tickers = ref<Ticker[]>([])
const filterTicker = ref<string>('')
const allTickers = ref<string[]>([])
const currentTicker = ref()
const toggle = ref(false)
const coincidencesTickers = ref<string[]>([])
const page = ref<number>(1)

const startIndex = computed(() => {
  return (page.value - 1) * 6
})

const endIndex = computed(() => {
  return page.value * 6
})

const hasNextPage = computed(() => {
  return filteredTickers.value.length > endIndex.value
})

const paginatedTickers = computed(() => {
  return filteredTickers.value.slice(startIndex.value, endIndex.value)
})

const filteredTickers = computed(() => {
  const filteredTickers = tickers.value.filter((t) =>
    t.name.toLowerCase().includes(filterTicker.value.toLowerCase())
  )
  return filteredTickers
})

watch(paginatedTickers, () => {
  if (paginatedTickers.value.length === 0 && page.value > 1) {
    page.value -= 1
  }
})

watch(filterTicker, () => {
  page.value = 1
  window.history.pushState(
    null,
    document.title,
    `${window.location.pathname}?filter=${filterTicker.value}&page=${page.value}`
  )
})
watch(page, () => {
  window.history.pushState(
    null,
    document.title,
    `${window.location.pathname}?filter=${filterTicker.value}&page=${page.value}`
  )
})

watch(tickers, () => {
  console.log('tickers', tickers.value)
  localStorage.setItem('cryptonom-list', JSON.stringify(tickers.value))
})

async function fetchPrice(currency: string) {
  try {
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD&api_key=1cf853b4c5589fd678ea1d9b81ee4d0999e2091fe59c6238a8245babe3879f8a`
    )
    const data = await response.json()
    return data.USD
  } catch (error) {
    console.error(error)
  }
}

function subscribeToUpdate(tickerName: string) {
  setInterval(async () => {
    const rate = await fetchPrice(tickerName)
    const foundTicker = tickers.value.find((t) => t.name === tickerName)
    if (foundTicker) {
      foundTicker.price = rate
    }
  }, 7000)
}

onMounted(async () => {
  const windowData = Object.fromEntries(new URL(window.location).searchParams.entries())

  //Как сделать через цикл

  // const VALID_KEYS = ['filterTicker', 'page']

  // VALID_KEYS.forEach((key) => {
  //   if (windowData[key]) {
  //     key = windowData[key]
  //   }
  // })

  if (windowData.filter) {
    filterTicker.value = windowData.filter
  }

  if (windowData.page) {
    page.value = +windowData.page
  }
  const tickersData = localStorage.getItem('cryptonom-list')

  if (tickersData) {
    tickers.value = JSON.parse(tickersData)
  }
  tickers.value.forEach((t) => {
    subscribeToUpdate(t.name)
  })
  const response = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
  const data = await response.json()
  if (data) allTickers.value = Object.keys(data.Data)
})

async function addTicker() {
  coincidencesTickers.value = []
  const newTicker: Ticker = { name: ticker.value, price: '-' }

  if (!toggle.value) tickers.value = [...tickers.value, newTicker]

  subscribeToUpdate(newTicker.name)
  console.log(allTickers.value)
  ticker.value = ''
}

function onChange(tickerName: string) {
  coincidencesTickers.value = []
  allTickers.value.forEach((t: string) => {
    if (
      t.toLowerCase().includes(tickerName.toLowerCase()) &&
      coincidencesTickers.value.length < 6 &&
      tickerName.length
    ) {
      coincidencesTickers.value.push(t)
    }
  })

  toggle.value = false
  tickers.value.forEach((t) => {
    if (t.name === ticker.value) {
      toggle.value = true
    }
  })
}

function addTickerHind(tickerHidName: string) {
  ticker.value = tickerHidName
  addTicker()
}

function deleteTickers(tickerToRemove: string) {
  tickers.value = tickers.value.filter((t) => t.name !== tickerToRemove)
  if (currentTicker.value.name === tickerToRemove) {
    currentTicker.value = ''
  }
}
</script>

<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <section>
        <div class="flex">
          <div class="max-w-xs">
            <label for="wallet" class="block text-sm font-medium text-gray-700">Тикер</label>
            <div class="mt-1 relative rounded-md shadow-md">
              <input
                @input="onChange(ticker)"
                v-model="ticker"
                v-on:keydown.enter="addTicker"
                type="text"
                name="wallet"
                id="wallet"
                class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                placeholder="Например DOGE"
              />
            </div>
            <div
              v-if="coincidencesTickers.length"
              class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
            >
              <span
                v-for="currency in coincidencesTickers"
                :key="currency"
                @click="addTickerHind(currency)"
                class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
              >
                {{ currency }}
              </span>
            </div>
            <div v-if="toggle" class="text-sm text-red-600">Такой тикер уже добавлен</div>
          </div>
        </div>
        <button
          v-on:click="addTicker"
          type="button"
          class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <svg
            class="-ml-0.5 mr-2 h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path
              d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            ></path>
          </svg>
          Добавить
        </button>
      </section>
      <div>
        Фильтр <input v-model="filterTicker" />
        <button
          v-if="page > 1"
          @click="page = page - 1"
          type="button"
          class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Назад
        </button>
        <button
          v-if="hasNextPage"
          @click="page = page + 1"
          type="button"
          class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Вперед
        </button>
      </div>
      <template v-if="paginatedTickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <TickerCard
            v-for="t in paginatedTickers"
            :key="t.name"
            @click="currentTicker = t"
            :class="currentTicker === t ? 'border-2' : ''"
            @deleteTicker="deleteTickers"
            :ticker="t"
          />
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <section v-if="currentTicker" class="relative">
        <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
          {{ currentTicker.name }}- USD
        </h3>
        <div class="flex items-end border-gray-600 border-b border-l h-64">
          <div class="bg-purple-800 border w-10 h-24"></div>
          <div class="bg-purple-800 border w-10 h-32"></div>
          <div class="bg-purple-800 border w-10 h-48"></div>
          <div class="bg-purple-800 border w-10 h-16"></div>
        </div>
        <button @click="currentTicker = ''" type="button" class="absolute top-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            xmlns:svgjs="http://svgjs.com/svgjs"
            version="1.1"
            width="30"
            height="30"
            x="0"
            y="0"
            viewBox="0 0 511.76 511.76"
            style="enable-background: new 0 0 512 512"
            xml:space="preserve"
          >
            <g>
              <path
                d="M436.896,74.869c-99.84-99.819-262.208-99.819-362.048,0c-99.797,99.819-99.797,262.229,0,362.048    c49.92,49.899,115.477,74.837,181.035,74.837s131.093-24.939,181.013-74.837C536.715,337.099,536.715,174.688,436.896,74.869z     M361.461,331.317c8.341,8.341,8.341,21.824,0,30.165c-4.16,4.16-9.621,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    l-75.413-75.435l-75.392,75.413c-4.181,4.16-9.643,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    c-8.341-8.341-8.341-21.845,0-30.165l75.392-75.413l-75.413-75.413c-8.341-8.341-8.341-21.845,0-30.165    c8.32-8.341,21.824-8.341,30.165,0l75.413,75.413l75.413-75.413c8.341-8.341,21.824-8.341,30.165,0    c8.341,8.32,8.341,21.824,0,30.165l-75.413,75.413L361.461,331.317z"
                fill="#718096"
                data-original="#000000"
              ></path>
            </g>
          </svg>
        </button>
      </section>
    </div>
  </div>
</template>

<!-- <style src="./app.css"></style> -->

<template>
  <v-card id="sidebar-container">
    <v-card
      id="sidebar-objects-htmx"
      width="100%"
      :height="height"
      hx-trigger="update-sidebar from:body"
    >
    </v-card>
  </v-card>
</template>

<script>
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { parseHtmxError } from '~/utils/htmx_error'
import { savedSideList } from '~/utils/side_list_cache'

@Component
export default class sideListWrapper extends Vue {
  isLoading = true
  error = ''
  height = '0%'
  observer = ''
  QueryParams = null

  get isDark() {
    return this.$vuetify.theme.dark
  }

  mounted() {
    this.$store.dispatch('asyncComponents/setSideBarSettledAction', false)
    this._checkQueryParams()
    this.$el.addEventListener('htmx:responseError', (event) => {
      this.error = parseHtmxError(event)
      this.isLoading = false
      this.$store.dispatch('asyncComponents/setSideBarSettledAction', true)
    })
    this.$el.addEventListener('htmx:afterRequest', (event) => {
      if (event.detail.successful) {
        this.error = ''
        this.isLoading = false
        this.height = '100%'
        this.onIsDarkChange(this.isDark)
      }
    })

    this.$el.addEventListener('htmx:afterSwap', async (event) => {
      if (event.detail.successful) {
        await this.$nextTick()
        this._displayObjectsBar()
        this.$store.dispatch('asyncComponents/setSideBarSettledAction', true)
      }
    })

    const savedList = savedSideList(this.QueryParams)
    if (savedList) this._showSavedList(savedList)
    else this._loadHtmx()
  }

  beforeDestroy() {
    if (this.observer) this.observer.disconnect()
  }

  _checkQueryParams() {
    const params = this.$route.query
    this.QueryParams = this._checkSingleSearch(params)
  }

  _checkSingleSearch(params) {
    if (this._checkConditionsForSingleSearch(params)) {
      params.oid = this.$route.params.oid
    }
    return params
  }

  _checkConditionsForSingleSearch(params) {
    const paramsLenght = Object.keys(params).length
    if (!params.oid && paramsLenght <= 1) return true
    return false
  }

  _displayObjectsBar() {
    const numberOfObjects = document.getElementsByName(
      'sidebar-row-element'
    ).length
    this.$emit('show-side-bar', numberOfObjects)
  }

  _loadHtmx() {
    const myDiv = document.getElementById('sidebar-objects-htmx')
    let url = new URL('htmx/side_objects', this.$config.objectApiBaseUrl)
    url = this.$appendParamsInUrl(url, this.QueryParams)
    if (myDiv) {
      myDiv.setAttribute('hx-get', url)
      window.htmx.process(myDiv)
      document.body.dispatchEvent(new Event('update-sidebar'))
      this._loadObserver()
    }
  }

  // The results table handed over the list of the page this object was
  // opened from: no need to search again.
  _showSavedList(html) {
    this._loadObserver()
    window.htmx.swap('#sidebar-objects-htmx', html, { swapStyle: 'innerHTML' })
    this._markSelected(this.QueryParams.selected_oid)
    this.isLoading = false
    this.height = '100%'
    this.onIsDarkChange(this.isDark)
    this._displayObjectsBar()
    this.$store.dispatch('asyncComponents/setSideBarSettledAction', true)
  }

  _markSelected(oid) {
    const row = document.querySelector(
      `[name="sidebar-row-element"][data-oid="${CSS.escape(String(oid))}"]`
    )
    if (row) row.classList.replace('obj-unselected-item', 'obj-selected-item')
    const selectedCache = document.getElementById('selected_oid_cache')
    if (selectedCache) selectedCache.value = oid
  }

  _loadObserver() {
    const target = document.querySelector('#sidebar-container')
    if (target) {
      this.observer = new MutationObserver(() => {
        this.onIsDarkChange(this.isDark)
        this._loadEventManager()
      })
      this.observer.observe(target, { childList: true, subtree: true })
    }
  }

  _loadEventManager() {
    const rowsElements = document.getElementsByName('sidebar-row-element')
    rowsElements.forEach((element) => {
      window.htmx.on(element, 'click', (event) => {
        // Obtenemos el OID del elemento clickeado
        const selectedOid = element.textContent.trim()

        if (selectedOid === this.$route.params.oid) {
          return
        }

        if (selectedOid) {
          this.$store.dispatch(
            'asyncComponents/setLoadingOidAction',
            selectedOid
          )
          this.$store.dispatch('asyncComponents/setGlobalLoadingAction', true)

          this.QueryParams.selected_oid = selectedOid

          this.$router.push({
            path: `/object/${selectedOid}`,
            query: { ...this.QueryParams },
          })
        }
      })
    })
  }

  @Watch('isDark', { immediate: true })
  async onIsDarkChange(newIsDark) {
    await this.$nextTick()
    const container = document.getElementById('sidebar-objects-htmx')
    if (container) {
      if (newIsDark) container.classList.add('tw-dark')
      else container.classList.remove('tw-dark')
    }
  }
}
</script>

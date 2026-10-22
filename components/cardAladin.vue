<template>
  <v-col :cols="cols" :lg="lg" :md="md" :sm="sm">
    <v-card v-if="isLoading || error">
      <v-card-text v-if="isLoading">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
        Fetching aladin ...
      </v-card-text>
      <v-card-text v-if="error">
        <v-alert text prominent type="error" icon="mdi-cloud-alert">{{
          error
        }}</v-alert>
      </v-card-text>
    </v-card>
    <v-card
      id="aladin-vue-app"
      width="100%"
      :height="height"
      style="z-index: 50"
      hx-trigger="update-aladin from:body"
    ></v-card>
  </v-col>
</template>

<script>
import { Vue, Component, Prop, Watch } from 'nuxt-property-decorator'
import { parseHtmxError } from '~/utils/htmx_error'

@Component
export default class CardAladin extends Vue {
  @Prop({ type: Number | String, default: 12 })
  cols

  @Prop({ type: Number | String, default: 12 })
  lg

  @Prop({ type: Number | String, default: 12 })
  md

  @Prop({ type: Number | String, default: 12 })
  sm

  @Prop({ type: String }) cardClass

  object = {}
  objectsList = ''
  isLoading = true
  error = null

  get height() {
    return this.$vuetify.breakpoint.name === 'md' ? 535 : 400
  }

  get isDark() {
    return this.$vuetify.theme.isDark
  }

  mounted() {
    const oid = this.$route.params.oid
    const params = { ...this.$route.query }
    const aladinCard = document.getElementById('aladin-vue-app')

    aladinCard.addEventListener('htmx:responseError', (event) => {
      this.error = parseHtmxError(event)
      this.isLoading = false
    })

    aladinCard.addEventListener('htmx:afterRequest', (event) => {
      if (event.detail.successful) {
        this.error = ''
        this.isLoading = false
        this.width = '100%'
        this.onIsDarkChange(this.isDark)
      }

      if (event.detail.error) {
        this.error = parseHtmxError(event)
        this.isLoading = false
      }
    })

    aladinCard.addEventListener('htmx:configRequest', (event) => {
      event.detail.parameters.objects_arr = this.objectsList
    })

    this._loadObjectStore().then(() => this._loadHtmx(oid, params.survey))
  }

  // Aladin draws the objects of the side list, so it waits for that list
  // to arrive (or fail).
  _loadObjectStore() {
    return new Promise((resolve) => {
      const read = () => {
        const objectsStore = document.getElementById('objects-store')

        if (objectsStore) {
          this.objectsList = objectsStore.dataset.objects
        }

        resolve()
      }

      if (this.$store.state.asyncComponents.sideBarSettled) return read()
      const unwatch = this.$store.watch(
        (state) => state.asyncComponents.sideBarSettled,
        (settled) => {
          if (settled) {
            unwatch()
            read()
          }
        }
      )
    })
  }

  _loadHtmx(objectId, survey) {
    const url = new URL(
      `htmx/aladin?oid=${objectId}&survey=${survey}`,
      this.$config.aladinApiBaseUrl
    )
    const myDiv = document.getElementById('aladin-vue-app')

    if (myDiv) {
      myDiv.setAttribute('hx-post', url)
      window.htmx.process(myDiv)
      document.body.dispatchEvent(new Event('update-aladin'))
    }
  }

  @Watch('isDark', { immediate: true })
  async onIsDarkChange(newIsDark) {
    await this.$nextTick()

    const container = document.getElementById('aladin-app')
    if (container) {
      if (newIsDark) {
        container.classList.add('tw-dark')
      } else {
        container.classList.remove('tw-dark')
      }
    }
  }
}
</script>

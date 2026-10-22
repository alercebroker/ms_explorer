<template>
  <!-- eager: the card loads when the page loads, so the button only shows once the status API answers -->
  <v-menu
    v-model="open"
    eager
    offset-y
    left
    bottom
    max-width="620"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <!-- Text only: one dot per survey wouldn't scale as surveys are added. -->
      <v-btn v-show="ready" text small class="mr-2" v-bind="attrs" v-on="on">
        Pipeline status
      </v-btn>
    </template>

    <!-- The card itself is HTML from the status API (htmx/pipeline_status), like the other cards. It refreshes
         itself every minute and with its own buttons, and keeps the last card if a refresh fails. -->
    <v-card
      id="pipeline-status-card"
      width="620"
      hx-trigger="update-pipeline-status from:body"
    >
    </v-card>
  </v-menu>
</template>

<script>
import { Vue, Component, Watch } from 'nuxt-property-decorator'

@Component
export default class PipelineStatus extends Vue {
  open = false
  // Hidden until the first card arrives: without the status API (not deployed or not configured) nothing shows
  ready = false

  get isDark() {
    return this.$vuetify.theme.isDark
  }

  async mounted() {
    document.addEventListener('htmx:afterRequest', this.onAfterRequest)
    await this.$nextTick() // with eager, the menu content (the card container) renders after this component
    this._loadHtmx()
  }

  beforeDestroy() {
    document.removeEventListener('htmx:afterRequest', this.onAfterRequest)
  }

  onAfterRequest(event) {
    const card = document.getElementById('pipeline-status-card')
    if (card && card.contains(event.detail.elt) && event.detail.successful) {
      this.ready = true
      this.onIsDarkChange(this.isDark)
    }
  }

  _loadHtmx() {
    const url = new URL('htmx/pipeline_status', this.$config.statusApiBaseUrl)
    // Only used by the API with simulated data (demos): ?pipeline_status_scenario=processing
    const scenario = this.$route.query.pipeline_status_scenario
    if (scenario) url.searchParams.set('scenario', scenario)
    const card = document.getElementById('pipeline-status-card')
    if (card) {
      card.setAttribute('hx-get', url)
      window.htmx.process(card)
      document.body.dispatchEvent(new Event('update-pipeline-status'))
    }
  }

  @Watch('isDark', { immediate: true })
  async onIsDarkChange(newIsDark) {
    await this.$nextTick()
    const card = document.getElementById('pipeline-status-card')
    if (card) {
      card.classList.toggle('tw-dark', newIsDark)
    }
  }
}
</script>

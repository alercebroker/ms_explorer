<template>
  <v-menu
    v-if="status"
    v-model="open"
    offset-y
    left
    bottom
    max-width="620"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <!-- Text only: one dot per survey wouldn't scale as surveys are added. -->
      <v-btn text small class="mr-2" v-bind="attrs" v-on="on">
        Pipeline status
      </v-btn>
    </template>

    <v-card class="pa-4" width="620">
      <div class="d-flex align-center mb-2">
        <span class="text-subtitle-1">Pipeline status</span>
        <v-spacer />
        <v-btn
          icon
          small
          :loading="loading"
          title="Refresh"
          aria-label="Refresh pipeline status"
          @click="refresh"
        >
          <v-icon small>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <div v-for="p in status.pipelines" :key="p.survey" class="d-flex mb-2">
        <span
          class="status-dot mr-3 mt-2"
          :style="{ background: color(p.status) }"
        />
        <div>
          <div class="text-body-2">
            <strong>{{ p.name }}</strong> · {{ p.status_label }}
          </div>
          <div class="text-caption text--secondary">
            {{ p.message }}
            <template v-if="p.last_alert_received_at">
              Last alert received at {{ formatTime(p.last_alert_received_at) }}.
            </template>
          </div>
        </div>
      </div>

      <div class="d-flex align-center flex-wrap mt-3">
        <span class="text-caption mr-2">Alerts received in the last</span>
        <v-btn-toggle v-model="selectedWindow" mandatory dense>
          <v-btn
            v-for="w in windows"
            :key="w"
            :value="w"
            x-small
            class="text-none"
            :disabled="!windowAvailable(w)"
          >
            {{ w }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-row class="mt-2 text-center" no-gutters>
        <v-col v-for="p in status.pipelines" :key="p.survey">
          <div class="text-caption">{{ p.name }}</div>
          <div class="text-h6">
            {{ formatCount(p.activity[selectedWindow].alerts_received) }}
          </div>
          <div class="text-caption text--secondary">
            {{ formatCount(p.activity[selectedWindow].alerts_processed) }}
            processed
          </div>
        </v-col>
      </v-row>

      <div class="text-caption text--secondary mt-4">
        Alerts take a few minutes to become searchable after they are processed.
        Windows longer than the metrics history are disabled. Updated
        {{ updatedAt }}.
        <span v-if="error" class="error--text">
          Could not refresh, showing the last data.
        </span>
      </div>
    </v-card>
  </v-menu>
</template>

<script>
import { Vue, Component } from 'nuxt-property-decorator'

// Labels and messages come from the status API: only the colours are here.
const COLORS = {
  up_to_date: '#00e676',
  processing: '#ffc107',
  no_data: '#9e9e9e',
  unknown: '#616161',
}

// The time spans offered, all asked for in one request.
const WINDOWS = ['15m', '30m', '1h', '3h', '6h', '12h', '24h', '3d', '7d']

// The API caches its answer for 60 s, so polling faster gives the same data.
const POLL_MS = 60000

@Component
export default class PipelineStatus extends Vue {
  status = null
  open = false
  loading = false
  error = false
  windows = WINDOWS
  selectedWindow = '12h'
  timer = null

  mounted() {
    this.refresh()
    this.timer = setInterval(this.refresh, POLL_MS)
  }

  beforeDestroy() {
    clearInterval(this.timer)
  }

  async refresh() {
    if (this.loading) return
    this.loading = true
    try {
      const url = new URL('pipeline_status', this.$config.statusApiBaseUrl)
      url.searchParams.set('since', WINDOWS.join(','))
      // Only used by the API with simulated data (demos): ?pipeline_status_scenario=processing
      const scenario = this.$route.query.pipeline_status_scenario
      if (scenario) url.searchParams.set('scenario', scenario)
      this.status = await this.$axios.$get(url.toString())
      this.error = false
      if (!this.windowAvailable(this.selectedWindow)) {
        this.selectedWindow = WINDOWS.find(this.windowAvailable)
      }
    } catch (e) {
      // Keep showing the last good answer. With none (API not deployed or not configured), the badge stays hidden.
      this.error = true
    } finally {
      this.loading = false
    }
  }

  color(status) {
    return COLORS[status] || COLORS.unknown
  }

  get updatedAt() {
    return this.formatTime(this.status.updated_at)
  }

  formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-GB')
  }

  windowAvailable(w) {
    return this.status.pipelines.some(
      (p) => p.activity[w] && p.activity[w].alerts_received !== null
    )
  }

  formatCount(n) {
    return n === null || n === undefined ? '–' : n.toLocaleString('en-US')
  }
}
</script>

<style scoped>
.status-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

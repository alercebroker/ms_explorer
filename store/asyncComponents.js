import {
  Module,
  VuexModule,
  VuexAction,
  VuexMutation,
} from 'nuxt-property-decorator'

@Module({ name: 'asyncComponents', namespaced: true, stateFactory: true })
export default class ComponentsStore extends VuexModule {
  // The side list arrived or failed: Aladin waits for it, to draw the
  // listed objects.
  sideBarSettled = false
  globalLoading = false
  loadingOid = ''

  @VuexMutation
  setSideBarSettled(val) {
    this.sideBarSettled = val
  }

  @VuexMutation
  setGlobalLoading(val) {
    this.globalLoading = val
  }

  @VuexMutation
  setLoadingOid(val) {
    this.loadingOid = val
  }

  @VuexAction({ rawError: true })
  setSideBarSettledAction(val) {
    this.setSideBarSettled(val)
  }

  @VuexAction({ rawError: true })
  setGlobalLoadingAction(val) {
    this.setGlobalLoading(val)
  }

  @VuexAction({ rawError: true })
  setLoadingOidAction(val) {
    this.setLoadingOid(val)
  }
}

import { Flow, Logger } from 'botpress/sdk'
import { ArrayCache } from 'common/array-cache'
import { ObjectCache } from 'common/object-cache'
import { TreeSearch, PATH_SEPARATOR } from 'common/treeSearch'
import { FlowMutex, FlowView, NodeView } from 'common/typings'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService, ScopedGhostService } from 'core/bpfs'
import { JobService } from 'core/distributed/job-service'
import { KeyValueStore, KvsService } from 'core/kvs'
import { ModuleLoader } from 'core/modules'
import { RealtimeService, RealTimePayload } from 'core/realtime'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import LRUCache from 'lru-cache'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid/generate'

import { validateFlowSchema } from '../utils/validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

const MUTEX_LOCK_DELAY_SECONDS = 30

export const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string()
    .optional()
    .allow('')
})

interface FlowModification {
  name: string
  botId: string
  userEmail: string
  modification: 'rename' | 'delete' | 'create' | 'update'
  newName?: string
  payload?: any
}

interface Topic {
  name: string
  description: string
}

export class MutexError extends Error {
  type = MutexError.name
}

@injectable()
export class FlowService {
  private scopes: { [botId: string]: ScopedFlowService } = {}
  private invalidateFlow: (botId: string, key: string, flow?: FlowView, newKey?: string) => void = this
    ._localInvalidateFlow

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.RealtimeService) private realtime: RealtimeService,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this._listenForCacheInvalidation()
  }

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateFlow = <any>await this.jobService.broadcast<void>(this._localInvalidateFlow.bind(this))
  }

  private _localInvalidateFlow(botId: string, key: string, flow?: FlowView, newKey?: string) {
    this.forBot(botId).localInvalidateFlow(key, flow, newKey)
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', async key => {
      try {
        const matches = key.match(/^([A-Z0-9-_]+)::data\/bots\/([A-Z0-9-_]+)\/flows\/([\s\S]+(flow|ui)\.json)/i)

        if (matches && matches.length >= 2) {
          const [key, type, botId, flowName] = matches
          if (type === 'file' || type === 'object') {
            await this.forBot(botId).handleInvalidatedCache(flowName, type === 'file')
          }
        }
      } catch (err) {
        this.logger.error('Error Invalidating flow cache: ' + err.message)
      }
    })
  }

  public forBot(botId: string): ScopedFlowService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedFlowService(
        botId,
        this.ghost.forBot(botId),
        this.kvs.forBot(botId),
        this.logger,
        this.moduleLoader,
        this.realtime,
        this.botService,
        (key, flow, newKey) => this.invalidateFlow(botId, key, flow, newKey)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedFlowService {
  private cache: ArrayCache<string, FlowView>
  private expectedSavesCache: LRUCache<string, number>

  constructor(
    private botId: string,
    private ghost: ScopedGhostService,
    private kvs: KvsService,
    private logger: Logger,
    private moduleLoader: ModuleLoader,
    private realtime: RealtimeService,
    private botService: BotService,
    private invalidateFlow: (key: string, flow?: FlowView, newKey?: string) => void
  ) {
    this.cache = new ArrayCache<string, FlowView>(
      x => x.name,
      (x, prevKey, newKey) => ({ ...x, name: newKey, location: newKey })
    )
    this.expectedSavesCache = new LRUCache({ max: 100, maxAge: ms('20s') })
  }

  public localInvalidateFlow(key: string, flow?: FlowView, newKey?: string) {
    if (!this.cache.values().length) {
      return
    }

    if (flow) {
      this.cache.update(key, flow)
    } else if (newKey) {
      this.cache.rename(key, newKey)
    } else if (this.cache.get(key)) {
      this.cache.remove(key)
    }

    // parent flows are only used by the NDU
    if (this._isOneFlow()) {
      const flows = this.cache.values()
      const flowsWithParents = this.addParentsToFlows(flows)

      this.cache.initialize(flowsWithParents)
    }
  }

  public async handleInvalidatedCache(flowName: string, isFromFile: boolean) {
    const flowPath = this.toFlowPath(flowName)
    const expectedSaves = this.expectedSavesCache.get(flowPath)

    if (!expectedSaves) {
      if (await this.ghost.fileExists(FLOW_DIR, flowPath)) {
        const flow = await this.parseFlow(flowPath)
        this.invalidateFlow(flowPath, flow)
      } else {
        this.invalidateFlow(flowPath, undefined)
      }
    } else {
      if (!isFromFile) {
        this.expectedSavesCache.set(flowPath, expectedSaves - 1)
      }
    }
  }

  async loadAll(): Promise<FlowView[]> {
    if (this.cache.values().length) {
      return this.cache.values()
    }

    const flowsPath = this.ghost.directoryListing(FLOW_DIR, '*.flow.json', undefined, undefined, {
      sortOrder: { column: 'filePath' }
    })

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(flowPath)
      })

      // parent flows are only used by the NDU
      if (this._isOneFlow()) {
        const flowsWithParents = this.addParentsToFlows(flows)
        this.cache.initialize(flowsWithParents)

        return flowsWithParents
      } else {
        this.cache.initialize(flows)

        return flows
      }
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error('Could not load flows')
      return []
    }
  }

  @Memoize()
  private async _isOneFlow(): Promise<boolean> {
    const botConfig = await this.botService.findBotById(this.botId)
    return !!botConfig?.oneflow
  }

  private addParentsToFlows(flows: FlowView[]): FlowView[] {
    const tree = new TreeSearch(PATH_SEPARATOR)

    flows.forEach(f => {
      const filename = f.name.replace('.flow.json', '')
      // the value we are looking for is the parent filename
      tree.insert(filename, filename)
    })

    return flows.map(f => {
      const filename = f.name.replace('.flow.json', '')

      return {
        ...f,
        parent: tree.getParent(filename)
      }
    })
  }

  private async parseFlow(flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow, await this._isOneFlow())

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ${schemaError} `)
    }

    const uiEq = await this.ghost.readFileAsObject<FlowView>(FLOW_DIR, this.toUiPath(flowPath))
    let unplacedIndex = -1

    const nodeViews: NodeView[] = flow.nodes.map(node => {
      const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
      unplacedIndex = position ? unplacedIndex : unplacedIndex + 1
      return {
        ...node,
        x: position ? position.x : MIN_POS_X + unplacedIndex * PLACING_STEP,
        y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
      }
    })

    const key = this._buildFlowMutexKey(flowPath)
    const currentMutex = (await this.kvs.get(key)) as FlowMutex
    if (currentMutex) {
      currentMutex.remainingSeconds = this._getRemainingSeconds(currentMutex.lastModifiedAt)
    }

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      currentMutex,
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description'])
    }
  }

  private _getRemainingSeconds(lastModifiedAt: Date): number {
    const now = moment()
    const freeTime = moment(lastModifiedAt).add(MUTEX_LOCK_DELAY_SECONDS, 'seconds')
    return Math.ceil(Math.max(0, freeTime.diff(now, 'seconds')))
  }

  private _buildFlowMutexKey(flowLocation: string): string {
    return `FLOWMUTEX: ${flowLocation}`
  }

  private toUiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }

  private toFlowPath(uiPath: string) {
    return uiPath.replace(/\.ui\.json$/i, '.flow.json')
  }
}

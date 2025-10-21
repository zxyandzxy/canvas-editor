import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  IKeydown,
  IRangeStyle,
  IWebsocketProviderStatus,
  IYdocEventObserve,
  IYdocInfo
} from '../../interface/Websocket'
import { Command } from '../command/Command'
import { IEditorData } from '../../interface/Editor'
import { Listener } from '../listener/Listener'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'

/**
 * @description 本应用 Yjs 协同编辑实现原理 官网： https://docs.yjs.dev/
 *  1. 劫持本地操作 （在需要的地方，调用 Ydoc 类的方法）
 *  2. 进行本地映射 （类方法中，需要进行 set 操作 ==> this.yMap.set(...)）
 *  3. 广播的过程是自动的，因为连接了 websocket 服务
 *  4. this.ymap.observe 会监听远端的操作，将远端操作进行本地复制执行
 *  5. 本地复制执行的核心 ==> 就是重新调用相应 API 进行操作复制 (this.command.setUserRange...)
 *  6. 不直接使用data全量传输，因为数据的重新赋值，可能会导致一些不可预测的问题，例如选区被取消、丢失光标等
 */
export class Ydoc {
  private ydoc: Y.Doc
  private ymap: Y.Map<unknown>
  public provider: any | undefined // websocket 需要暴露链接对象，身上有 disconnect 方法，不然会一直报错
  public connect: boolean | undefined
  private url: string
  private roomname: string
  private command: Command
  private userid: string
  private color: string | undefined
  private username: string
  private listener: Listener
  private eventBus: EventBus<EventBusMap>

  constructor(
    payload: IYdocInfo,
    command: Command,
    listener: Listener,
    eventBus: EventBus<EventBusMap>
  ) {
    const { userid, roomname, username, url, color } = payload
    this.roomname = roomname
    this.username = username
    this.userid = userid
    this.color = color
    this.url = url + '?canvas-editor' // 标记识别 websocket 客户端类型
    this.connect = false
    this.command = command
    this.listener = listener
    this.eventBus = eventBus

    // 创建 YDoc 文档
    this.ydoc = new Y.Doc()

    this.ymap = this.ydoc.getMap('map')

    // websocket 方式实现协同
    this.provider = new WebsocketProvider(this.url, this.roomname, this.ydoc)

    // 监听链接状态F·
    this.provider.on('status', (event: IWebsocketProviderStatus) => {
      if (event.status === 'connected') this.connect = true
      else this.connect = false
    })

    this.ymap.observe((event, transaction) =>
      this.YMapObserve(event, transaction)
    )
  }

  // YMap Observe
  public YMapObserve(
    { changes }: Y.YMapEvent<unknown>,
    Transaction: Y.Transaction
  ) {
    if (Transaction.local) return // 本地触发的 observer 不需要观察

    changes.keys.forEach((_change, key) => {
      const event = key.split('_')[0]
      const params = <IYdocEventObserve>this.ymap.get(key)
      const value = this.ymap.get(key)

      // 使用策略模式
      const eventMap: { [key: string]: Function } = {
        //  用户初始化 Ydoc 连接
        connect: () => {
          this.listener.connected && this.listener.connected()
          this.eventBus.isSubscribe('connected') &&
            this.eventBus.emit('connected')
        },

        // 用户设置选区
        userRange: () =>
          this.command.setUserRange({
            startIndex: <number>params.startIndex,
            endIndex: <number>params.endIndex,
            id: <string>params.id,
            color: <string>params.color
          }),

        // 用户退出销毁编辑器
        destroy: () => this.command.setUserUnRange(0, 0, <string>value),

        // 用户内容区变化
        contentChange: () =>
          this.command.executeContentChange(<IEditorData>value),

        // 用户输入
        keydown: () => this.command.executeKeydown(<IKeydown>value),

        // 选区样式
        rangeStyle: () => this.command.executeRangeStyle(<IRangeStyle>value)
      }

      event && eventMap[event] && eventMap[event]()
    })
  }

  // 关闭连接方法
  public disConnection() {
    if (!this.connect) return
    this.provider.disconnect()
  }

  // 用户初始化 ydoc 连接
  public connectYdoc() {
    console.group('## WebSocket is connect.')
    console.log('username:', this.username)
    console.log('userid:', this.userid)
    console.log('color:', this.color)
    console.groupEnd()

    this.ymap.set(`connect_${this.userid}`, {
      username: this.username,
      userid: this.userid,
      color: this.color
    })
  }

  // 用户选区操作
  public setUserRange(payload: IYdocEventObserve) {
    this.ymap.set(`userRange_${this.userid}`, {
      startIndex: payload.startIndex,
      endIndex: payload.endIndex,
      isCrossRowCol: payload.isCrossRowCol,
      userid: this.userid,
      color: this.color
    })
  }

  // 调用 destroy 销毁后，需要通知其他用户取消选区
  public canvasDestroy() {
    this.ymap.set('destroy', this.userid)
  }

  // 实现用户输入收集 Draw input 事件实现
  public collectUserInput(data: IEditorData) {
    this.ymap.set('contentChange', data)
  }

  // 用户按键映射
  public keydownHandle(payload: IKeydown) {
    this.ymap.set('keydown', payload)
  }

  // 广播用户样式修改
  public rangeStyleChange(payload: IRangeStyle) {
    this.ymap.set('rangeStyle', payload)
  }
}

fork别的大佬的项目，如需使用请关注原作者：https://gitee.com/wfeng0/canvas-editor

# 基于 Canvas-editor 实现类 Word 协同编辑

## 项目介绍
本项目基于 Canvas-editor 实现类 Word 协同编辑，支持多人在线协同编辑，计划修改 Canvas-editor 源码，对原应用的所有功能赋予协同能力。例如撤销、重做，历史回退、前进，标题设置、字体字号、颜色高亮等。备注 ：一定是存在BUG的，提出来一起解决哈，个人精力也有限，如果大家感兴趣，欢迎 Fork ，一起完善。

## 相关链接

[canvas-editor 文档](https://hufe.club/canvas-editor-docs/)

[Canvas-Editor Demo示例](https://hufe.club/canvas-editor/)

[Cavnas-Editor GitHub](https://github.com/Hufe921/canvas-editor)

[Canvas-Editor 实现类似 Word 协同编辑](https://blog.csdn.net/weixin_47746452/article/details/135644748?spm=1001.2014.3001.5502)

[B站演示视频](https://www.bilibili.com/video/BV1Sj41117v4/?spm_id_from=autoNext&vd_source=604a25c77e296b4ce29b1e6e6cf03ea6)


## 项目下载及打包

```bash
git clone https://gitee.com/wfeng0/canvas-editor
yarn install or npm install
yarn dev or npm run dev
yarn build or npm run build ## 打包成 dist 文件夹
yarn lib  ## 打包命令 ==> 输出的是 lib 第三方库文件，推荐使用该方式
```

## 基本使用

```typescript
import { Editor } from '打包后的lib地址'

type typeEditor={
    container: HTMLDivElement
    data: IEditorData | IElement[]
    options: IEditorOption
    socketinfo?: IYdocInfo
}

// 原来是使用的 形参，现在使用对象形式，方便后续扩展
new Editor({
    container: document.getElementById('editor') as HTMLDivElement,
    data: data,
    options: {},
    socketinfo: {}
})


```
## 支持协同操作
1. 用户登录、登出
2. 协同编辑
3. 字体颜色、高亮
4. 设置字号、增加、减少字号
5. 加粗、斜体、下划线、删除线
6. 标题

## 待实现的功能
1. 撤销、重做
2. 设置字体
3. 插入图片
4. 插入表格
5. 插入链接
6. 插入代码块
7. 插入列表
8. 插入引用
9. 插入公式
11. 文字对齐方式
12. 行间距
13. 插入分割线
14. 水印
15. 分页符
16. 控件
17. LaTeX
18. 日期时间
19. 内容快
20. 目录
21. 批注、签名

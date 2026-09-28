# 神话女性 · 她象 · 万物生辉

这是她象第 2 版的 GitHub Pages 独立源码包，保留原有页面与动态交互。无需 API Key、数据库或原托管平台账户。

## 上传与发布（GitHub Actions）

1. 在自己的 GitHub 建立 Public 仓库，建议名称 `her-cosmos-atlas`，默认分支用 `main`。
2. 解压本压缩包，把**里面全部内容**放到仓库根目录。根目录应直接有 `package.json`、`package-lock.json`、`app/`、`components/` 和 `.github/workflows/pages.yml`。不要上传 ZIP 文件本身，也不要多套一层文件夹。
3. 特别确认 `.github/workflows/pages.yml` 已上传。文件管理器可能隐藏 `.github`：推荐用 GitHub Desktop 提交全部文件；网页上传漏掉它时，用 Add file → Create new file，文件名输入 `.github/workflows/pages.yml`，粘贴包内同名文件的完整内容。
4. 打开仓库 Settings → Pages → Build and deployment，Source 选 **GitHub Actions**。本项目不要选 Deploy from a branch。
5. 打开 Actions → Deploy Her Cosmos to GitHub Pages → Run workflow，选择 `main` 后运行。若首次推送触发的任务因尚未开启 Pages 失败，完成第 4 步后重新运行即可。
6. 等待 build、deploy 都成功。正式网址在 Settings → Pages 和成功的部署任务中。

工作流会根据实际仓库名自动设置路径；不必修改源码中的 URL。生成的首页 `index.html` 在构建产物 `out/` 根目录，由工作流自动发布，源码根目录没有 `index.html` 是正常的。

普通项目地址形如 `https://你的用户名.github.io/her-cosmos-atlas/`；请以 GitHub 显示的实际地址为准。不要混入另外两个项目的文件。

## 内容与交互

- 空间探索、主题图鉴、关系图谱、对照阅读、典籍索引五个入口。
- 女娲、西王母、嫦娥、精卫、洛神、湘水女神及易象与哲思，共 12 个独立专题。
- Three.js 意象模型、旋转与缩放、主题动作、分类搜索、原典与当代阅读、专题对读。
- 保留低动态偏好与 WebGL 不可用时的交互后备模式。

## 继续修改

| 文件 | 内容 |
|---|---|
| `lib/atlas-data.ts` | 专题、文字、出处和关联 |
| `components/atlas.tsx` | 页面与界面交互 |
| `components/model-stage.tsx` | 三维几何和动画 |
| `components/canvas-fallback.tsx` | 轻量绘制模式 |
| `app/globals.css` | 色彩、排版、布局 |
| `.github/workflows/pages.yml` | 自动发布流程 |

安装 Node.js 22.13 或更新的 22.x 后，在项目目录运行：

```bash
npm ci
npm run dev
```

构建：`npm run build`，输出 `out/`。若要手动构建用于名为 `her-cosmos-atlas` 的项目仓库，构建时需要环境变量 `NEXT_PUBLIC_BASE_PATH=/her-cosmos-atlas`；自动工作流已经处理。静态导出不使用 `next start`。

## 素材与许可

用户参考照片未包含在交付内。原创代码许可见 LICENSE，插画、模型与第三方许可说明见 ASSETS.md。模型是现代视觉意象，不是数学定理、科学仿真或文物复原。

## 官方说明

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://nextjs.org/docs/app/guides/static-exports

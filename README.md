# 红莲魔尊 · 同人商店页面

《蛊真人》同人企划：把「红莲魔尊」做成一个 Steam 商店风格的静态网页。
纯 HTML + CSS + 手写 SVG，零依赖、零构建、不联网，直接把仓库丢到 GitHub Pages 就能访问。

> 同人作品声明：本项目为《蛊真人》世界观下的同人演绎，非官方作品，不含官方素材。
> 页面中的价格、评测、成就、系统需求等均为虚构内容，仅为还原商店页版式。

## 本地预览

最简单的方式：直接双击 `index.html`，用浏览器打开即可。

想用本地服务器（推荐，路径行为与线上一致）：

```bash
cd 项目目录
python3 -m http.server 8000     # 有 Python 的话
# 或
ruby -run -e httpd . -p 8000    # 有 Ruby 的话
```

然后访问 <http://localhost:8000/>。

## 部署到 GitHub Pages

### 方式一：一键脚本（本仓库自带）

仓库里带了一个纯 Ruby 标准库写的部署脚本，不需要 git，也不需要 gh CLI：

```bash
# 1. 创建 token：https://github.com/settings/tokens/new
#    勾选 repo 权限，生成后复制
# 2. 把 token 写进文件（不会出现在命令历史里）
pbpaste > ~/.llchw_token && chmod 600 ~/.llchw_token

# 3. 部署
ruby tools/deploy_github_pages.rb --repo honglian-mozun
```

脚本会创建仓库、上传全部文件、开启 Pages，并在构建完成后打印访问地址：

```
https://<你的用户名>.github.io/honglian-mozun/
```

常用参数：

```bash
ruby tools/deploy_github_pages.rb --dry-run          # 只看会上传哪些文件
ruby tools/deploy_github_pages.rb --repo 其他仓库名
GITHUB_TOKEN=xxx ruby tools/deploy_github_pages.rb    # 用环境变量传 token
```

### 方式二：手动 git 流程

```bash
git init -b main
git add .
git commit -m "红莲魔尊 同人商店页面"
git remote add origin git@github.com:<用户名>/<仓库名>.git
git push -u origin main
```

然后在仓库的 **Settings → Pages** 里把 Source 设为 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，保存即可。

## 目录结构

```
.
├── index.html                  页面结构（含内联图标 sprite）
├── .nojekyll                   关闭 Jekyll 处理
├── assets/
│   ├── style.css               Steam 风格样式
│   ├── app.js                  交互脚本（轮播 / 评测筛选 / 弹层）
│   ├── hero-banner.svg         首页宽幅头图
│   ├── capsule-main.svg        商店封面图（616×353）
│   ├── shot-01…06-*.svg        六张“游戏截图”（1280×720）
│   ├── avatar-1…4.svg          评测头像
│   ├── mark.svg / favicon.svg  站点图标
└── tools/
    └── deploy_github_pages.rb  一键部署脚本（仅本地使用，不上传到 Pages）
```

## 页面包含什么

- Steam 全局导航 + 面包屑 + 胶囊封面 + 绿色购买按钮的经典商店页版式
- 六张可切换的截图轮播，支持缩略图、左右翻页、全屏查看
- 「关于这款游戏」六个图文特性块：本命红莲蛊、蛊虫与蛊阵、五域天地、回合制对决、修为面板、天劫
- 系统需求、语言支持、成就墙（含全球达成率）
- 客户评测区：好评率直方图 + 好评 / 差评筛选 + 「有帮助」计数
- 加入购物车弹层、愿望单切换、提示条等交互，全部为前端演示，不产生任何真实交易

## 自定义

- 文案：直接改 `index.html`；配色与排版变量集中在 `assets/style.css` 顶部的 `:root`
- 截图：替换 `assets/shot-*.svg`（保持 16:9 即可），或在 `index.html` 里改路径
- 想换成别的角色：改标题、`hero-banner.svg`、`capsule-main.svg` 与各段文案即可

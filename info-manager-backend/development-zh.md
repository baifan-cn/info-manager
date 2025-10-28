# FastAPI 项目 - 开发指南

## Docker Compose

* 使用 Docker Compose 启动本地服务栈：

```bash
docker compose watch
```

* 现在您可以在浏览器中打开并访问以下URL：

前端，使用Docker构建，路由基于路径处理：http://localhost:5173

后端，基于OpenAPI的JSON格式Web API：http://localhost:8000

使用Swagger UI的自动交互式文档（基于OpenAPI后端）：http://localhost:8000/docs

Adminer，数据库Web管理界面：http://localhost:8080

Traefik UI，用于查看代理如何处理路由：http://localhost:8090

**注意**：首次启动服务栈时，可能需要一分钟时间准备就绪。因为后端需要等待数据库就绪并配置所有内容。您可以通过查看日志来监控状态。

要查看日志，请在另一个终端中运行：

```bash
docker compose logs
```

要查看特定服务的日志，请添加服务名称，例如：

```bash
docker compose logs backend
```

## 本地开发

Docker Compose文件已配置为每个服务在`localhost`的不同端口上可用。

对于后端和前端，它们使用与其本地开发服务器相同的端口，因此后端位于`http://localhost:8000`，前端位于`http://localhost:5173`。

这样，您可以关闭Docker Compose中的某个服务并启动其本地开发服务，一切仍然会正常工作，因为它们都使用相同的端口。

例如，您可以在Docker Compose中停止`frontend`服务，在另一个终端中运行：

```bash
docker compose stop frontend
```

然后启动本地前端开发服务器：

```bash
cd frontend
npm run dev
```

或者您可以停止`backend`的Docker Compose服务：

```bash
docker compose stop backend
```

然后您可以运行后端的本地开发服务器：

```bash
cd backend
fastapi dev app/main.py
```

## 在`localhost.tiangolo.com`中使用Docker Compose

当您启动Docker Compose服务栈时，默认使用`localhost`，每个服务（后端、前端、adminer等）使用不同的端口。

当您部署到生产环境（或预发布环境）时，它将在不同的子域中部署每个服务，如后端使用`api.example.com`，前端使用`dashboard.example.com`。

在关于[部署](deployment.md)的指南中，您可以了解Traefik（配置的代理）的信息。这是负责根据子域将流量传输到各个服务的组件。

如果您想在本地测试所有功能是否正常，可以编辑本地的`.env`文件，更改：

```dotenv
DOMAIN=localhost.tiangolo.com
```

Docker Compose文件将使用此配置来设置服务的基础域名。

Traefik将使用此配置将`api.localhost.tiangolo.com`的流量传输到后端，将`dashboard.localhost.tiangolo.com`的流量传输到前端。

`localhost.tiangolo.com`域名是一个特殊域名，已配置（及其所有子域名）指向`127.0.0.1`。这样您就可以在本地开发中使用它。

更新后，再次运行：

```bash
docker compose watch
```

部署时，例如在生产环境中，主要的Traefik在Docker Compose文件之外配置。对于本地开发，`docker-compose.override.yml`中包含了一个Traefik，仅为了让您测试域名是否按预期工作，例如使用`api.localhost.tiangolo.com`和`dashboard.localhost.tiangolo.com`。

## Docker Compose文件和环境变量

有一个主要的`docker-compose.yml`文件，包含适用于整个服务栈的所有配置，它会被`docker compose`自动使用。

还有一个`docker-compose.override.yml`文件，包含开发环境的覆盖配置，例如将源代码挂载为卷。它会被`docker compose`自动使用，在`docker-compose.yml`的基础上应用覆盖。

这些Docker Compose文件使用`.env`文件，该文件包含要作为环境变量注入到容器中的配置。

它们还使用一些额外的配置，这些配置取自在调用`docker compose`命令前在脚本中设置的环境变量。

更改变量后，请确保重启服务栈：

```bash
docker compose watch
```

## .env 文件

`.env`文件包含您所有的配置、生成的密钥和密码等。

根据您的工作流程，您可能希望将其从Git中排除，例如如果您的项目是公开的。在这种情况下，您需要确保设置一种方式，让您的CI工具在构建或部署项目时获取它。

一种方法是将每个环境变量添加到您的CI/CD系统中，并更新`docker-compose.yml`文件以读取该特定的环境变量，而不是读取`.env`文件。

## 预提交钩子和代码检查

我们使用名为[pre-commit](https://pre-commit.com/)的工具进行代码检查和格式化。

安装后，它会在git提交之前运行。这样可确保代码在提交之前就是一致且格式化的。

您可以在项目根目录找到一个包含配置的`.pre-commit-config.yaml`文件。

#### 安装pre-commit以自动运行

`pre-commit`已经是项目依赖的一部分，但如果您愿意，也可以全局安装，遵循[官方pre-commit文档](https://pre-commit.com/)。

安装并可用`pre-commit`工具后，您需要在本地存储库中"安装"它，以便它在每次提交前自动运行。

使用`uv`，您可以这样做：

```bash
❯ uv run pre-commit install
pre-commit installed at .git/hooks/pre-commit
```

现在每当您尝试提交时，例如使用：

```bash
git commit
```

...pre-commit将运行并检查和格式化您即将提交的代码，并要求您在提交前再次使用git添加该代码（暂存它）。

然后您可以再次`git add`修改/修复的文件，现在您可以提交了。

#### 手动运行pre-commit钩子

您也可以在所有文件上手动运行`pre-commit`，您可以使用`uv`这样做：

```bash
❯ uv run pre-commit run --all-files
check for added large files..............................................Passed
check toml...............................................................Passed
check yaml...............................................................Passed
ruff.....................................................................Passed
ruff-format..............................................................Passed
eslint...................................................................Passed
prettier.................................................................Passed
```

## URL地址

生产环境或预发布环境的URL将使用这些相同的路径，但使用您自己的域名。

### 开发环境URL

本地开发的URL地址。

前端：http://localhost:5173

后端：http://localhost:8000

自动交互式文档（Swagger UI）：http://localhost:8000/docs

自动替代文档（ReDoc）：http://localhost:8000/redoc

Adminer：http://localhost:8080

Traefik UI：http://localhost:8090

MailCatcher：http://localhost:1080

### 配置了`localhost.tiangolo.com`的开发环境URL

本地开发的URL地址。

前端：http://dashboard.localhost.tiangolo.com

后端：http://api.localhost.tiangolo.com

自动交互式文档（Swagger UI）：http://api.localhost.tiangolo.com/docs

自动替代文档（ReDoc）：http://api.localhost.tiangolo.com/redoc

Adminer：http://localhost.tiangolo.com:8080

Traefik UI：http://localhost.tiangolo.com:8090

MailCatcher：http://localhost.tiangolo.com:1080
# Casbin RBAC 实现文档

## 概述

本项目使用 Casbin 实现基于角色的访问控制（RBAC），提供三种用户角色：

1. **普通用户 (user)** - 基本权限
2. **会员 (member)** - 扩展权限
3. **超级管理员 (admin)** - 完全权限

## 角色权限说明

### 普通用户 (user)
- ✅ 查看和管理自己的 items
- ✅ 查看和更新自己的个人资料
- ✅ 修改自己的密码
- ❌ 无法访问私有端点
- ❌ 无法管理其他用户

### 会员 (member)
- ✅ 拥有普通用户的所有权限
- ✅ 访问私有端点 (`/api/v1/private/`)
- ❌ 无法管理其他用户

### 超级管理员 (admin)
- ✅ 拥有会员的所有权限
- ✅ 管理所有用户（创建、更新、删除）
- ✅ 查看系统中所有用户列表
- ✅ 访问所有端点

## 技术实现

### 核心组件

1. **模型定义** (`app/rbac_model.conf`)
   - 使用 Casbin RBAC 模型
   - 定义了请求、策略、角色关系和匹配规则

2. **策略定义** (`app/rbac_policy.csv`)
   - 明确定义每个角色对不同资源的访问权限
   - 使用 CSV 格式便于管理和版本控制

3. **Enforcer** (`app/core/casbin_enforcer.py`)
   - 初始化 Casbin enforcer
   - 提供权限检查函数
   - 使用 LRU 缓存提高性能

4. **FastAPI 依赖** (`app/api/deps.py`)
   - `require_role()`: 基于角色的访问控制
   - `check_casbin_permission()`: 基于 Casbin 策略的权限检查

### 数据库模型

用户模型 (`User`) 包含以下与 RBAC 相关的字段：
- `role`: UserRole 枚举类型（user/member/admin）
- `is_superuser`: 布尔值，超级管理员标识

数据库迁移文件会自动：
- 为现有用户设置默认角色为 `user`
- 将现有的 superuser 用户角色更新为 `admin`

## 使用示例

### 1. 在路由中使用角色限制

```python
from fastapi import APIRouter, Depends
from app.api.deps import require_role
from app.models import UserRole

router = APIRouter()

@router.get("/private/", dependencies=[Depends(require_role(UserRole.MEMBER, UserRole.ADMIN))])
def read_private_info():
    """只有会员和管理员可以访问"""
    return {"message": "Private information"}
```

### 2. 在路由中使用 Casbin 权限检查

```python
from fastapi import Depends
from app.api.deps import check_casbin_permission

@router.get("/items", dependencies=[Depends(check_casbin_permission("/api/v1/items", "GET"))])
def read_items():
    """根据 Casbin 策略检查权限"""
    return {"items": []}
```

### 3. 创建用户时指定角色

```python
from app.models import UserCreate, UserRole

# 创建会员用户
user_in = UserCreate(
    email="member@example.com",
    password="securepassword"
)
user = crud.create_user(session=db, user_create=user_in)
user.role = UserRole.MEMBER  # 更新角色
```

## 权限矩阵

| 资源/操作 | 普通用户 | 会员 | 管理员 |
|----------|---------|------|--------|
| GET /api/v1/items | ✅ | ✅ | ✅ |
| POST /api/v1/items | ✅ | ✅ | ✅ |
| PATCH/DELETE /api/v1/items/:id | ✅ | ✅ | ✅ |
| GET /api/v1/users/me | ✅ | ✅ | ✅ |
| PATCH /api/v1/users/me | ✅ | ✅ | ✅ |
| GET /api/v1/private | ❌ | ✅ | ✅ |
| GET /api/v1/users | ❌ | ❌ | ✅ |
| POST /api/v1/users | ❌ | ❌ | ✅ |
| PATCH/DELETE /api/v1/users/:id | ❌ | ❌ | ✅ |

## 最佳实践

### 1. 优先使用 `require_role()`
- 简单直接的角色检查
- 性能更好（无需查询 Casbin）
- 代码更易读

```python
# 推荐
@router.get("/", dependencies=[Depends(require_role(UserRole.MEMBER))])
```

### 2. 复杂权限场景使用 Casbin
- 需要细粒度权限控制
- 权限规则经常变化
- 需要运行时动态权限管理

```python
# 复杂场景
@router.get("/items", dependencies=[Depends(check_casbin_permission("/api/v1/items", "GET"))])
```

### 3. 超级管理员自动通过
- `is_superuser=True` 的用户自动拥有所有权限
- 无需单独配置 Casbin 策略

### 4. 新用户默认角色
- 通过 `/signup` 注册的用户默认为 `user` 角色
- 管理员可以通过 API 升级用户角色

## 测试

运行 RBAC 相关测试：

```bash
# 运行所有测试
pytest app/tests/

# 运行 Casbin 核心测试
pytest app/tests/core/test_casbin.py

# 运行 RBAC 集成测试
pytest app/tests/api/routes/test_rbac.py
```

## 维护和扩展

### 添加新角色
1. 在 `app/models.py` 的 `UserRole` 枚举中添加新角色
2. 在 `app/rbac_policy.csv` 中为新角色添加权限规则
3. 创建数据库迁移添加新的枚举值
4. 更新相关文档

### 修改权限策略
1. 直接编辑 `app/rbac_policy.csv`
2. 重启应用使更改生效（enforcer 会重新加载）
3. 添加相应的测试验证权限变更

### 动态权限管理
如需运行时修改权限，可以使用 Casbin 的 API：

```python
from app.core.casbin_enforcer import get_casbin_enforcer

enforcer = get_casbin_enforcer()
# 添加策略
enforcer.add_policy("user", "/api/v1/new-resource", "GET")
# 删除策略
enforcer.remove_policy("user", "/api/v1/old-resource", "GET")
```

## 安全考虑

1. **最小权限原则**: 默认给予用户最少的权限
2. **角色分离**: 清晰区分不同角色的职责
3. **审计日志**: 记录关键操作和权限变更
4. **定期审查**: 定期审查用户角色分配和权限配置

## 参考资料

- [Casbin 官方文档](https://casbin.org/docs/overview)
- [RBAC 模型说明](https://casbin.org/docs/rbac)
- [FastAPI 依赖注入](https://fastapi.tiangolo.com/tutorial/dependencies/)

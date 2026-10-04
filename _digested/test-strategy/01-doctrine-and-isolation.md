# 01 — 测试宪法与强隔离机制：test.sh 与环境清洗沙箱

> **源码锚点**：
> - 根目录测试运行器：`test.sh`
> - 测试环境抹平包装器：`pi-test.sh`
> - 开发者与 AI 准则：`AGENTS.md`（"Commands" 章节）

---

## 一、Pi 测试体系的“三权宪法”

在很多 AI 项目中，测试环境往往处于“未受控状态”：开发者本地配置了环境变量、Git 凭据、SSH 密钥或缓存文件，导致测试在“我的电脑上能跑，在 CI 上挂掉”，或者反过来“在 CI 上能跑，在本地把真实数据覆盖”。

在 `pi-mono` 中，测试体系确立了三条神圣不可侵犯的**“测试铁律（The Iron Rules）”**：

1. **零付费 Token 铁律（Zero Paid Tokens Rule）**：
   `AGENTS.md` 明确规定：
   > *"Never run the full vitest suite directly: it includes e2e tests that activate when endpoint/auth env vars are present. For all non-e2e tests, run `./test.sh` from the repo root. For packages/coding-agent/test/suite/, use test/suite/harness.ts + the faux provider. No real provider APIs, keys, or paid tokens."*
   单元与集成测试必须在完全断绝大模型 API Key 的环境下执行。
2. **宿主无感知强隔离铁律（Hermetic Environment Rule）**：
   测试无论如何执行，绝不允许读取开发者的真实 `~/.config`、`~/.gitconfig` 或系统的钥匙串，也绝不允许在开发者的磁盘上残留脏文件。
3. **确定性优先于真实性（Determinism over Authenticity）**：
   在常规流水线中，宁可使用模拟的 Faux 状态机测试，也绝不引入带有网络延迟和概率性抽样的大模型真实调用。

---

## 二、解密 test.sh：操作系统级物理隔离沙箱

Pi-mono 根目录下的 `test.sh` 仅有 80 行代码，但它实现了一个极其坚固的**进程沙箱运行时**。它的核心技术可以拆解为五个核心防御面：

```
[test.sh 启动]
     │
     ├── 1. mktemp -d 构造随机临时根目录: /tmp/pi-test.XXXXXX
     ├── 2. 注入所有权标记文件: touch .pi-test-owned
     ├── 3. 拦截 EXIT 信号: trap cleanup EXIT (严格校验标记后 rm -rf)
     ├── 4. 组装白名单环境变量 test_env:
     │        ├── HOME, USERPROFILE ──► 指向临时目录
     │        ├── GIT 凭据与全局配置 ──► 完全注销为 /dev/null
     │        ├── NPM 用户与全局配置 ──► 重定向至沙箱内
     │        └── 云端与本地模型嗅探 ──► 硬性设为禁用
     └── 5. 抹除系统环境并派生: env -i "${test_env[@]}" npm test
```

### 1. 临时沙箱与所有权自毁守卫（Ownership & Cleanup Guard）
- **问题**：如果测试脚本简单地 `rm -rf $DIR`，一旦变量为空或者被错误赋值为 `/` 或 `~`，会导致灾难性删库。
- **解法**：`test.sh` 采用了严格的**双重所有权标记验证**：
  ```bash
  test_root="$(mktemp -d "$temp_parent/pi-test.XXXXXX")"
  touch "$test_root/.pi-test-owned"

  cleanup() {
    case "$test_root" in
      "$temp_parent"/pi-test.*)
        if [[ -d "$test_root" && ! -L "$test_root" && -f "$test_root/.pi-test-owned" ]]; then
          rm -rf -- "$test_root"
        else
          printf "Refusing to remove unverified test directory: %s\n" "$test_root" >&2
        fi
        ;;
    esac
  }
  trap cleanup EXIT
  ```
  只有路径符合 `/tmp/pi-test.*` 正则、非软链接且物理包含 `.pi-test-owned` 标记文件的目录，才允许在退出时被自动销毁。

### 2. Git 环境全面中立化（Git Neutralization）
- **问题**：Agent 或单测如果调用 Git 命令，可能会触发系统的全局 `~/.gitconfig`（例如配置了 GPG 自动签名、HTTP 代理、或者全局 Commit 模板），导致测试行为受宿主环境污染。
- **解法**：
  ```bash
  "GIT_CONFIG_NOSYSTEM=1"
  "GIT_CONFIG_GLOBAL=/dev/null"
  "GIT_TERMINAL_PROMPT=0"
  "GIT_ASKPASS=$git_askpass"
  "GIT_EDITOR=true"
  "GIT_SEQUENCE_EDITOR=true"
  ```
  彻底切断系统和全局 Git 配置；禁止终端交互式密码输入（`GIT_TERMINAL_PROMPT=0`）；将 Git 编辑器静默重定向为 `true`，防止测试因弹开交互式 Vim 而挂死。

### 3. NPM 与包管理器沙箱化（NPM Sandboxing）
```bash
"NPM_CONFIG_USERCONFIG=$test_root/npm-userconfig"
"NPM_CONFIG_GLOBALCONFIG=$test_root/npm-globalconfig"
"NPM_CONFIG_CACHE=$test_root/cache/npm"
```
测试期间所有的 npm 临时缓存、全局包索引全部写入沙箱内，不与宿主机的 npm 缓存发生锁竞争，也不修改开发者的真实 npm 配置。

### 4. 切断本地 LLM 与云凭证探测
```bash
"PI_NO_LOCAL_LLM=1"
"AWS_EC2_METADATA_DISABLED=true"
```
- `PI_NO_LOCAL_LLM=1`：强制禁止 Pi 探测本机运行的 Ollama 或 vLLM 实例；
- `AWS_EC2_METADATA_DISABLED=true`：禁止 AWS SDK 在测试中向本地链路地址（`169.254.169.254`）发起请求探测 EC2 实例元数据，避免带来 2~5 秒的无意义 TCP 连接超时。

### 5. `env -i` 物理真空启动
```bash
env -i "${test_env[@]}" npm test
```
这是沙箱的画龙点睛之笔：`env -i` 会彻底清空当前 Shell 中所有继承自操作系统的环境变量（包括开发者设置的 `EXPORT FOO=BAR`、系统代理、Python 路径等），仅将显式声明的 `test_env` 白名单变量灌入 Node 进程。

---

## 三、解密 pi-test.sh：30+ API 密钥清洗机

除了自动化的 `test.sh` 之外，当开发者或 Coding Agent 需要在终端调试运行时，仓库提供了 `pi-test.sh`。

### 30+ 显式 Key 抹除列表
当传入 `--no-env` 参数时，脚本会逐一执行针对各大模型提供商的凭据清除：
```bash
if [[ "$NO_ENV" == "true" ]]; then
  unset ANTHROPIC_API_KEY
  unset ANTHROPIC_OAUTH_TOKEN
  unset OPENAI_API_KEY
  unset GEMINI_API_KEY
  unset GROQ_API_KEY
  unset CEREBRAS_API_KEY
  unset XAI_API_KEY
  unset OPENROUTER_API_KEY
  unset ZAI_API_KEY
  unset MISTRAL_API_KEY
  unset MINIMAX_API_KEY
  unset MINIMAX_CN_API_KEY
  unset AI_GATEWAY_API_KEY
  unset OPENCODE_API_KEY
  unset COPILOT_GITHUB_TOKEN
  unset GH_TOKEN
  unset GITHUB_TOKEN
  unset HF_TOKEN
  unset GOOGLE_APPLICATION_CREDENTIALS
  unset GOOGLE_CLOUD_PROJECT
  unset AWS_PROFILE
  unset AWS_ACCESS_KEY_ID
  unset AWS_SECRET_ACCESS_KEY
  unset AZURE_OPENAI_API_KEY
  ...
  echo "Running without API keys..."
fi
```
这保证了即使开发者的宿主环境中已经配置了付费 Key，只要带上 `--no-env`，启动的 Pi 实例就绝对处于无 Key 纯净状态，避免误伤钱包。

---

## 四、对 Coding Agent 研发的架构启示

1. **杜绝“隐式环境依赖（Ambient Host Leakage）”**：
   如果测试依赖了外部的全局配置，Coding Agent 在不同机器上执行自愈时就会遭遇“幻觉报错”。沙箱化保证了测试环境在任何物理机上均具备绝对相同的初始状态。
2. **秒级回收无残留**：
   Agent 在进行数百次高频修改和测试迭代时，如果每次测试都在磁盘残留几十兆临时目录，硬盘会在数小时内被撑爆。`trap cleanup EXIT` 的严格自毁机制保证了工作区的绝对整洁。

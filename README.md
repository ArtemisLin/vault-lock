# VaultLock

**VaultLock** 是一个为 [Obsidian](https://obsidian.md/) 设计的插件，通过密码保护锁定Obsidian的用户界面，确保你的笔记和数据安全无虞。

![VaultLock界面](https://github.com/ArtemisLin/vault-lock/blob/master/assets/vault-lock-screenshot.png)  

## 功能特性

- **密码保护**：设置一个4位数字密码来锁定和解锁Obsidian界面。
- **自动锁定**：
  - 在Obsidian启动时自动锁定。
  - 在一段时间不活动后自动锁定。
  - 当Obsidian窗口失去焦点时自动锁定。
- **手动锁定**：通过命令面板手动锁定你的Vault。
- **密码重置帮助**：如果忘记密码，提供重置插件的指南。
- **多语言支持**：支持英文和简体中文界面。

## 安装方法

1. **下载插件**：
   - 从 [GitHub releases](https://github.com/ArtemisLin/vault-lock/blob/master/assets/vault-lock-screenshot.png) 下载最新版本的 `vaultlock.zip`。
2. **安装插件**：
   - 打开Obsidian，进入“设置” > “社区插件”。
   - 确保“社区插件”已启用。
   - 点击“浏览”，搜索“VaultLock”，或手动上传下载的 `vaultlock.zip` 文件。
3. **启用插件**：
   - 安装完成后，返回“社区插件”页面，找到“VaultLock”并启用。

## 使用指南

### 设置密码

1. 首次安装后，插件会提示你设置一个4位数字密码。
2. 输入你的密码并确认。
3. 密码设置成功后，你可以通过此密码锁定和解锁Obsidian界面。

### 锁定Vault

- **自动锁定**：
  - **Obsidian启动时**：可在设置中启用。
  - **不活动超时**：可在设置中指定不活动时间（例如5分钟）。
  - **窗口失去焦点**：当切换到其他应用时锁定，可在设置中启用。
- **手动锁定**：
  - 打开命令面板（`Ctrl+P` 或 `Cmd+P`），输入“Lock Vault”并执行。

### 解锁Vault

- 当Vault被锁定时，输入你的4位密码解锁。
- 如果密码错误，系统会提示剩余尝试次数。
- 尝试次数过多（默认5次）后，Vault将锁定一段时间（默认5分钟）。

### 忘记密码

如果忘记密码，可以通过以下步骤重置插件：

1. 完全关闭Obsidian。
2. 导航到你的Vault文件夹。
3. 打开 `.obsidian/plugins/vaultlock/` 文件夹。
4. 删除 `data.json` 文件。
5. 重新启动Obsidian。

**注意**：此操作会重置所有密码设置，但不会影响你的笔记内容。

## 配置选项

在Obsidian的“设置” > “VaultLock”中，你可以调整以下选项：

- **语言**：选择界面语言（英文或简体中文）。
- **自动锁定设置**：
  - **启动时锁定**：Obsidian启动时自动锁定Vault。
  - **不活动锁定**：设置不活动时间（分钟），超时后自动锁定。
  - **窗口失去焦点时锁定**：切换应用时自动锁定。
- **手动锁定**：通过命令面板执行“Lock Vault”命令。

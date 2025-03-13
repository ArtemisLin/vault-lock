// src/main.ts
import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { LockScreen } from './src/lock-screen';
import { LockTrigger } from './src/lock-trigger';
import { PasswordUtils } from './src/password-utils';
import { DEFAULT_SETTINGS, PasswordSettings } from './src/settings';
import { EN, ZH_CN } from './src/i18n';

export default class PasswordLockPlugin extends Plugin {
  settings: PasswordSettings;
  lockScreen: LockScreen;
  lockTrigger: LockTrigger;
  i18n: any;

  async onload() {
    // 加载设置
    await this.loadSettings();
    
    // 加载语言
    this.loadLanguage();
    
    // 初始化锁屏
    this.lockScreen = new LockScreen(this.app, this);
    
    // 初始化自动锁定触发器
    this.lockTrigger = new LockTrigger(this.app, this);
    
    // 添加设置面板
    this.addSettingTab(new PasswordLockSettingTab(this.app, this));
    
    // 添加命令：锁定保管库
    this.addCommand({
      id: 'lock-vault',
      name: this.i18n.lockVault,
      callback: () => {
        this.lockVault();
      }
    });
    
    // 如果已经设置了密码，根据设置决定是否自动锁定
    if (this.settings.passwordHash) {
      if (this.settings.lockOnStartup) {
        this.lockVault();
      }
    } else {
      // 如果没有设置密码，显示密码设置界面
      setTimeout(() => {
        this.lockScreen.showPasswordSetupFlow();
      }, 500);
    }
    
    // 更新锁定触发器设置
    this.lockTrigger.updateSettings();
  }

  onunload() {
    // 清除所有事件监听器
    this.lockTrigger.clearEventListeners();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.loadLanguage();
  }

  loadLanguage() {
    if (this.settings.language === 'zh-cn') {
      this.i18n = ZH_CN;
    } else {
      this.i18n = EN;
    }
  }

  // 获取翻译文本
  t(key: string): string {
    return this.i18n[key];
  }

  // 锁定保管库
  lockVault() {
    this.lockScreen.showLockScreen();
  }

  // 解锁保管库
  async unlockVault(password: string): Promise<boolean> {
    if (await this.lockScreen.verifyPassword(password)) {
      this.lockScreen.hideLockScreen();
      return true;
    }
    return false;
  }

  // 验证主密码
  async verifyMainPassword(password: string): Promise<boolean> {
    return await PasswordUtils.verifyPassword(
      password,
      this.settings.passwordHash,
      this.settings.salt
    );
  }

  // 保存主密码
  async saveMainPassword(password: string): Promise<void> {
    const salt = PasswordUtils.generateSalt();
    const hash = await PasswordUtils.hashPassword(password, salt);
    
    this.settings.passwordHash = hash;
    this.settings.salt = salt;
    
    await this.saveSettings();
  }

  // 重置密码
  async resetPassword(): Promise<void> {
    this.settings.passwordHash = '';
    this.settings.salt = '';
    
    await this.saveSettings();
    
    if (this.lockScreen) {
      this.lockScreen.hideLockScreen();
    }
    
    setTimeout(() => {
      this.lockScreen.showPasswordSetupFlow();
    }, 300);
  }
}

// 设置面板
class PasswordLockSettingTab extends PluginSettingTab {
  plugin: PasswordLockPlugin;

  constructor(app: App, plugin: PasswordLockPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: this.plugin.t('lockVault') });

    // 语言选项
    new Setting(containerEl)
      .setName('Language / 语言')
      .setDesc('Select the language for the plugin interface. / 选择插件界面语言。')
      .addDropdown(dropdown => dropdown
        .addOption('en', 'English')
        .addOption('zh-cn', '简体中文')
        .setValue(this.plugin.settings.language)
        .onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
          this.display(); // 重新加载设置界面以应用新语言
        }));

    // 设置/更改密码
    new Setting(containerEl)
      .setName(this.plugin.t('setPassword'))
      .setDesc(this.plugin.t('setPasswordDesc'))
      .addButton(button => button
        .setButtonText(this.plugin.settings.passwordHash 
          ? this.plugin.t('changePassword') 
          : this.plugin.t('setPassword'))
        .onClick(() => {
          this.plugin.lockScreen.showPasswordSetupFlow();
        }));

    // 启动时锁定选项
    new Setting(containerEl)
      .setName(this.plugin.t('lockOnStartup'))
      .setDesc(this.plugin.t('lockOnStartupDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.lockOnStartup)
        .onChange(async (value) => {
          this.plugin.settings.lockOnStartup = value;
          await this.plugin.saveSettings();
        }));

    // 不活动时锁定选项
    new Setting(containerEl)
      .setName(this.plugin.t('lockOnInactivity'))
      .setDesc(this.plugin.t('lockOnInactivityDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.lockOnInactivity)
        .onChange(async (value) => {
          this.plugin.settings.lockOnInactivity = value;
          await this.plugin.saveSettings();
          this.plugin.lockTrigger.updateSettings();
          this.display(); // 更新显示以显示/隐藏超时选项
        }));

    // 不活动超时选项（仅当不活动锁定启用时显示）
    if (this.plugin.settings.lockOnInactivity) {
      new Setting(containerEl)
        .setName(this.plugin.t('inactivityTimeout'))
        .setDesc(this.plugin.t('inactivityTimeoutDesc'))
        .addDropdown(dropdown => dropdown
          .addOption('1', '1 minute')
          .addOption('3', '3 minutes')
          .addOption('5', '5 minutes')
          .addOption('10', '10 minutes')
          .addOption('15', '15 minutes')
          .addOption('30', '30 minutes')
          .addOption('60', '1 hour')
          .setValue(this.plugin.settings.inactivityTimeout.toString())
          .onChange(async (value) => {
            this.plugin.settings.inactivityTimeout = parseInt(value);
            await this.plugin.saveSettings();
            this.plugin.lockTrigger.updateSettings();
          }));
    }

    // 窗口失焦时锁定选项
    new Setting(containerEl)
      .setName(this.plugin.t('lockOnWindowBlur'))
      .setDesc(this.plugin.t('lockOnWindowBlurDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.lockOnWindowBlur)
        .onChange(async (value) => {
          this.plugin.settings.lockOnWindowBlur = value;
          await this.plugin.saveSettings();
          this.plugin.lockTrigger.updateSettings();
        }));

    // 手动锁定说明
    containerEl.createEl('h3', { text: this.plugin.t('manualLock') });
    containerEl.createEl('p', { text: this.plugin.t('manualLockDesc') });

    // 版本信息
    containerEl.createEl('div', { 
      text: 'Vault Lock v' + this.plugin.manifest.version,
      cls: 'vault-lock-version'
    });
  }
}
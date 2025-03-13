// src/lock-screen.ts
import { App, Modal, Notice } from 'obsidian';
import PasswordLockPlugin from '../main';
import { PasswordUtils } from './password-utils';

export class LockScreen {
  private app: App;
  private plugin: PasswordLockPlugin;
  private lockEl: HTMLElement | null = null;
  private inputValue: string = '';
  private errorMessageEl: HTMLElement | null = null;
  private keypadEl: HTMLElement | null = null;
  private activeKey: HTMLElement | null = null; // 记录当前激活的按键
  private MAX_ATTEMPTS = 5;
  private LOCKOUT_TIME = 5 * 60 * 1000; // 5分钟锁定时间(毫秒)

  constructor(app: App, plugin: PasswordLockPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  // 显示锁屏
  showLockScreen(): void {
    // 如果已经显示，不重复显示
    if (this.lockEl) return;

    // 创建锁屏元素
    this.lockEl = document.createElement('div');
    this.lockEl.classList.add('password-lock-screen');
    
    // 创建锁屏内容
    const content = document.createElement('div');
    content.classList.add('password-lock-content');
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = this.plugin.t('enterPassword');
    title.style.color = 'var(--interactive-accent)';
    content.appendChild(title);
    
    // 密码显示区域
    const passwordDisplay = document.createElement('div');
    passwordDisplay.classList.add('password-display');
    content.appendChild(passwordDisplay);
    
    // 密码输入显示（显示为圆点）
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('password-dots');
    passwordDisplay.appendChild(dotsContainer);
    
    // 数字键盘
    const keypad = document.createElement('div');
    keypad.classList.add('password-keypad');
    this.keypadEl = keypad;
    
    // 添加数字按钮 (1-9, 0)
    for (let i = 1; i <= 9; i++) {
      this.addKeypadButton(keypad, dotsContainer, i.toString());
    }
    this.addKeypadButton(keypad, dotsContainer, '0');
    
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('password-key', 'delete-key');
    deleteBtn.innerHTML = '&larr;';
    deleteBtn.addEventListener('click', () => {
      this.handleDelete();
      this.updatePasswordDisplay(dotsContainer);
    });
    keypad.appendChild(deleteBtn);
    
    content.appendChild(keypad);
    
    // 错误消息区域
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('password-error-message');
    content.appendChild(errorMessage);
    this.errorMessageEl = errorMessage;
    
    // 检查是否已经锁定
    this.checkLockoutStatus();
    
    // 添加忘记密码按钮
    const forgotBtn = document.createElement('button');
    forgotBtn.classList.add('forgot-password');
    forgotBtn.textContent = this.plugin.t('forgotPassword');
    forgotBtn.addEventListener('click', () => {
      this.showResetHelpModal();
    });
    content.appendChild(forgotBtn);
    
    this.lockEl.appendChild(content);
    
    // 添加到文档
    document.body.appendChild(this.lockEl);
    
    // 重置输入值
    this.inputValue = '';
    this.updatePasswordDisplay(dotsContainer);
    
    // 禁用背景交互
    document.body.classList.add('password-locked');
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDown);
  }

  // 隐藏锁屏
  hideLockScreen(): void {
    if (this.lockEl) {
      document.body.removeChild(this.lockEl);
      this.lockEl = null;
      this.errorMessageEl = null;
      this.keypadEl = null;
      this.activeKey = null;
      document.body.classList.remove('password-locked');
      
      // 移除键盘事件监听
      document.removeEventListener('keydown', this.handleKeyDown);
      
      // 重置尝试次数
      this.plugin.settings.attempts = 0;
      this.plugin.settings.lastUnlockTime = Date.now();
      this.plugin.settings.lockedUntil = 0;
      this.plugin.saveSettings();
    }
  }

  // 验证密码
  async verifyPassword(password: string): Promise<boolean> {
    const { attempts } = this.plugin.settings;
    
    // 检查是否暂时锁定
    if (this.isLockedOut()) {
      this.showLockoutError();
      return false;
    }
    
    // 验证密码
    const isCorrect = await this.plugin.verifyMainPassword(password);
    
    if (isCorrect) {
      // 密码正确，重置尝试次数
      this.plugin.settings.attempts = 0;
      this.plugin.settings.lastUnlockTime = Date.now();
      await this.plugin.saveSettings();
      return true;
    } else {
      // 密码错误，增加尝试次数
      this.plugin.settings.attempts++;
      await this.plugin.saveSettings();
      
      // 添加振动动画
      if (this.lockEl) {
        const content = this.lockEl.querySelector('.password-lock-content');
        if (content) {
          content.classList.add('shake-animation');
          setTimeout(() => {
            content.classList.remove('shake-animation');
          }, 500);
        }
      }
      
      if (this.plugin.settings.attempts >= this.MAX_ATTEMPTS) {
        // 设置锁定时间
        this.plugin.settings.lockedUntil = Date.now() + this.LOCKOUT_TIME;
        await this.plugin.saveSettings();
        
        // 显示锁定错误
        this.showLockoutError();
        
        // 禁用键盘
        this.disableKeypad();
      } else {
        // 显示错误消息
        const remainingAttempts = this.MAX_ATTEMPTS - this.plugin.settings.attempts;
        this.showError(`${this.plugin.t('incorrectPassword')} ${remainingAttempts} ${this.plugin.t('attemptsRemaining')}`);
      }
      
      return false;
    }
  }

  // 检查是否被锁定
  private isLockedOut(): boolean {
    const { lockedUntil } = this.plugin.settings;
    return lockedUntil > Date.now();
  }

  // 禁用数字键盘
  private disableKeypad(): void {
    if (this.keypadEl) {
      const buttons = this.keypadEl.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
      });
    }
  }

  // 启用数字键盘
  private enableKeypad(): void {
    if (this.keypadEl) {
      const buttons = this.keypadEl.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('disabled');
      });
    }
  }

  // 检查锁定状态
  private checkLockoutStatus(): void {
    if (this.isLockedOut()) {
      this.showLockoutError();
      this.disableKeypad();
      
      // 设置定时器检查锁定状态
      const checkInterval = setInterval(() => {
        if (!this.isLockedOut()) {
          this.enableKeypad();
          this.clearError();
          clearInterval(checkInterval);
        } else {
          this.showLockoutError();
        }
      }, 1000);
    }
  }

  // 显示锁定错误
  private showLockoutError(): void {
    const remainingTime = this.plugin.settings.lockedUntil - Date.now();
    const formattedTime = PasswordUtils.formatRemainingTime(remainingTime);
    this.showError(`${this.plugin.t('lockedFor')} ${formattedTime}.`, true);
  }

  // 显示错误消息
  private showError(message: string, isLockout: boolean = false): void {
    if (this.errorMessageEl) {
      this.errorMessageEl.textContent = message;
      this.errorMessageEl.classList.add('visible');
      
      if (isLockout) {
        this.errorMessageEl.classList.add('lockout');
      } else {
        this.errorMessageEl.classList.remove('lockout');
      }
    }
  }

  // 清除错误消息
  private clearError(): void {
    if (this.errorMessageEl) {
      this.errorMessageEl.textContent = '';
      this.errorMessageEl.classList.remove('visible', 'lockout');
    }
  }
  
  // 键盘事件处理
  private handleKeyDown = (event: KeyboardEvent): void => {
    // 如果锁定状态，忽略键盘输入
    if (this.isLockedOut()) {
      this.showLockoutError();
      return;
    }
    
    // 处理数字键 (主键盘和数字键盘)
    if (/^[0-9]$/.test(event.key)) {
      // 限制密码长度为4位
      if (this.inputValue.length < 4) {
        // 模拟按键点击效果
        if (this.keypadEl) {
          // 计算按钮索引 (1-9 对应 1-9, 0 对应 10)
          const buttonIndex = event.key === '0' ? 10 : parseInt(event.key);
          const keyButton = this.keypadEl.querySelector(`.password-key:not(.delete-key):nth-child(${buttonIndex})`);
          
          if (keyButton) {
            // 添加按键激活效果
            keyButton.classList.add('active');
            this.activeKey = keyButton as HTMLElement;
            
            // 短暂延迟后移除激活效果
            setTimeout(() => {
              if (this.activeKey) {
                this.activeKey.classList.remove('active');
                this.activeKey = null;
              }
            }, 200); // 稍微延长一点，让效果更明显
          }
        }
        
        this.inputValue += event.key;
        
        // 更新显示
        const dotsContainer = this.lockEl?.querySelector('.password-dots');
        if (dotsContainer) {
          this.updatePasswordDisplay(dotsContainer as HTMLElement);
        }
        
        // 清除错误消息
        this.clearError();
        
        // 如果达到4位，尝试验证
        if (this.inputValue.length === 4) {
          setTimeout(async () => {
            if (await this.verifyPassword(this.inputValue)) {
              await this.plugin.unlockVault(this.inputValue);
            } else {
              // 失败后清空输入
              this.inputValue = '';
              const dotsContainer = this.lockEl?.querySelector('.password-dots');
              if (dotsContainer) {
                this.updatePasswordDisplay(dotsContainer as HTMLElement);
              }
            }
          }, 300);
        }
      }
    }
    // 处理退格键
    else if (event.key === 'Backspace') {
      // 模拟删除键点击效果
      if (this.keypadEl) {
        const deleteButton = this.keypadEl.querySelector('.delete-key');
        if (deleteButton) {
          // 添加按键激活效果
          deleteButton.classList.add('active');
          
          // 短暂延迟后移除激活效果
          setTimeout(() => {
            deleteButton.classList.remove('active');
          }, 200);
        }
      }
      
      this.handleDelete();
      const dotsContainer = this.lockEl?.querySelector('.password-dots');
      if (dotsContainer) {
        this.updatePasswordDisplay(dotsContainer as HTMLElement);
      }
    }
  }

  // 添加数字键盘按钮
  private addKeypadButton(keypad: HTMLElement, dotsContainer: HTMLElement, value: string): void {
    const button = document.createElement('button');
    button.classList.add('password-key');
    button.textContent = value;
    button.addEventListener('click', () => {
      // 检查是否锁定
      if (this.isLockedOut()) {
        this.showLockoutError();
        return;
      }
      
      // 限制最大长度为4位
      if (this.inputValue.length < 4) {
        this.inputValue += value;
        
        // 更新显示
        this.updatePasswordDisplay(dotsContainer);
        
        // 清除错误消息
        this.clearError();
        
        // 如果达到4位，尝试验证
        if (this.inputValue.length === 4) {
          // 延迟验证以便用户可以看到输入
          setTimeout(async () => {
            if (await this.verifyPassword(this.inputValue)) {
              await this.plugin.unlockVault(this.inputValue);
            } else {
              // 失败后清空输入
              this.inputValue = '';
              this.updatePasswordDisplay(dotsContainer);
            }
          }, 300);
        }
      }
    });
    keypad.appendChild(button);
  }

  // 处理删除按钮
  private handleDelete(): void {
    if (this.inputValue.length > 0) {
      this.inputValue = this.inputValue.slice(0, -1);
    }
  }

  // 更新密码显示
  private updatePasswordDisplay(container: HTMLElement): void {
    container.empty();
    
    // 添加圆点表示输入的密码位数
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.classList.add('password-dot');
      if (i < this.inputValue.length) {
        dot.classList.add('filled');
      }
      container.appendChild(dot);
    }
  }

  // 显示密码设置流程
  showPasswordSetupFlow(): void {
    const modal = new PasswordInputModal(
      this.app, 
      this.plugin.t('setPassword'), 
      this.plugin.t('setPasswordDesc'),
      async (password) => {
        // 确认密码
        const confirmModal = new PasswordInputModal(
          this.app, 
          this.plugin.t('confirmPassword'), 
          this.plugin.t('confirmPasswordDesc'),
          async (confirmPassword) => {
            if (password === confirmPassword) {
              // 密码匹配，保存主密码
              await this.plugin.saveMainPassword(password);
              return true;
            } else {
              // 密码不匹配
              new Notice(this.plugin.t('passwordsNotMatch'));
              setTimeout(() => {
                this.showPasswordSetupFlow();
              }, 300);
              return false;
            }
          }
        );
        confirmModal.open();
        return true;
      }
    );
    modal.open();
  }

  // 显示密码重置帮助模态框
  showResetHelpModal(): void {
    // 当显示帮助模态框时，先隐藏锁屏界面
    if (this.lockEl) {
      this.lockEl.style.display = 'none';
    }
    
    const modal = new DisablePluginHelpModal(
      this.app, 
      this.plugin, 
      () => {
        // 模态框关闭后恢复锁屏显示
        if (this.lockEl) {
          this.lockEl.style.display = 'flex';
        }
      }
    );
    modal.open();
  }
}

// 密码输入模态框 - 统一界面
export class PasswordInputModal extends Modal {
  private title: string;
  private description: string;
  private onSubmit: (password: string) => Promise<boolean>;
  private inputValue: string = '';
  private errorMessageEl: HTMLElement | null = null;
  private activeKey: HTMLElement | null = null; // 记录当前激活的按键

  constructor(
    app: App, 
    title: string, 
    description: string, 
    onSubmit: (password: string) => Promise<boolean>
  ) {
    super(app);
    this.title = title;
    this.description = description;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    // 移除默认的模态框和背景
    this.containerEl.addClass('password-custom-modal');
    this.modalEl.empty(); // 清空默认内容
    
    // 创建模态框内容
    const content = document.createElement('div');
    content.classList.add('password-modal-content');
    this.modalEl.appendChild(content);
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = this.title;
    title.style.color = 'var(--interactive-accent)';
    content.appendChild(title);
    
    // 描述
    const desc = document.createElement('p');
    desc.textContent = this.description;
    desc.classList.add('password-setup-desc');
    content.appendChild(desc);
    
    // 密码显示区域
    const passwordDisplay = document.createElement('div');
    passwordDisplay.classList.add('password-display');
    content.appendChild(passwordDisplay);
    
    // 密码输入显示（显示为圆点）
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('password-dots');
    passwordDisplay.appendChild(dotsContainer);
    
    // 数字键盘
    const keypad = document.createElement('div');
    keypad.classList.add('password-keypad');
    
    // 添加数字按钮 (1-9, 0)
    for (let i = 1; i <= 9; i++) {
      this.addKeypadButton(keypad, dotsContainer, i.toString());
    }
    this.addKeypadButton(keypad, dotsContainer, '0');
    
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('password-key', 'delete-key');
    deleteBtn.innerHTML = '&larr;';
    deleteBtn.addEventListener('click', () => {
      this.handleDelete();
      this.updatePasswordDisplay(dotsContainer);
    });
    keypad.appendChild(deleteBtn);
    
    content.appendChild(keypad);
    
    // 错误消息区域
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('password-error-message');
    content.appendChild(errorMessage);
    this.errorMessageEl = errorMessage;
    
    // 初始化密码显示
    this.updatePasswordDisplay(dotsContainer);
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDown);
  }

  onClose() {
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
    this.containerEl.empty();
  }

  // 显示错误消息
  private showError(message: string): void {
    if (this.errorMessageEl) {
      this.errorMessageEl.textContent = message;
      this.errorMessageEl.classList.add('visible');
    }
  }

  // 清除错误消息
  private clearError(): void {
    if (this.errorMessageEl) {
      this.errorMessageEl.textContent = '';
      this.errorMessageEl.classList.remove('visible');
    }
  }
  
  // 键盘事件处理
  private handleKeyDown = (event: KeyboardEvent): void => {
    // 处理数字键 (主键盘和数字键盘)
    if (/^[0-9]$/.test(event.key)) {
      // 限制密码长度为4位
      if (this.inputValue.length < 4) {
        // 模拟按键点击效果
        const buttonIndex = event.key === '0' ? 10 : parseInt(event.key);
        const keyButton = this.modalEl.querySelector(`.password-key:not(.delete-key):nth-child(${buttonIndex})`);
        
        if (keyButton) {
          // 添加按键激活效果
          keyButton.classList.add('active');
          this.activeKey = keyButton as HTMLElement;
          
          // 短暂延迟后移除激活效果
          setTimeout(() => {
            if (this.activeKey) {
              this.activeKey.classList.remove('active');
              this.activeKey = null;
            }
          }, 200);
        }
        
        this.inputValue += event.key;
        
        // 更新显示
        const dotsContainer = this.modalEl.querySelector('.password-dots');
        if (dotsContainer) {
          this.updatePasswordDisplay(dotsContainer as HTMLElement);
        }
        
        // 清除错误
        this.clearError();
        
        // 如果达到4位，提交
        if (this.inputValue.length === 4) {
          setTimeout(async () => {
            const result = await this.onSubmit(this.inputValue);
            if (result) {
              this.close();
            } else {
              // 失败后清空输入
              this.inputValue = '';
              const dotsContainer = this.modalEl.querySelector('.password-dots');
              if (dotsContainer) {
                this.updatePasswordDisplay(dotsContainer as HTMLElement);
              }
            }
          }, 300);
        }
      }
    }
    // 处理退格键
    else if (event.key === 'Backspace') {
      // 模拟删除键点击效果
      const deleteButton = this.modalEl.querySelector('.delete-key');
      if (deleteButton) {
        // 添加按键激活效果
        deleteButton.classList.add('active');
        
        // 短暂延迟后移除激活效果
        setTimeout(() => {
          deleteButton.classList.remove('active');
        }, 200);
      }
      
      if (this.inputValue.length > 0) {
        this.inputValue = this.inputValue.slice(0, -1);
        
        // 更新显示
        const dotsContainer = this.modalEl.querySelector('.password-dots');
        if (dotsContainer) {
          this.updatePasswordDisplay(dotsContainer as HTMLElement);
        }
      }
    }
  }

  // 添加数字键盘按钮
  private addKeypadButton(container: HTMLElement, dotsContainer: HTMLElement, value: string): void {
    const button = document.createElement('button');
    button.classList.add('password-key');
    button.textContent = value;
    button.addEventListener('click', () => {
      // 限制最大长度为4位
      if (this.inputValue.length < 4) {
        this.inputValue += value;
        
        // 更新显示
        this.updatePasswordDisplay(dotsContainer);
        
        // 清除错误
        this.clearError();
        
        // 如果达到4位，提交
        if (this.inputValue.length === 4) {
          // 延迟提交以便用户可以看到输入
          setTimeout(async () => {
            const result = await this.onSubmit(this.inputValue);
            if (result) {
              this.close();
            } else {
              // 失败后清空输入
              this.inputValue = '';
              this.updatePasswordDisplay(dotsContainer);
            }
          }, 300);
        }
      }
    });
    container.appendChild(button);
  }

  // 处理删除按钮
  private handleDelete(): void {
    if (this.inputValue.length > 0) {
      this.inputValue = this.inputValue.slice(0, -1);
    }
  }

  // 更新密码显示
  private updatePasswordDisplay(container: HTMLElement): void {
    container.empty();
    
    // 添加圆点表示输入的密码位数
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.classList.add('password-dot');
      if (i < this.inputValue.length) {
        dot.classList.add('filled');
      }
      container.appendChild(dot);
    }
  }
}

// 重置插件帮助模态框
export class DisablePluginHelpModal extends Modal {
  private plugin: PasswordLockPlugin;
  private closeCallback: () => void;
  
  constructor(app: App, plugin: PasswordLockPlugin, closeCallback: () => void) {
    super(app);
    this.plugin = plugin;
    this.closeCallback = closeCallback;
  }
  
  onOpen() {
    // 移除默认的模态框和背景
    this.containerEl.addClass('password-custom-modal');
    this.modalEl.empty(); // 清空默认内容
    
    // 创建模态框内容
    const content = document.createElement('div');
    content.classList.add('password-modal-content');
    this.modalEl.appendChild(content);
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = this.plugin.t('resetPlugin');
    content.appendChild(title);
    
    // 说明
    const desc = document.createElement('p');
    desc.innerHTML = this.plugin.t('howToReset');
    content.appendChild(desc);
    
    // 步骤列表
    const steps = document.createElement('ol');
    steps.classList.add('help-steps');
    
    const step1 = document.createElement('li');
    step1.innerHTML = this.plugin.t('closeObsidian');
    steps.appendChild(step1);
    
    const step2 = document.createElement('li');
    step2.innerHTML = this.plugin.t('navigateToVault');
    steps.appendChild(step2);
    
    const step3 = document.createElement('li');
    step3.innerHTML = this.plugin.t('openPluginFolder');
    steps.appendChild(step3);
    
    const step4 = document.createElement('li');
    step4.innerHTML = this.plugin.t('deleteDataFile');
    steps.appendChild(step4);
    
    const step5 = document.createElement('li');
    step5.innerHTML = this.plugin.t('restartObsidian');
    steps.appendChild(step5);
    
    content.appendChild(steps);
    
    // 警告
    const warning = document.createElement('div');
    warning.classList.add('help-warning');
    warning.innerHTML = this.plugin.t('thisWillReset');
    content.appendChild(warning);
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = this.plugin.t('gotIt');
    closeBtn.classList.add('password-btn', 'password-btn-primary');
    closeBtn.addEventListener('click', () => {
      this.close();
      if (this.closeCallback) {
        this.closeCallback();
      }
    });
    content.appendChild(closeBtn);
  }
  
}
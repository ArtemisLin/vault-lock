// src/lock-trigger.ts
import { App } from 'obsidian';
import PasswordLockPlugin from '../main';

export class LockTrigger {
  private app: App;
  private plugin: PasswordLockPlugin;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private windowBlurHandler: () => void;
  private userActivityHandler: () => void;

  constructor(app: App, plugin: PasswordLockPlugin) {
    this.app = app;
    this.plugin = plugin;
    
    // 绑定方法到this，以便在事件监听器中使用
    this.windowBlurHandler = this.handleWindowBlur.bind(this);
    this.userActivityHandler = this.handleUserActivity.bind(this);
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 初始化不活动检测
    this.startInactivityTracking();
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听窗口失去焦点事件
    window.addEventListener('blur', this.windowBlurHandler);
    
    // 监听用户活动事件
    const userActivityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    userActivityEvents.forEach(eventType => {
      document.addEventListener(eventType, this.userActivityHandler);
    });
  }

  // 清除事件监听器
  public clearEventListeners(): void {
    window.removeEventListener('blur', this.windowBlurHandler);
    
    const userActivityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    userActivityEvents.forEach(eventType => {
      document.removeEventListener(eventType, this.userActivityHandler);
    });
    
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // 处理窗口失去焦点
  private handleWindowBlur(): void {
    // 如果设置了切换窗口时锁定，则锁定保管库
    if (this.plugin.settings.lockOnWindowBlur) {
      this.plugin.lockVault();
    }
  }

  // 处理用户活动
  private handleUserActivity(): void {
    this.lastActivityTime = Date.now();
  }

  // 启动不活动跟踪
  private startInactivityTracking(): void {
    console.log('Starting inactivity tracking');

    // 清除现有定时器
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.plugin.settings.lockOnInactivity) {
      console.log('Inactivity tracking enabled with timeout:', this.plugin.settings.inactivityTimeout);
      // 设置定时器，每分钟检查一次不活动状态
      this.inactivityTimer = setInterval(() => {
        this.checkInactivity();
      }, 60000); // 每分钟检查一次
      
      // 立即重置活动时间
      this.lastActivityTime = Date.now();
    } else {
      console.log('Inactivity tracking disabled');  
    }
  }

  // 检查不活动状态
  private checkInactivity(): void {
    if (!this.plugin.settings.lockOnInactivity) {
      console.log('Inactivity check skipped - feature disabled');
      return;
    }
    
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - this.lastActivityTime) / (1000 * 60);
    
    console.log(`Checking inactivity: ${elapsedMinutes.toFixed(2)} minutes elapsed, threshold: ${this.plugin.settings.inactivityTimeout} minutes`);
    // 如果不活动时间超过设置的阈值，锁定保管库
    if (elapsedMinutes >= this.plugin.settings.inactivityTimeout) {
      console.log('Inactivity threshold reached, locking vault');
      this.plugin.lockVault();
    }
  }

  // 更新设置
  public updateSettings(): void {
    console.log('Updating lock trigger settings');
    // 重新启动不活动跟踪
    this.startInactivityTracking();
    // 确保窗口失去焦点的事件正确设置
    window.removeEventListener('blur', this.windowBlurHandler);
    if (this.plugin.settings.lockOnWindowBlur) {
      console.log('Setting up window blur handler');
      window.addEventListener('blur', this.windowBlurHandler);
    }
  }
}
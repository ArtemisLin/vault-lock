// src/settings.ts
import { PasswordUtils } from './password-utils';

export interface PasswordSettings {
  passwordHash: string;  // 密码的哈希值
  salt: string;         // 用于哈希的盐值
  lockOnStartup: boolean; // 启动时锁定
  lockOnInactivity: boolean; // 不活动时锁定
  lockOnWindowBlur: boolean; // 窗口失焦时锁定
  inactivityTimeout: number; // 不活动锁定的超时时间(分钟)
  attempts: number; // 密码尝试次数，用于限制暴力破解
  lastUnlockTime: number; // 上次解锁时间，用于超时判断
  lockedUntil: number; // 锁定结束时间，用于显示剩余锁定时间
  language: string; // 语言设置（'en' 或 'zh-cn'）
}

export const DEFAULT_SETTINGS: PasswordSettings = {
  passwordHash: '',
  salt: '',
  lockOnStartup: true,
  lockOnInactivity: true,
  lockOnWindowBlur: false, // 默认禁用窗口失焦锁定，防止新用户困惑
  inactivityTimeout: 5,
  attempts: 0,
  lastUnlockTime: 0,
  lockedUntil: 0,
  language: 'en' // 默认使用英文
}
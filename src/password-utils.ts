// src/password-utils.ts

export class PasswordUtils {
  // 生成随机盐值
  static generateSalt(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // 哈希密码 (使用Web Crypto API)
  static async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  // 验证密码
  static async verifyPassword(inputPassword: string, storedHash: string, salt: string): Promise<boolean> {
    if (!storedHash || !salt) return false;
    
    const inputHash = await PasswordUtils.hashPassword(inputPassword, salt);
    return inputHash === storedHash;
  }

  // 验证密码格式 (4位数字)
  static isValidPasswordFormat(password: string): boolean {
    return /^\d{4}$/.test(password);
  }

  // 格式化剩余锁定时间
  static formatRemainingTime(milliseconds: number): string {
    if (milliseconds <= 0) return '0 seconds';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else {
      return `${minutes} minute${minutes === 1 ? '' : 's'} and ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
    }
  }
}
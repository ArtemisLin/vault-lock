// src/folder-protection.ts
import { App, Notice } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import PasswordLockPlugin from '../main';

const execAsync = promisify(exec);

export class FolderProtection {
  private app: App;
  private plugin: PasswordLockPlugin;
  private folderLocked: boolean = false;
  private originalPermissions: string = '';

  constructor(app: App, plugin: PasswordLockPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  // 获取当前保管库的路径
  private getVaultPath(): string {
    // @ts-ignore - 使用未公开的Obsidian API
    return this.app.vault.adapter.basePath;
  }

  // 检查管理员权限
  private async checkAdminPrivileges(): Promise<boolean> {
    try {
      // 创建一个简单的测试文件来检查提升的权限
      const testFilePath = path.join(this.getVaultPath(), '.admin-test');
      
      // 尝试执行需要管理员权限的操作
      await execAsync(`icacls "${testFilePath}" /grant Administrators:F`);
      
      // 如果没有抛出错误，则有管理员权限
      // 清理测试文件
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      
      return true;
    } catch (error) {
      console.error('Admin privileges check failed:', error);
      return false;
    }
  }

  // 备份原始权限
  private async backupPermissions(): Promise<void> {
    try {
      const vaultPath = this.getVaultPath();
      const { stdout } = await execAsync(`icacls "${vaultPath}" /save "%TEMP%\\obsidian_acl_backup.txt" /T`);
      this.originalPermissions = path.join(process.env.TEMP || '', 'obsidian_acl_backup.txt');
      console.log('Original permissions saved to:', this.originalPermissions);
    } catch (error) {
      console.error('Failed to backup permissions:', error);
      throw error;
    }
  }

  // 锁定文件夹
  async lockFolder(): Promise<void> {
    if (this.folderLocked) return;

    const vaultPath = this.getVaultPath();
    
    // 检查管理员权限
    const hasAdmin = await this.checkAdminPrivileges();
    if (!hasAdmin) {
      new Notice('Folder protection requires admin privileges. Please run Obsidian as administrator.');
      return;
    }
    
    try {
      // 备份当前权限
      await this.backupPermissions();
      
      // 使用Windows的icacls命令来限制文件夹访问权限
      // 这会保留原有权限并为当前用户添加拒绝访问权限
      const username = process.env.USERNAME;
      await execAsync(`icacls "${vaultPath}" /deny "${username}":(OI)(CI)F`);
      
      this.folderLocked = true;
      console.log('Folder locked successfully:', vaultPath);
    } catch (error) {
      console.error('Failed to lock folder:', error);
      new Notice('Failed to lock vault folder. Check console for details.');
    }
  }

  // 解锁文件夹
  async unlockFolder(password: string): Promise<void> {
    if (!this.folderLocked) return;

    const vaultPath = this.getVaultPath();
    
    try {
      // 解除对用户的访问限制
      const username = process.env.USERNAME;
      await execAsync(`icacls "${vaultPath}" /remove:d "${username}"`);
      
      // 如果有原始权限备份，则恢复
      if (this.originalPermissions && fs.existsSync(this.originalPermissions)) {
        await execAsync(`icacls "${vaultPath}" /restore "${this.originalPermissions}"`);
        // 清理备份文件
        fs.unlinkSync(this.originalPermissions);
      }
      
      this.folderLocked = false;
      console.log('Folder unlocked successfully:', vaultPath);
    } catch (error) {
      console.error('Failed to unlock folder:', error);
      new Notice('Failed to unlock vault folder. Check console for details.');
    }
  }

  // 检查文件夹是否已锁定
  async checkFolderLockStatus(): Promise<boolean> {
    try {
      const vaultPath = this.getVaultPath();
      const { stdout } = await execAsync(`icacls "${vaultPath}"`);
      
      // 检查输出中是否包含当前用户的拒绝访问标记
      const username = process.env.USERNAME;
      const isDenied = stdout.includes(`${username}:(DENY)`);
      
      this.folderLocked = isDenied;
      return isDenied;
    } catch (error) {
      console.error('Failed to check folder lock status:', error);
      return false;
    }
  }
}
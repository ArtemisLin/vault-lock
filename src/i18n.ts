// src/i18n.ts
export interface Translations {
    enterPassword: string;
    forgotPassword: string;
    incorrectPassword: string;
    attemptsRemaining: string;
    lockedFor: string;
    setPassword: string;
    setPasswordDesc: string;
    confirmPassword: string;
    confirmPasswordDesc: string;
    passwordsNotMatch: string;
    lockVault: string;
    changePassword: string;
    manualLock: string;
    manualLockDesc: string;
    maxAttemptsReached: string;
    lockOnStartupDesc: string;
    lockOnInactivityDesc: string;
    inactivityTimeout: string;
    inactivityTimeoutDesc: string;
    lockOnWindowBlur: string;
    lockOnWindowBlurDesc: string;
    close: string;
    setNewPassword: string;
    setNewPasswordDesc: string;
    confirmNewPassword: string;
    confirmNewPasswordDesc: string;
    lockOnStartup: string;
    lockOnInactivity: string;
    resetPlugin: string;
    howToReset: string;
    closeObsidian: string;
    navigateToVault: string;
    openPluginFolder: string;
    deleteDataFile: string;
    restartObsidian: string;
    thisWillReset: string;
    gotIt: string;
    passwordResetHelp: string; // 新增：忘记密码的帮助信息
  }
  
  // 英文翻译
  export const EN: Translations = {
    enterPassword: "Enter Password",
    forgotPassword: "Forgot Password?",
    incorrectPassword: "Incorrect password.",
    attemptsRemaining: "attempt(s) remaining.",
    lockedFor: "Too many incorrect attempts. Locked for",
    setPassword: "Set Password",
    setPasswordDesc: "Please set a 4-digit password to lock your vault.",
    confirmPassword: "Confirm Password",
    confirmPasswordDesc: "Please enter your 4-digit password again to confirm.",
    passwordsNotMatch: "Passwords do not match. Please try again.",
    lockVault: "Lock Vault",
    changePassword: "Change Password",
    manualLock: "Manual Lock",
    manualLockDesc: "You can manually lock your vault at any time using the command \"Lock Vault\" from the command palette (Ctrl+P).",
    maxAttemptsReached: "Maximum attempts reached. Please reset the plugin manually.",
    lockOnStartupDesc: "Automatically lock the vault when Obsidian starts.",
    lockOnInactivityDesc: "Automatically lock the vault after a period of inactivity.",
    inactivityTimeout: "Inactivity timeout",
    inactivityTimeoutDesc: "Minutes of inactivity before locking the vault.",
    lockOnWindowBlur: "Lock when app loses focus",
    lockOnWindowBlurDesc: "Automatically lock the vault when switching to another application.",
    close: "Close",
    setNewPassword: "Set New Password",
    setNewPasswordDesc: "Please set a new 4-digit password for your vault.",
    confirmNewPassword: "Confirm New Password",
    confirmNewPasswordDesc: "Please enter your new 4-digit password again to confirm.",
    lockOnStartup: "Automatically lock on startup",
    lockOnInactivity: "Automatically lock on inactivity",
    resetPlugin: "How to Reset the Plugin",
    howToReset: "If you forgot your password, you can reset the plugin by following these steps:",
    closeObsidian: "Close Obsidian completely",
    navigateToVault: "Navigate to your vault folder",
    openPluginFolder: "Open the .obsidian/plugins/obsidian-password-lock/ folder",
    deleteDataFile: "Delete the data.json file",
    restartObsidian: "Restart Obsidian",
    thisWillReset: "This will reset all password settings, but will not affect your notes.",
    gotIt: "Got it",
    passwordResetHelp: "Forgot your password? You can reset the plugin by deleting the data.json file in your .obsidian/plugins/obsidian-password-lock/ folder.",
};

  // 简体中文翻译
  export const ZH_CN: Translations = {
    enterPassword: "输入密码",
    forgotPassword: "忘记密码？",
    incorrectPassword: "密码错误。",
    attemptsRemaining: "剩余尝试次数：",
    lockedFor: "尝试次数过多。锁定时间：",
    setPassword: "设置密码",
    setPasswordDesc: "请设置4位数字密码来锁定您的保管库。",
    confirmPassword: "确认密码",
    confirmPasswordDesc: "请再次输入您的4位数字密码进行确认。",
    passwordsNotMatch: "密码不匹配。请重试。",
    lockVault: "锁定保管库",
    changePassword: "更改密码",
    manualLock: "手动锁定",
    manualLockDesc: "您可以随时使用命令面板(Ctrl+P)中的\"锁定保管库\"命令手动锁定您的保管库。",
    maxAttemptsReached: "已达到最大尝试次数。请手动重置插件。",
    lockOnStartupDesc: "Obsidian启动时自动锁定保管库。",
    lockOnInactivityDesc: "一段时间不活动后自动锁定保管库。",
    inactivityTimeout: "不活动超时",
    inactivityTimeoutDesc: "锁定保管库前的不活动分钟数。",
    lockOnWindowBlur: "应用失去焦点时锁定",
    lockOnWindowBlurDesc: "切换到其他应用程序时自动锁定保管库。",
    close: "关闭",
    setNewPassword: "设置新密码",
    setNewPasswordDesc: "请为您的保管库设置新的4位数字密码。",
    confirmNewPassword: "确认新密码",
    confirmNewPasswordDesc: "请再次输入您的新4位数字密码进行确认。",
    lockOnStartup: "每次启动自动锁定",
    lockOnInactivity: "空闲时自动锁定",
    resetPlugin: "如何重置插件",
    howToReset: "如果您忘记了密码，可以通过以下步骤重置插件：",
    closeObsidian: "完全关闭Obsidian",
    navigateToVault: "导航到您的保管库文件夹",
    openPluginFolder: "打开 .obsidian/plugins/obsidian-password-lock/ 文件夹",
    deleteDataFile: "删除 data.json 文件",
    restartObsidian: "重启Obsidian",
    thisWillReset: "这将重置所有密码设置，但不会影响您的笔记。",
    gotIt: "知道了",
    passwordResetHelp: "忘记密码？您可以通过删除 .obsidian/plugins/obsidian-password-lock/ 文件夹中的 data.json 文件来重置插件。",
};
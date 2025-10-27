interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  enabled: boolean;
  interval: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
}

interface UserNotificationPreferences {
  email: NotificationChannel;
  sms: NotificationChannel;
  push: NotificationChannel;
  whatsapp: NotificationChannel;
}

interface EmergencyNotificationSettings {
  useProfileDefaults: boolean;
  overrideForEmergency: boolean;
  notificationStrategy: 'recipient-based' | 'document-based';
  channels: NotificationChannel[];
  schedulingOptions: {
    interval: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
}

interface EmergencyDocument {
  id: string;
  title: string;
  description: string;
  urgencyLevel: 'medium' | 'urgent' | 'high' | 'critical';
  submittedBy: string;
}

class EmergencyNotificationService {
  private static instance: EmergencyNotificationService;

  static getInstance(): EmergencyNotificationService {
    if (!EmergencyNotificationService.instance) {
      EmergencyNotificationService.instance = new EmergencyNotificationService();
    }
    return EmergencyNotificationService.instance;
  }

  // Get user notification preferences from profile
  private getUserPreferences(recipientId: string): UserNotificationPreferences {
    const saved = localStorage.getItem(`user-preferences-${recipientId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default preferences if none found
    return {
      email: { type: 'email', enabled: true, interval: 15, unit: 'minutes' },
      sms: { type: 'sms', enabled: false, interval: 30, unit: 'minutes' },
      push: { type: 'push', enabled: true, interval: 5, unit: 'minutes' },
      whatsapp: { type: 'whatsapp', enabled: false, interval: 1, unit: 'hours' }
    };
  }

  // Send notifications based on profile settings
  private async sendWithProfileSettings(
    recipients: string[],
    document: EmergencyDocument
  ): Promise<void> {
    for (const recipientId of recipients) {
      const preferences = this.getUserPreferences(recipientId);
      
      // Send notifications according to each recipient's preferences
      Object.values(preferences).forEach(channel => {
        if (channel.enabled) {
          this.scheduleNotification(recipientId, document, channel);
        }
      });
    }
  }

  // Send notifications with emergency override settings
  private async sendWithEmergencyOverride(
    recipients: string[],
    document: EmergencyDocument,
    settings: EmergencyNotificationSettings
  ): Promise<void> {
    if (settings.notificationStrategy === 'document-based') {
      // Same notification settings for all recipients
      recipients.forEach(recipientId => {
        settings.channels.forEach(channel => {
          this.scheduleNotification(recipientId, document, channel);
        });
      });
    } else {
      // Recipient-based: Use individual settings per recipient
      recipients.forEach(recipientId => {
        const recipientSettings = this.getRecipientSpecificSettings(recipientId, settings);
        recipientSettings.forEach(channel => {
          this.scheduleNotification(recipientId, document, channel);
        });
      });
    }
  }

  // Get recipient-specific notification settings
  private getRecipientSpecificSettings(
    recipientId: string,
    settings: EmergencyNotificationSettings
  ): NotificationChannel[] {
    const saved = localStorage.getItem(`emergency-recipient-settings-${recipientId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return settings.channels;
  }

  // Schedule notification delivery
  private scheduleNotification(
    recipientId: string,
    document: EmergencyDocument,
    channel: NotificationChannel
  ): void {
    const intervalMs = this.convertToMilliseconds(channel.interval, channel.unit);
    
    // Immediate notification for critical emergencies
    if (document.urgencyLevel === 'critical') {
      this.deliverNotification(recipientId, document, channel);
    }
    
    // Schedule recurring notifications
    const notificationId = `${document.id}-${recipientId}-${channel.type}`;
    
    setTimeout(() => {
      this.deliverNotification(recipientId, document, channel);
      
      // Set up recurring notifications
      const recurringInterval = setInterval(() => {
        this.deliverNotification(recipientId, document, channel);
      }, intervalMs);
      
      // Store interval ID for cleanup
      localStorage.setItem(`notification-interval-${notificationId}`, recurringInterval.toString());
    }, document.urgencyLevel === 'critical' ? 0 : intervalMs);
  }

  // Convert time units to milliseconds
  private convertToMilliseconds(interval: number, unit: string): number {
    const multipliers = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000
    };
    return interval * (multipliers[unit as keyof typeof multipliers] || multipliers.minutes);
  }

  // Deliver notification through specific channel
  private deliverNotification(
    recipientId: string,
    document: EmergencyDocument,
    channel: NotificationChannel
  ): void {
    const notification = {
      id: `${Date.now()}-${recipientId}`,
      recipientId,
      documentId: document.id,
      channel: channel.type,
      title: `EMERGENCY: ${document.title}`,
      message: document.description,
      urgencyLevel: document.urgencyLevel,
      timestamp: new Date().toISOString(),
      delivered: true
    };

    // Store notification log
    const logs = JSON.parse(localStorage.getItem('emergency-notification-logs') || '[]');
    logs.unshift(notification);
    localStorage.setItem('emergency-notification-logs', JSON.stringify(logs.slice(0, 1000)));

    // Simulate actual delivery based on channel
    switch (channel.type) {
      case 'email':
        console.log(`📧 Email sent to ${recipientId}: ${notification.title}`);
        break;
      case 'sms':
        console.log(`📱 SMS sent to ${recipientId}: ${notification.title}`);
        break;
      case 'push':
        this.sendBrowserNotification(notification);
        break;
      case 'whatsapp':
        console.log(`💬 WhatsApp sent to ${recipientId}: ${notification.title}`);
        break;
    }
  }

  // Send browser push notification
  private sendBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.urgencyLevel === 'critical'
      });
    }
  }

  // Main method to send emergency notifications
  async sendEmergencyNotification(
    recipients: string[],
    document: EmergencyDocument,
    settings: EmergencyNotificationSettings
  ): Promise<void> {
    if (settings.useProfileDefaults) {
      await this.sendWithProfileSettings(recipients, document);
    } else if (settings.overrideForEmergency) {
      await this.sendWithEmergencyOverride(recipients, document, settings);
    } else {
      // Fallback to profile settings
      await this.sendWithProfileSettings(recipients, document);
    }

    // Log emergency submission
    const emergencyLog = {
      id: document.id,
      document,
      recipients,
      settings,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    const logs = JSON.parse(localStorage.getItem('emergency-submissions') || '[]');
    logs.unshift(emergencyLog);
    localStorage.setItem('emergency-submissions', JSON.stringify(logs.slice(0, 100)));
  }

  // Get predefined scheduling intervals
  getSchedulingOptions(): Array<{value: string, label: string, interval: number, unit: string}> {
    return [
      { value: '1min', label: 'Every 1 minute', interval: 1, unit: 'minutes' },
      { value: '15min', label: 'Every 15 minutes', interval: 15, unit: 'minutes' },
      { value: '1hour', label: 'Hourly', interval: 1, unit: 'hours' },
      { value: '1day', label: 'Daily', interval: 1, unit: 'days' },
      { value: '1week', label: 'Weekly', interval: 1, unit: 'weeks' },
      { value: 'custom', label: 'Custom Interval', interval: 0, unit: 'minutes' }
    ];
  }

  // Stop all notifications for a document
  stopNotifications(documentId: string): void {
    const logs = JSON.parse(localStorage.getItem('emergency-notification-logs') || '[]');
    logs.forEach((log: any) => {
      if (log.documentId === documentId) {
        const intervalId = localStorage.getItem(`notification-interval-${log.id}`);
        if (intervalId) {
          clearInterval(parseInt(intervalId));
          localStorage.removeItem(`notification-interval-${log.id}`);
        }
      }
    });
  }
}

export const emergencyNotificationService = EmergencyNotificationService.getInstance();
export type { 
  NotificationChannel, 
  UserNotificationPreferences, 
  EmergencyNotificationSettings, 
  EmergencyDocument 
};
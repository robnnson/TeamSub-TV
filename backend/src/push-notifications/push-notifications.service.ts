import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from './entities/push-subscription.entity';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { UpdatePushSubscriptionDto } from './dto/update-push-subscription.dto';
import { OnEvent } from '@nestjs/event-emitter';
import * as webpush from 'web-push';

@Injectable()
export class PushNotificationsService {
  constructor(
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
  ) {
    // Initialize web-push with VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@teamsub-tv.local';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey,
      );
    } else {
      console.warn('VAPID keys not configured. Push notifications will not work.');
    }
  }

  async subscribe(
    userId: string,
    subscriptionDto: CreatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    // Check if subscription already exists
    const existing = await this.pushSubscriptionRepository.findOne({
      where: { endpoint: subscriptionDto.endpoint },
    });

    if (existing) {
      // Update existing subscription
      existing.userId = userId;
      existing.p256dhKey = subscriptionDto.keys.p256dh;
      existing.authKey = subscriptionDto.keys.auth;
      existing.preferences = subscriptionDto.preferences || existing.preferences;
      existing.isActive = true;
      return this.pushSubscriptionRepository.save(existing);
    }

    // Create new subscription using raw SQL to ensure userId is set correctly
    const preferences = subscriptionDto.preferences || {
      displayOffline: true,
      displayOnline: false,
      highErrors: true,
      lowUptime: true,
      performanceIssues: false,
    };

    const result = await this.pushSubscriptionRepository.query(
      `INSERT INTO push_subscriptions
        ("userId", endpoint, "p256dhKey", "authKey", preferences, "isActive")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        subscriptionDto.endpoint,
        subscriptionDto.keys.p256dh,
        subscriptionDto.keys.auth,
        JSON.stringify(preferences),
        true,
      ],
    );

    return result[0] as PushSubscription;
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.delete({ userId, endpoint });
  }

  async updatePreferences(
    userId: string,
    endpoint: string,
    updateDto: UpdatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    const subscription = await this.pushSubscriptionRepository.findOne({
      where: { userId, endpoint },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (updateDto.preferences) {
      subscription.preferences = {
        ...subscription.preferences,
        ...updateDto.preferences,
      };
    }

    if (updateDto.isActive !== undefined) {
      subscription.isActive = updateDto.isActive;
    }

    return this.pushSubscriptionRepository.save(subscription);
  }

  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this.pushSubscriptionRepository.find({
      where: { userId, isActive: true },
    });
  }

  async getAllActiveSubscriptions(): Promise<PushSubscription[]> {
    return this.pushSubscriptionRepository.find({
      where: { isActive: true },
    });
  }

  async sendNotification(
    subscription: PushSubscription,
    payload: any,
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey,
        },
      };

      const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      console.log(`Successfully sent push notification to ${subscription.endpoint.substring(0, 50)}...`, result.statusCode);
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // If subscription is invalid, mark as inactive
      if (error.statusCode === 410) {
        subscription.isActive = false;
        await this.pushSubscriptionRepository.save(subscription);
      }
    }
  }

  async broadcastToUser(userId: string, payload: any): Promise<number> {
    const subscriptions = await this.getUserSubscriptions(userId);
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await this.sendNotification(subscription, payload);
        sent++;
      } catch (error) {
        console.error(`Failed to send to subscription ${subscription.id}:`, error);
      }
    }

    return sent;
  }

  async broadcastToAll(payload: any): Promise<number> {
    const subscriptions = await this.getAllActiveSubscriptions();
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await this.sendNotification(subscription, payload);
        sent++;
      } catch (error) {
        console.error(`Failed to send to subscription ${subscription.id}:`, error);
      }
    }

    return sent;
  }

  // Event listeners for automatic notifications

  @OnEvent('display.offline')
  async handleDisplayOffline(event: {
    displayId: string;
    displayName: string;
    timestamp: string;
  }) {
    const payload = {
      title: '🔴 Display Offline',
      body: `${event.displayName} has gone offline`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: '/displays',
        displayId: event.displayId,
        timestamp: event.timestamp,
      },
      requireInteraction: true,
    };

    // Send to all users who want offline notifications
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { isActive: true },
    });

    for (const subscription of subscriptions) {
      if (subscription.preferences?.displayOffline !== false) {
        await this.sendNotification(subscription, payload);
      }
    }
  }

  @OnEvent('display.online')
  async handleDisplayOnline(event: {
    displayId: string;
    displayName: string;
    timestamp: string;
  }) {
    const payload = {
      title: '🟢 Display Online',
      body: `${event.displayName} is back online`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: '/displays',
        displayId: event.displayId,
        timestamp: event.timestamp,
      },
    };

    // Send to all users who want online notifications
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { isActive: true },
    });

    for (const subscription of subscriptions) {
      if (subscription.preferences?.displayOnline === true) {
        await this.sendNotification(subscription, payload);
      }
    }
  }

  @OnEvent('display.error.high')
  async handleHighSeverityError(event: {
    displayId: string;
    displayName: string;
    error: string;
    timestamp: string;
  }) {
    const payload = {
      title: '⚠️ Display Error',
      body: `${event.displayName}: ${event.error}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: '/displays',
        displayId: event.displayId,
        timestamp: event.timestamp,
      },
      requireInteraction: true,
    };

    // Send to all users who want high error notifications
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { isActive: true },
    });

    for (const subscription of subscriptions) {
      if (subscription.preferences?.highErrors !== false) {
        await this.sendNotification(subscription, payload);
      }
    }
  }
}

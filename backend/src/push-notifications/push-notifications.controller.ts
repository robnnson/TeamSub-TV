import {
  Controller,
  Post,
  Delete,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { UpdatePushSubscriptionDto } from './dto/update-push-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post('subscribe')
  async subscribe(
    @Request() req: any,
    @Body() subscriptionDto: CreatePushSubscriptionDto,
  ) {
    const subscription = await this.pushNotificationsService.subscribe(
      req.user.id,
      subscriptionDto,
    );

    return {
      message: 'Successfully subscribed to push notifications',
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        preferences: subscription.preferences,
      },
    };
  }

  @Delete('unsubscribe/:endpoint')
  async unsubscribe(
    @Request() req: any,
    @Param('endpoint') endpoint: string,
  ) {
    // Decode the endpoint
    const decodedEndpoint = decodeURIComponent(endpoint);

    await this.pushNotificationsService.unsubscribe(
      req.user.id,
      decodedEndpoint,
    );

    return {
      message: 'Successfully unsubscribed from push notifications',
    };
  }

  @Patch('preferences/:endpoint')
  async updatePreferences(
    @Request() req: any,
    @Param('endpoint') endpoint: string,
    @Body() updateDto: UpdatePushSubscriptionDto,
  ) {
    const decodedEndpoint = decodeURIComponent(endpoint);

    const subscription = await this.pushNotificationsService.updatePreferences(
      req.user.id,
      decodedEndpoint,
      updateDto,
    );

    return {
      message: 'Preferences updated successfully',
      subscription: {
        id: subscription.id,
        preferences: subscription.preferences,
      },
    };
  }

  @Get('subscriptions')
  async getSubscriptions(@Request() req: any) {
    const subscriptions = await this.pushNotificationsService.getUserSubscriptions(
      req.user.id,
    );

    return subscriptions.map(sub => ({
      id: sub.id,
      endpoint: sub.endpoint,
      preferences: sub.preferences,
      createdAt: sub.createdAt,
    }));
  }

  @Post('test')
  async sendTestNotification(@Request() req: any) {
    const count = await this.pushNotificationsService.broadcastToUser(
      req.user.id,
      {
        title: 'Test Notification',
        body: 'This is a test push notification from TeamSub-TV',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test',
        data: {
          url: '/',
          type: 'test',
        },
      },
    );

    return {
      message: `Test notification sent to ${count} subscription(s)`,
      count,
    };
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async broadcastNotification(
    @Body() payload: {
      title: string;
      body: string;
      url?: string;
    },
  ) {
    const count = await this.pushNotificationsService.broadcastToAll({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: payload.url || '/',
        type: 'broadcast',
      },
    });

    return {
      message: `Notification sent to ${count} subscription(s)`,
      count,
    };
  }
}

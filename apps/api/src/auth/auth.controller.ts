import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/permissions.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
  ) {
    return this.authService.login(
      body.email.toLowerCase(),
      body.password,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }, @Req() req: Request) {
    return this.authService.refresh(
      body.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
  ) {
    return this.authService.logout(user.id, body.refreshToken, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: user };
  }

  // ─── Super Admin TOTP Auth ─────────────────────────────────────

  @Public()
  @Post('super/login')
  superAdminLogin(
    @Body() body: { email: string; code: string },
    @Req() req: Request,
  ) {
    return this.authService.superAdminLogin(
      body.email,
      body.code,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ─── Customer Auth ─────────────────────────────────────────────

  @Public()
  @Post('customer/register')
  registerCustomer(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
    },
    @Req() req: Request,
  ) {
    return this.authService.registerCustomer(body, req.ip ?? undefined);
  }

  @Public()
  @Post('customer/login')
  loginCustomer(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
  ) {
    return this.authService.login(
      body.email.toLowerCase(),
      body.password,
      req.ip ?? undefined,
      req.get('user-agent') ?? undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/me')
  getCustomerProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.customerId) {
      return { success: false, message: 'Not a customer account' };
    }
    return this.authService.getCustomerProfile(user.customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('customer/profile')
  updateCustomerProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      city?: string;
      state?: string;
    },
  ) {
    if (!user.customerId) {
      return { success: false, message: 'Not a customer account' };
    }
    return this.authService.updateCustomerProfile(user.customerId, body);
  }
}

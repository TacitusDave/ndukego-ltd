import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Public } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /** Public — website reservation form submission */
  @Public()
  @Post('public')
  submitPublic(
    @Body()
    body: {
      propertyId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      message?: string;
      reservationAmount?: number;
    },
  ) {
    return this.reservationService.submitPublicReservation(body);
  }

  /** Admin — list all reservations */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query()
    query: {
      page?: string;
      limit?: string;
      status?: string;
      search?: string;
      propertyId?: string;
    },
  ) {
    return this.reservationService.findAll(query);
  }

  /** Customer — get own reservations */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    if (!user.customerId) {
      return { items: [] };
    }
    return this.reservationService.findMyReservations(user.customerId);
  }

  /** Admin — get single reservation */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(id);
  }

  /** Admin — reservation status history timeline */
  @UseGuards(JwtAuthGuard)
  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.reservationService.getTimeline(id);
  }

  /** Admin — update reservation status */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationService.updateStatus(
      id,
      body.status,
      body.notes,
      user.id,
    );
  }
}

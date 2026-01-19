import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateHoldDto } from './dto/create-hold.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { CreateBookingEnhancedDto } from './dto/create-booking-enhanced.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Ops: Bookings & Holds')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'Tenant', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('holds')
  @ApiOperation({ summary: 'Tạo hold tạm thời' })
  async createHold(@Req() req: any, @Body() dto: CreateHoldDto) {
    return this.bookingService.createHold(req.user.org_id, dto);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Tạo booking mới' })
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.create(req.user.org_id, req.user.sub, dto);
  }

  @Get('bookings/active')
  @Roles('Landlord', 'PropertyManager', 'OrgAdmin')
  @ApiOperation({ summary: 'Danh sách bookings đang sử dụng' })
  async getActiveBookings(@Req() req: any) {
    return this.bookingService.getActiveBookings(req.user.org_id, req.user.sub);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Danh sách bookings' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('tenant_party_id') tenantPartyId?: string,
  ) {
    return this.bookingService.findAll(req.user.org_id, req.user.sub, req.user.role, page, pageSize, tenantPartyId);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Chi tiết booking' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.findOne(req.user.org_id, id);
  }

  @Post('bookings/:id/confirm')
  @ApiOperation({ summary: 'Xác nhận booking' })
  async confirm(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.confirm(req.user.org_id, id);
  }

  @Post('bookings/:id/cancel')
  @ApiOperation({ summary: 'Hủy booking' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.cancel(req.user.org_id, id);
  }

  // ============ NEW ENDPOINTS FOR BOOKING PAGE ============

  @Post('bookings/check-availability')
  @Public()
  @ApiOperation({ summary: 'Kiểm tra tình trạng trống (Public)' })
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.bookingService.checkAvailabilityPublic(dto);
  }

  @Post('bookings/calculate-price')
  @Public()
  @ApiOperation({ summary: 'Tính giá booking (Public)' })
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.bookingService.calculatePrice(dto);
  }

  @Post('bookings/create-enhanced')
  @ApiOperation({ summary: 'Tạo booking với thông tin đầy đủ (Enhanced)' })
  async createEnhanced(@Req() req: any, @Body() dto: CreateBookingEnhancedDto) {
    return this.bookingService.createEnhanced(req.user.org_id, req.user.sub, dto);
  }

  @Post('bookings/quick-checkin')
  @Roles('Landlord', 'PropertyManager', 'OrgAdmin')
  @ApiOperation({ summary: 'Check-in nhanh cho khách walk-in' })
  async quickCheckin(@Req() req: any, @Body() dto: any) {
    return this.bookingService.quickCheckin(req.user.org_id, req.user.sub, dto);
  }

  @Post('bookings/checkout')
  @Roles('Landlord', 'PropertyManager', 'OrgAdmin')
  @ApiOperation({ summary: 'Check-out và tính tiền' })
  async checkout(@Req() req: any, @Body() dto: any) {
    return this.bookingService.checkout(req.user.org_id, req.user.sub, dto);
  }

  @Post('bookings/extend')
  @Roles('Landlord', 'PropertyManager', 'OrgAdmin')
  @ApiOperation({ summary: 'Gia hạn booking đang sử dụng' })
  async extendBooking(@Req() req: any, @Body() dto: any) {
    return this.bookingService.extendBooking(req.user.org_id, req.user.sub, dto);
  }

  @Get('bookings/timeline/:rentableItemId')
  @Public()
  @ApiOperation({ summary: 'Lấy timeline bookings cho rentable item (Public)' })
  async getBookingTimeline(
    @Param('rentableItemId') rentableItemId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.bookingService.getBookingTimeline(rentableItemId, startDate, endDate);
  }
}

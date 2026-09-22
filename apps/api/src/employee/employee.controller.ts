import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.employeeService.findAll({
      page,
      limit,
      search,
      departmentId,
      status,
    });
  }

  @Get('departments')
  getDepartments() {
    return this.employeeService.getDepartments();
  }

  @Get('roles')
  getRoles() {
    return this.employeeService.getRoles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      jobTitle: string;
      departmentId?: string;
      hireDate?: string;
      password: string;
    },
  ) {
    return this.employeeService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.employeeService.update(id, body as never);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.softDelete(id);
  }

  @Post(':id/roles')
  assignRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.employeeService.assignRole(id, body.roleId);
  }

  @Post(':id/roles/remove')
  removeRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.employeeService.removeRole(id, body.roleId);
  }
}

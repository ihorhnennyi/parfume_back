import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Вход админа' })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход. Возвращает только токены для безопасности.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string',
          description: 'Access токен (действителен 15 минут). Используйте в заголовке: Authorization: Bearer <token>'
        },
        refreshToken: { 
          type: 'string',
          description: 'Refresh токен (действителен 7 дней). Используйте для обновления access токена'
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(loginAdminDto.email, loginAdminDto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string',
          description: 'Новый access токен (действителен 15 минут)'
        },
        refreshToken: { 
          type: 'string',
          description: 'Новый refresh токен (действителен 7 дней)'
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверный или истекший refresh токен' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.adminService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Выход админа' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  async logout(@Request() req) {
    return this.adminService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить профиль админа' })
  @ApiResponse({
    status: 200,
    description: 'Профиль админа',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@Request() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}

